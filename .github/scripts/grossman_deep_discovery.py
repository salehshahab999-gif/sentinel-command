import json, re
from pathlib import Path
from urllib.parse import urljoin
import requests

S = requests.Session()
S.headers.update({"User-Agent":"Mozilla/5.0 (compatible; GrossmanResearch/2.1)","Accept":"*/*"})
OUT = []

def add(kind, **data):
    OUT.append({"kind":kind, **data})

def request(url, params=None, timeout=30, limit=16_000_000):
    r = S.get(url, params=params, timeout=timeout, allow_redirects=True)
    return r, r.content[:limit]

# A. Internet Archive issue 9: metadata, alternate file hosts, and OCR term search.
item = "B-001-028-257-1988-09-PDF"
try:
    r, raw = request("https://archive.org/metadata/"+item, timeout=30)
    meta = json.loads(raw.decode("utf-8","replace")) if r.ok else {}
    fs = meta.get("files", [])
    textfile = next((f.get("name") for f in fs if f.get("name","").lower().endswith("_djvu.txt")), None)
    fileinfo = next((f for f in fs if f.get("name")==textfile), {}) if textfile else {}
    d1, d2, directory = meta.get("d1"), meta.get("d2"), meta.get("dir")
    add("ia9-metadata", status=r.status_code, title=meta.get("metadata",{}).get("title"),
        date=meta.get("metadata",{}).get("date"), d1=d1,d2=d2,dir=directory,
        textfile=textfile,textfile_size=fileinfo.get("size"),
        files=[{"name":f.get("name"),"size":f.get("size"),"format":f.get("format")}
               for f in fs if f.get("name","").lower().endswith((".pdf",".txt",".xml"))][:30])
    attempts = [
        ("archive-download","https://archive.org/download/"+item+"/"+textfile if textfile else None),
        ("archive-download-query","https://archive.org/download/"+item+"/"+textfile+"?download=1" if textfile else None),
        ("d1-direct",("https://"+d1+directory+"/"+textfile) if textfile and d1 and directory else None),
        ("d2-direct",("https://"+d2+directory+"/"+textfile) if textfile and d2 and directory else None),
    ]
    ocr = None
    for label, url in attempts:
        if not url: continue
        try:
            tr, tb = request(url, timeout=35, limit=12_000_000)
            sample = tb[:500].decode("utf-8","replace")
            add("ia9-ocr-fetch",label=label,url=tr.url,status=tr.status_code,
                content_type=tr.headers.get("content-type"),bytes=len(tb),sample=sample[:350])
            if tr.ok and len(tb)>1000 and b"html" not in tb[:100].lower():
                ocr = tb.decode("utf-8","replace")
                break
        except Exception as e:
            add("ia9-ocr-fetch",label=label,url=url,error=str(e))
    if ocr:
        hits=[]
        terms=["гроссман","лазарев","дух свободы","жизнь и судьба","свободы"]
        low=ocr.casefold()
        for term in terms:
            p=0
            while len(hits)<50:
                i=low.find(term.casefold(),p)
                if i<0: break
                hits.append({"term":term,"offset":i,
                    "context":re.sub(r"\s+"," ",ocr[max(0,i-220):i+440])})
                p=i+len(term)
        add("ia9-ocr-hits",ocr_chars=len(ocr),hits=hits[:40])
    else:
        add("ia9-ocr-hits",result="OCR file exists in item metadata, but all tested download hosts failed")
except Exception as e:
    add("ia9-error",error=str(e))

# B. DNB SRU: use documented CQL/Bath/DC indexes and MARCXML schema.
try:
    r,b=request("https://services.dnb.de/sru/dnb",
        {"version":"1.1","operation":"explain"},timeout=30,limit=2_000_000)
    x=b.decode("utf-8","replace")
    add("dnb-explain",status=r.status_code,url=r.url,content_type=r.headers.get("content-type"),
        sample=x[:6500])
except Exception as e:
    add("dnb-explain",error=str(e))

