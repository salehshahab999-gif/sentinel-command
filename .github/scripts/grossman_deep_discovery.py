import json, re
from pathlib import Path
from urllib.parse import urljoin
import xml.etree.ElementTree as ET
import requests

S = requests.Session()
S.headers.update({"User-Agent":"Mozilla/5.0 (compatible; GrossmanResearch/2.2)","Accept":"*/*"})
OUT=[]

def add(kind, **d): OUT.append({"kind":kind, **d})
def get(url, params=None, timeout=30, limit=18_000_000):
    r=S.get(url,params=params,timeout=timeout,allow_redirects=True)
    return r, r.content[:limit]

# 1) KOBV/GVI: full MARCXML record for the exact Kaunas ISBN and holding fields.
def parse_marc(xml_bytes):
    root=ET.fromstring(xml_bytes)
    ns={"m":"http://www.loc.gov/MARC21/slim","zs":"http://www.loc.gov/zing/srw/"}
    n=root.findtext(".//zs:numberOfRecords",default=None, namespaces=ns)
    fields=[]
    for df in root.findall(".//m:datafield",ns):
        tag=df.attrib.get("tag","")
        if tag in {"020","035","040","041","100","245","260","264","300","500","505","700","852","856","866","900","901","910","930","949","950","991"}:
            subs=[]
            for sf in df.findall("m:subfield",ns):
                val="".join(sf.itertext()).strip()
                subs.append((sf.attrib.get("code"),val[:500]))
            fields.append({"tag":tag,"ind1":df.attrib.get("ind1"),"ind2":df.attrib.get("ind2"),"subfields":subs})
    ids=[c.text for c in root.findall(".//m:controlfield[@tag='001']",ns)]
    return n,ids,fields

kobv_queries=[
    'dc.identifier="5-430-00856-7"',
    'dc.identifier="5430008567"',
    'dc.title any "Žizn i sudba"',
    'dc.title any "Zhizn i sudba"',
    'dc.creator any "Grossman"'
]
for q in kobv_queries:
    try:
        r,b=get("https://sru.kobv.de/gvi",
            {"version":"1.2","operation":"searchRetrieve","query":q,
             "maximumRecords":10,"startRecord":1,"recordSchema":"marcxml"},timeout=35,limit=5_000_000)
        try:
            count,ids,fields=parse_marc(b)
        except Exception as e:
            count,ids,fields=None,[],[]
            add("kobv-xml-error",query=q,error=str(e),sample=b[:1600].decode("utf-8","replace"))
        add("kobv-full",query=q,status=r.status_code,numberOfRecords=count,ids=ids,fields=fields,
            url=r.url)
    except Exception as e:
        add("kobv-full",query=q,error=str(e))

# 2) DNB: the Explain response showed DNB-specific indexes; retry without recordSchema
# (the previous "dc"/"marcxml" values were rejected by this endpoint).
dnb_queries=[
    'dnb.per any "Grossman"',
    'dnb.an any "Grossman"',
    'dnb.ka any "Grossman"',
    'dc.title any "Жизнь и судьба"',
    'dc.title any "Zhizn i sudba"',
    'cql.anywhere any "5-430-00856-7"',
    'cql.anywhere any "Grossman Leben und Schicksal"'
]
for q in dnb_queries:
    for schema in [None,"MARC21-xml"]:
        try:
            params={"version":"1.1","operation":"searchRetrieve","query":q,
                    "maximumRecords":10,"startRecord":1}
            if schema: params["recordSchema"]=schema
            r,b=get("https://services.dnb.de/sru/dnb",params,timeout=35,limit=3_000_000)
            x=b.decode("utf-8","replace")
            count=re.search(r"<(?:[a-zA-Z0-9]+:)?numberOfRecords>(.*?)</",x,re.S)
            records=re.findall(r"<(?:[a-zA-Z0-9]+:)?recordData>(.*?)</(?:[a-zA-Z0-9]+:)?recordData>",x,re.S)
            titles=re.findall(r'<datafield[^>]+tag="245"[^>]*>(.*?)</datafield>',x,re.S)
            add("dnb-retry",query=q,schema=schema,status=r.status_code,
                numberOfRecords=count.group(1) if count else None,
                titles=[re.sub(r"<[^>]+>"," ",t).strip()[:300] for t in titles[:10]],
                diagnostics=re.findall(r"<(?:[a-zA-Z0-9]+:)?message>(.*?)</",x,re.S),
                sample=x[:900] if not count else None)
        except Exception as e:
            add("dnb-retry",query=q,schema=schema,error=str(e))

