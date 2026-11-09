import json, re, time
from pathlib import Path
from urllib.parse import urljoin
import requests

S = requests.Session()
S.headers.update({"User-Agent": "Mozilla/5.0 (compatible; GrossmanResearch/2.0)", "Accept": "*/*"})
OUT = []

def record(kind, **kw):
    OUT.append({"kind": kind, **kw})

def get(url, params=None, timeout=25, max_bytes=12_000_000):
    r = S.get(url, params=params, timeout=timeout, allow_redirects=True)
    data = r.content[:max_bytes]
    return r, data

# 1) Internet Archive: inspect the actual September 1988 issue and its OCR files.
item_id = "B-001-028-257-1988-09-PDF"
try:
    r, body = get(f"https://archive.org/metadata/{item_id}", timeout=30)
    meta = json.loads(body.decode("utf-8", "replace")) if r.ok else {}
    files = meta.get("files", [])
    wanted = []
    for f in files:
        name = f.get("name", "")
        if re.search(r"(djvu\.txt|\.txt$|\.pdf$|djvu\.xml$)", name, re.I):
            wanted.append({"name": name, "size": f.get("size"), "format": f.get("format")})
    record("archive-issue9-metadata", status=r.status_code, identifier=item_id,
           metadata=meta.get("metadata", {}), files=wanted[:60],
           item_url=f"https://archive.org/details/{item_id}")
    text_file = next((x["name"] for x in wanted if re.search(r"djvu\.txt$", x["name"], re.I)), None)
    if text_file:
        tr, tb = get(f"https://archive.org/download/{item_id}/{text_file}", timeout=45, max_bytes=35_000_000)
        ocr = tb.decode("utf-8", "replace")
        terms = ["гроссман", "лазaрев", "лазарев", "дух свободы", "духъ свободы", "жизнь и судьба"]
        hits = []
        lower = ocr.casefold()
        for term in terms:
            start = 0
            while len(hits) < 50:
                pos = lower.find(term.casefold(), start)
                if pos < 0:
                    break
                hits.append({"term": term, "offset": pos,
                             "context": re.sub(r"\s+", " ", ocr[max(0,pos-240):pos+520])})
                start = pos + len(term)
        record("archive-issue9-ocr", status=tr.status_code, file=text_file,
               bytes_downloaded=len(tb), ocr_chars=len(ocr), term_hits=hits[:40])
    else:
        record("archive-issue9-ocr", result="No *_djvu.txt file listed in item metadata")
except Exception as e:
    record("archive-issue9-error", error=str(e))

# 2) Search the Internet Archive catalog with variant bibliographic fingerprints.
ia_queries = [
    'title:"Знамя" AND year:1988',
    '"5-430-00856-7"',
    '"5430008567"',
    '"5 430 00856 7"',
    '"Жизнь и судьба" AND Гроссман AND year:1990',
    '"Каунас" AND "Гроссман"',
    '"Швиеса" AND "Гроссман"',
    'creator:"Grossman, Vasily" AND year:1990'
]
for q in ia_queries:
    try:
        r, b = get("https://archive.org/advancedsearch.php",
                   {"q": q, "fl[]": ["identifier","title","year","creator","mediatype"],
                    "rows": 50, "page": 1, "output": "json"})
        j = json.loads(b.decode("utf-8", "replace")) if r.ok else {}
        docs = j.get("response", {}).get("docs", [])
        record("ia-catalog-query", query=q, status=r.status_code,
               numFound=j.get("response", {}).get("numFound"), docs=docs[:50])
    except Exception as e:
        record("ia-catalog-query", query=q, error=str(e))

