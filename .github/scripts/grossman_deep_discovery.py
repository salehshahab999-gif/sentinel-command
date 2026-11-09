import json, re
from pathlib import Path
from urllib.parse import urljoin, urlsplit
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

# 4) Load iBiblioteka's public runtime config and test its documented-by-code public search routes.
try:
    config_obj = None
    config_sources = [
        ("www-cachebusted", "https://www.ibiblioteka.lt/metis/assets/config.json", {"v":"7f67561c0"}),
        ("apex-cachebusted", "https://ibiblioteka.lt/metis/assets/config.json", {"v":"7f67561c0"}),
        ("www-no-cache", "https://www.ibiblioteka.lt/metis/assets/config.json", None),
        ("apex-no-cache", "https://ibiblioteka.lt/metis/assets/config.json", None),
    ]
    for label, url, params in config_sources:
        try:
            cr, cb = get(url, params, timeout=25, limit=1_000_000)
            txt = cb.decode("utf-8","replace")
            add("ibibl-config-probe",label=label,status=cr.status_code,url=cr.url,
                content_type=cr.headers.get("content-type"),sample=txt[:500])
            if cr.ok:
                candidate = json.loads(txt)
                if isinstance(candidate,dict) and candidate.get("apiUrl"):
                    config_obj = candidate
                    break
        except Exception as e:
            add("ibibl-config-probe",label=label,error=str(e))
    if config_obj:
        api_base = config_obj.get("apiUrl","")
        if not re.match(r"^https?://",api_base):
            # Runtime config is served from the apex host; use that same origin to avoid
            # www -> apex 302 redirects that silently convert POST requests to GET.
            origin = urlsplit(cr.url).scheme + "://" + urlsplit(cr.url).netloc
            api_base = origin.rstrip("/") + "/" + api_base.lstrip("/")
        add("ibibl-api-config",api_base=api_base,
            externalUrl=config_obj.get("externalUrl"),
            authConfigured=bool(config_obj.get("auth")))
        public_routes = [
            "/bibliographic-records/public/autocomplete",
            "/bibliographic-records/public/detailed-search/filter"
        ]
        for q in ["5-430-00856-7","5430008567","Жизнь и судьба","Žiznʹ i sudʹba"]:
            try:
                ur = api_base.rstrip("/") + public_routes[0]
                ar, ab = get(ur,{"searchText":q},timeout=35,limit=2_000_000)
                add("ibibl-autocomplete-query",query=q,status=ar.status_code,url=ar.url,
                    content_type=ar.headers.get("content-type"),
                    sample=ab.decode("utf-8","replace")[:5000])
            except Exception as e:
                add("ibibl-autocomplete-query",query=q,error=str(e))
        # Public detailed-search filter route; try minimal ISBN/title bodies to reveal the accepted shape.
        bodies = [
            {"searchText":"5-430-00856-7"},
            {"searchText":"5430008567","searchFields":["ISBN"],"page":0,"size":10},
            {"searchText":"Жизнь и судьба","searchFields":["TITLE"],"page":0,"size":10},
        ]
        for body in bodies:
            try:
                ur=api_base.rstrip("/") + public_routes[1]
                pr=S.post(ur,json=body,timeout=35,headers={"Content-Type":"application/json"},allow_redirects=False)
                pb=pr.content[:2_000_000]
                add("ibibl-detailed-search-probe",body=body,status=pr.status_code,url=pr.url,
                    content_type=pr.headers.get("content-type"),
                    sample=pb.decode("utf-8","replace")[:4500])
            except Exception as e:
                add("ibibl-detailed-search-probe",body=body,error=str(e))
    else:
        add("ibibl-api-config",result="No public assets/config.json response with apiUrl found")
except Exception as e:
    add("ibibl-api-config",error=str(e))

# 5) Extract the actual frontend request DTO call sites for public detailed search.
try:
    dto_needles=[
        "getDetailedSearchFilterResultView",
        "getDetailedSearchPageResultView",
        "getDetailedSearchFilter",
        "searchFields",
        "searchField",
        "searchText",
        "searchRequest",
        "searchCriteria",
        "SearchFilter",
        "ISBN",
        "ISBN_OR_ISSN_AND_TITLEVIEW"
    ]
    for u,t,n in assets:
        contexts=[]
        for needle in dto_needles:
            p=0; found=0
            while found<8:
                i=t.find(needle,p)
                if i<0: break
                contexts.append({"needle":needle,"context":t[max(0,i-800):i+1600]})
                p=i+len(needle); found+=1
        if contexts:
            add("ibibl-search-dto-contexts",url=u,contexts=contexts[:70])
except Exception as e:
    add("ibibl-search-dto-contexts",error=str(e))