dnb_queries=[
    'bath.isbn="5-430-00856-7"',
    'bath.isbn="5430008567"',
    'dc.identifier="5-430-00856-7"',
    'dc.title any "Жизнь и судьба"',
    'dc.creator any "Гроссман"',
    'cql.anywhere any "5-430-00856-7"',
]
for q in dnb_queries:
    try:
        r,b=request("https://services.dnb.de/sru/dnb",
            {"version":"1.1","operation":"searchRetrieve","query":q,
             "maximumRecords":10,"startRecord":1,"recordSchema":"marcxml"},timeout=35,limit=3_000_000)
        x=b.decode("utf-8","replace")
        nr=re.search(r"<numberOfRecords>(.*?)</numberOfRecords>",x,re.S)
        fields=re.findall(r'<datafield[^>]+tag="(020|100|245|260|264|700|020)"[^>]*>(.*?)</datafield>',x,re.S)
        parsed=[]
        for tag, inner in fields[:50]:
            subs=re.findall(r'<subfield[^>]+code="([^"]+)"[^>]*>(.*?)</subfield>',inner,re.S)
            parsed.append({"tag":tag,"subfields":[(c,re.sub(r"<[^>]+>","",v).strip()) for c,v in subs]})
        add("dnb-query",query=q,status=r.status_code,numberOfRecords=nr.group(1) if nr else None,
            fields=parsed,diagnostics=re.findall(r"<diag:message>(.*?)</diag:message>",x,re.S),
            sample=x[:1000] if not nr else None)
    except Exception as e:
        add("dnb-query",query=q,error=str(e))

# C. German union catalog SRU candidate (KOBV/GVI), exact ISBN and Russian title.
for q in ['dc.identifier="5-430-00856-7"','bath.isbn="5-430-00856-7"','dc.title any "Жизнь и судьба"']:
    try:
        r,b=request("https://sru.kobv.de/gvi",
            {"version":"1.2","operation":"searchRetrieve","query":q,
             "maximumRecords":10,"startRecord":1,"recordSchema":"marcxml"},timeout=35,limit=2_500_000)
        x=b.decode("utf-8","replace")
        nr=re.search(r"<numberOfRecords>(.*?)</numberOfRecords>",x,re.S)
        titles=re.findall(r'<datafield[^>]+tag="245"[^>]*>(.*?)</datafield>',x,re.S)
        add("kobv-gvi",query=q,status=r.status_code,numberOfRecords=nr.group(1) if nr else None,
            title_fields=[re.sub(r"<[^>]+>"," ",v).strip() for v in titles[:10]],sample=x[:1000] if not nr else None)
    except Exception as e:
        add("kobv-gvi",query=q,error=str(e))

# D. iBiblioteka: inspect Angular root, main bundle, and lazy-loaded JS chunks for API constants.
base="https://www.ibiblioteka.lt/metis/"
try:
    r,raw=request(base,timeout=30)
    page=raw.decode("utf-8","replace")
    scripts=re.findall(r'<script[^>]+src=["\']([^"\']+)["\']',page,re.I)
    links=re.findall(r'<link[^>]+href=["\']([^"\']+)["\']',page,re.I)
    jslinks=[u for u in (scripts+links) if re.search(r"\.js(?:\?|$)",u,re.I)]
    urls=[]
    for u in jslinks:
        full=urljoin(base,u)
        if full not in urls: urls.append(full)
    add("ibibl-shell",status=r.status_code,final_url=r.url,
        title=(re.search(r"<title[^>]*>(.*?)</title>",page,re.I|re.S).group(1)
               if re.search(r"<title[^>]*>(.*?)</title>",page,re.I|re.S) else None),
        js_assets=urls[:80])
    needles=[
      "BIBLIOGRAPHIC_RECORDS_AUTOCOMPLETE_SEARCH",
      "BIBLIOGRAPHIC_RECORDS_DETAILED_SEARCH_FILTER",
      "AUTHENTICATED_BIBLIOGRAPHIC_RECORDS_DETAILED_SEARCH_FILTER",
      "apiUrl","apiBaseUrl","baseUrl","backendUrl","isbn","graphql"
    ]
    for u in urls[:80]:
        try:
            ar,ab=request(u,timeout=30,limit=12_000_000)
            if not ar.ok: 
                add("ibibl-js",url=u,status=ar.status_code); continue
            t=ab.decode("utf-8","replace")
            routes=re.findall(r'["\']([^"\']{1,260})["\']',t)
            routes=[v for v in routes if ("/" in v and any(k in v.casefold() for k in ["api","search","record","bibliographic","catalog","isbn","publication"])) or v.startswith("http")]
            contexts=[]
            for needle in needles:
                p=0; count=0
                while count<4:
                    i=t.casefold().find(needle.casefold(),p)
                    if i<0: break
                    contexts.append({"needle":needle,"context":t[max(0,i-260):i+520]})
                    p=i+len(needle);count+=1
            if routes or contexts:
                add("ibibl-js",url=u,status=ar.status_code,bytes=len(ab),
                    route_strings=list(dict.fromkeys(routes))[:100],contexts=contexts[:25])
        except Exception as e:
            add("ibibl-js",url=u,error=str(e))
except Exception as e:
    add("ibibl-shell",error=str(e))

Path("grossman-deep-results.json").write_text(json.dumps(OUT,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(OUT,ensure_ascii=False,indent=2))