# 3) iBiblioteka: recursively inspect JS bundles imported by the Angular app.
base="https://www.ibiblioteka.lt/metis/"
try:
    r,b=get(base,timeout=30)
    page=b.decode("utf-8","replace")
    starts=re.findall(r'<script[^>]+src=["\']([^"\']+)["\']',page,re.I)
    links=re.findall(r'<link[^>]+href=["\']([^"\']+)["\']',page,re.I)
    queue=[]
    for u in starts+links:
        if re.search(r"\.js(?:\?|$)",u,re.I):
            queue.append(urljoin(base,u))
    seen=set()
    assets=[]
    while queue and len(seen)<120:
        u=queue.pop(0)
        if u in seen: continue
        seen.add(u)
        try:
            ar,ab=get(u,timeout=30,limit=8_000_000)
            if not ar.ok: 
                add("ibibl-import-fail",url=u,status=ar.status_code); continue
            t=ab.decode("utf-8","replace")
            assets.append((u,t,len(ab)))
            # Follow locally imported hashed chunks.
            for rel in re.findall(r'(?:from|import)\s*["\']([^"\']+\.js)["\']',t):
                v=urljoin(u,rel)
                if v not in seen and v not in queue: queue.append(v)
        except Exception as e:
            add("ibibl-import-fail",url=u,error=str(e))
    add("ibibl-recursive-scan",root_status=r.status_code,assets_downloaded=len(assets),
        assets=[{"url":u,"bytes":n} for u,t,n in assets])
    needles=[
      "BIBLIOGRAPHIC_RECORDS_AUTOCOMPLETE_SEARCH",
      "BIBLIOGRAPHIC_RECORDS_DETAILED_SEARCH_FILTER",
      "AUTHENTICATED_BIBLIOGRAPHIC_RECORDS_DETAILED_SEARCH_FILTER",
      "apiUrl","apiBaseUrl","baseApiUrl","backendUrl","environment",
      "APP_CONFIG","config.json","ISBN"
    ]
    all_api_urls=[]
    for u,t,n in assets:
        contexts=[]
        for needle in needles:
            p=0; hits=0
            while hits<5:
                i=t.casefold().find(needle.casefold(),p)
                if i<0: break
                contexts.append({"needle":needle,"context":t[max(0,i-300):i+850]})
                p=i+len(needle); hits+=1
        # Keep quoted strings that look like internal API endpoints or service roots.
        strings=re.findall(r'["\']([^"\']{1,260})["\']',t)
        candidates=[v for v in strings if
            re.search(r"(?:/api/|/api$|/rest/|bibliographic-records|detailed-search|autocomplete|^/v\d+/)",v,re.I)]
        all_api_urls += [v for v in candidates if v not in all_api_urls]
        if contexts or candidates:
            add("ibibl-js-deep",url=u,bytes=n,contexts=contexts[:35],
                api_route_strings=list(dict.fromkeys(candidates))[:80])
    add("ibibl-unique-api-strings",values=all_api_urls[:200])
except Exception as e:
    add("ibibl-recursive-scan",error=str(e))

Path("grossman-deep-results.json").write_text(json.dumps(OUT,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(OUT,ensure_ascii=False,indent=2))