# 6) Test likely request DTO shapes, now using the canonical apex API host.
try:
    if config_obj:
        api_base = "https://ibiblioteka.lt/metis-api"
        route = api_base + "/bibliographic-records/public/detailed-search/filter"
        bodies = [
            {"searchFields":[{"searchPhrase":"5-430-00856-7","searchField":"ISBN"}]},
            {"searchFields":[{"searchPhrase":"5430008567","searchField":"ISBN"}],
             "sourceTitleView":None,"source":None,"publicationTypes":[]},
            {"searchFields":[{"searchPhrase":"5-430-00856-7","searchField":"ISBN","phraseMatch":"EXACT_PHRASE"}],
             "sourceTitleView":None,"source":None,"publicationTypes":[],"page":0,"size":10},
            {"searchFields":[{"searchPhrase":"5-430-00856-7","searchField":"DEFAULT"}],
             "sourceTitleView":None,"source":None,"publicationTypes":[]},
        ]
        for body in bodies:
            try:
                pr=S.post(route,json=body,timeout=35,headers={"Content-Type":"application/json"},allow_redirects=False)
                pb=pr.content[:2_000_000]
                add("ibibl-dto-test",body=body,status=pr.status_code,
                    location=pr.headers.get("location"),content_type=pr.headers.get("content-type"),
                    sample=pb.decode("utf-8","replace")[:3500])
            except Exception as e:
                add("ibibl-dto-test",body=body,error=str(e))
        # unauthenticated by-ISBN route diagnostic only; no attempt to bypass login.
        try:
            r,b=get(api_base+"/bibliographic-records/by-isbn-issn-and-title",
                    {"isbn":"5-430-00856-7","title":"Жизнь и судьба"},timeout=25,limit=500_000)
            add("ibibl-auth-route-diagnostic",status=r.status_code,url=r.url,
                content_type=r.headers.get("content-type"),sample=b.decode("utf-8","replace")[:900])
        except Exception as e:
            add("ibibl-auth-route-diagnostic",error=str(e))
except Exception as e:
    add("ibibl-dto-test",error=str(e))

# Capture further enum and form-model source around key search DTO symbols.
try:
    for u,t,n in assets:
        contexts=[]
        for needle in ["addSearchField","searchPhrase","phraseMatch","EXACT_PHRASE","FAST_SEARCH",
                       "BibliographicRecordSearchFieldEnum","DEFAULT","ISBN","getDetailedSearchFilterResultView("]:
            p=0; hits=0
            while hits<4:
                i=t.find(needle,p)
                if i<0: break
                contexts.append({"needle":needle,"context":t[max(0,i-500):i+1250]})
                p=i+len(needle);hits+=1
        if contexts:
            add("ibibl-enum-model-contexts",url=u,contexts=contexts[:60])
except Exception as e:
    add("ibibl-enum-model-contexts",error=str(e))

# 7) Retry public filter search with the app's full default DetailedSearch model structure.
try:
    if config_obj:
        api="https://ibiblioteka.lt/metis-api"
        empty_date={"from":None,"to":None}
        selected={
          "audiences":[],"authors":[],"languages":[],"typeFilter":[],"subjects":[],
          "sources":[],"libraries":[],"releaseStatus":[],"rateAverages":[],
          "accessibleOnline":[],"accessiblePublications":[],"accessibilityFeatures":[],
          "mediaProperties":[],"recordStatuses":[],"dateRange":empty_date
        }
        library_data={
          "bookReceivedDateTypeEnumLastTwoWeeks":False,
          "bookReceivedDateTypeEnumLastMonth":False,
          "bookReceivedDateTypeEnumLastThreeMonths":False,
          "bookReceivedDateTypeEnumLastSixMonths":False,
          "bookReceivedDateTypeEnumLastYear":False,
          "bookReceivedDateTypes":[]
        }
        common={
          "hierarchicalListMode":False,"pageStartIndex":0,
          "selectedFilters":selected,"librariesData":[library_data],
          "publicationTypes":[],"publicationAttributes":[],"serialPublicationTypes":[],
          "publicationFormats":[],"rubricSubjects":[],"audiences":[],"udcSubjects":[],
          "articleSubjects":[],"publicationDateRange":empty_date,"publicationCountries":[],
          "languages":[],"translateFromLanguages":[],"pageSize":10,"page":0,
          "sortBy":"MATCH","recentlySearchedByFilters":False,"accessiblePublications":[],
          "accessibilityType":[],"informationAccessibilityMethod":[],
          "accessibilityFeatures":[],"accessibilityHazards":[],"contentManagement":[]
        }
        bodies=[
          {**common,"searchFields":[{"searchPhrase":"5430008567","searchField":"DEFAULT",
                                    "phraseMatch":"EXACT_PHRASE","logicalOperator":"AND","keywords":[]}]},
          {**common,"searchFields":[{"searchPhrase":"Жизнь и судьба","searchField":"DEFAULT",
                                    "phraseMatch":"EXACT_PHRASE","logicalOperator":"AND","keywords":[]}]},
          {**common,"searchFields":[{"searchPhrase":"5-430-00856-7","searchField":None,
                                    "phraseMatch":"EXACT_PHRASE","logicalOperator":"AND","keywords":[]}]},
        ]
        for body in bodies:
            try:
                pr=S.post(api+"/bibliographic-records/public/detailed-search/filter",json=body,
                          timeout=40,headers={"Content-Type":"application/json","Accept":"application/json"},
                          allow_redirects=False)
                pb=pr.content[:2_000_000]
                add("ibibl-full-model-search",searchFields=body["searchFields"],status=pr.status_code,
                    content_type=pr.headers.get("content-type"),sample=pb.decode("utf-8","replace")[:6000])
            except Exception as e:
                add("ibibl-full-model-search",searchFields=body["searchFields"],error=str(e))
except Exception as e:
    add("ibibl-full-model-search",error=str(e))

Path("grossman-deep-results.json").write_text(json.dumps(OUT,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(OUT,ensure_ascii=False,indent=2))