# 3) DNB SRU: retry without the invalid recordSchema, using likely indexes and variants.
dnb_queries = [
    'pica.isb=5430008567',
    'pica.isb="5430008567"',
    'pica.isb="5-430-00856-7"',
    'pica.tit="Жизнь и судьба"',
    'pica.tit="Zhizn i sudba"',
    'pica.per="Гроссман"'
]
for q in dnb_queries:
    try:
        r, b = get("https://services.dnb.de/sru/dnb",
                   {"version":"1.1", "operation":"searchRetrieve", "query":q,
                    "maximumRecords":10, "startRecord":1}, timeout=35)
        xml = b.decode("utf-8", "replace")
        count = re.search(r"<numberOfRecords>(.*?)</numberOfRecords>", xml, re.S)
        recs = re.findall(r"<recordData>(.*?)</recordData>", xml, re.S)
        titles = re.findall(r"<(?:dc:)?title[^>]*>(.*?)</(?:dc:)?title>", xml, re.S)
        ids = re.findall(r"<(?:dc:)?identifier[^>]*>(.*?)</(?:dc:)?identifier>", xml, re.S)
        record("dnb-sru", query=q, status=r.status_code, url=r.url,
               numberOfRecords=count.group(1) if count else None,
               titles=[re.sub(r"<[^>]+>"," ",x).strip() for x in titles[:15]],
               identifiers=[re.sub(r"<[^>]+>"," ",x).strip() for x in ids[:20]],
               xml_sample=xml[:2600] if not count else None)
    except Exception as e:
        record("dnb-sru", query=q, error=str(e))

# 4) iBiblioteka: inspect the Angular app's bootstrap files and JS bundles for real API routes.
base = "https://www.ibiblioteka.lt/metis/"
try:
    r, b = get(base, timeout=30)
    page = b.decode("utf-8", "replace")
    scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', page, re.I)
    links = re.findall(r'<link[^>]+href=["\']([^"\']+)["\']', page, re.I)
    record("ibiblioteka-shell", status=r.status_code, final_url=r.url,
           title=(re.search(r"<title[^>]*>(.*?)</title>", page, re.I|re.S).group(1)
                  if re.search(r"<title[^>]*>(.*?)</title>", page, re.I|re.S) else None),
           scripts=scripts[:40], links=links[:40])
    asset_urls = []
    for src in scripts:
        u = urljoin(base, src)
        if u not in asset_urls:
            asset_urls.append(u)
    # Probe conventional public runtime/config files as well.
    asset_urls += [urljoin(base, x) for x in [
        "assets/config.json", "assets/config/config.json", "config.json",
        "env.js", "assets/env.js", "ngsw.json", "manifest.webmanifest"
    ]]
    seen = set()
    for u in asset_urls[:35]:
        if u in seen: 
            continue
        seen.add(u)
        try:
            ar, ab = get(u, timeout=30, max_bytes=10_000_000)
            if not ar.ok:
                record("ibiblioteka-asset", url=u, status=ar.status_code)
                continue
            text = ab.decode("utf-8", "replace")
            # Extract likely service roots, API routes, and nearby code context.
            patterns = [
                r'(?i)(?:https?://[a-z0-9._:-]+)?[^"\'\s<>]{0,100}/api/[^"\'\s<>]{1,180}',
                r'(?i)(?:apiUrl|apiURL|apiBaseUrl|baseApiUrl|backendUrl|serviceUrl|apiEndpoint)["\']?\s*[:=]\s*["\']([^"\']{1,300})',
                r'(?i)[^"\'\s<>]{0,100}(?:search|catalog|record|document|isbn|opac)[^"\'\s<>]{0,120}'
            ]
            found = []
            for pat in patterns:
                for m in re.finditer(pat, text):
                    value = m.group(0)[:340]
                    found.append(value)
                    if len(found) >= 100:
                        break
                if len(found) >= 100:
                    break
            # Keep targeted snippets only, not entire bundles.
            contexts = []
            for needle in ["api/", "search", "catalog", "isbn", "backend", "graphql", "rest/"]:
                pos = 0
                while len(contexts) < 35:
                    at = text.casefold().find(needle, pos)
                    if at < 0:
                        break
                    contexts.append({"needle":needle, "context":text[max(0,at-130):at+260]})
                    pos = at + len(needle)
            record("ibiblioteka-asset", url=u, final_url=ar.url, status=ar.status_code,
                   bytes=len(ab), content_type=ar.headers.get("content-type"),
                   api_route_candidates=list(dict.fromkeys(found))[:100], contexts=contexts[:35])
        except Exception as e:
            record("ibiblioteka-asset", url=u, error=str(e))
except Exception as e:
    record("ibiblioteka-shell", error=str(e))

# 5) Save compact machine-readable output and print it into the Actions log.
Path("grossman-deep-results.json").write_text(
    json.dumps(OUT, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(OUT, ensure_ascii=False, indent=2))
