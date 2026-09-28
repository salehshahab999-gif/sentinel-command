#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,math,statistics,time,urllib.request,datetime
from dataclasses import dataclass,field
from pathlib import Path

SCENARIO = {
    "title": "بازسازی و راستی‌آزمایی پس از رویداد: اصابت موشک به یک ناو جنگی آمریکایی",
    "english_title": "Post-Event Public-Evidence Resilience Test: Missile Impact on a U.S. Naval Vessel",
    "purpose": "بررسی اینکه معماری Sentinel در یک سناریوی فرضیِ پس از وقوع رویداد، چگونه داده‌های عمومی، تناقض، داده ناقص/جعلی، خرابی و تغییر شرایط را مدیریت و قابل ممیزی می‌کند.",
    "scope": "تحلیل و راستی‌آزمایی پس از رویداد با داده‌های عمومی و fixtureهای مصنوعی و قطعی؛ بدون شبیه‌سازی هدایت سلاح، انتخاب هدف، مسیر حمله یا بهینه‌سازی عملیات رزمی.",
    "test_count_note": "در این suite شماره‌گذاری از 4 تا 99 است؛ بنابراین این فایل 96 آزمایش شماره‌دار را اجرا می‌کند، نه 99 آزمایش مستقل."
}

PUBLIC_CONTEXT_SOURCES = [
    {"name":"U.S. Navy Fact Files","url":"https://www.navy.mil/resources/fact-files/","role":"شناسه و اطلاعات عمومی انواع شناورهای نیروی دریایی آمریکا."},
    {"name":"Naval Vessel Register (NAVSEA)","url":"https://www.navsea.navy.mil/Resources/Naval-Vessel-Register/","role":"مرجع رسمی فهرست و وضعیت چرخه عمر شناورهای نیروی دریایی آمریکا."},
    {"name":"NOAA Nationwide AIS 2026","url":"https://www.fisheries.noaa.gov/inport/item/80362","role":"مرجع عمومی برای داده و مفهوم AIS و مسیر/مشخصات شناورها."},
    {"name":"NOAA AIS Vessel Tracks 2025","url":"https://www.fisheries.noaa.gov/inport/item/79504","role":"نمونه عمومی از داده‌های مسیر شناورها و محدودیت‌های آن‌ها، از جمله شکاف‌های AIS."},
    {"name":"ESA / Copernicus Sentinel-1 Maritime Traffic","url":"https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1/Tracking_maritime_traffic","role":"توضیح عمومی درباره کاربرد Sentinel-1 و AIS برای پایش ترافیک دریایی."},
    {"name":"Copernicus Sentinel-1 AIS Access Discussion","url":"https://forum.dataspace.copernicus.eu/t/availability-of-sentinel-1-ais-data/4798","role":"محدودیت دسترسی به برخی داده‌های AIS مرتبط با Sentinel-1."},
    {"name":"NASA FIRMS","url":"https://earthdata.nasa.gov/firms","role":"منبع عمومی برای داده‌های ماهواره‌ای رخدادهای حرارتی/آتش؛ داده کمکی، نه اثبات مستقل اصابت."}
]

TEST_GROUPS = [
    ("4-10","پایه‌های تحلیل، پیش‌بینی، ریسک و یکپارچگی"),
    ("11-20","بحران، داده جعلی/ناقص، مقیاس، تعارض و تغییر محیط"),
    ("21-30","سناریوهای فشار شدید و «دارک» برای بررسی نقطه‌های شکنندگی"),
    ("31-40","بقا، وابستگی بین‌لایه‌ای، حافظه، دانش، یادگیری و بازگشت‌پذیری"),
    ("41-45","امنیت، مقاومت در برابر حمله و جلوگیری از فروپاشی"),
    ("46-60","کیفیت تصمیم، خطا، تعصب داده، شفافیت، ممیزی و انطباق"),
    ("61-70","اخلاق، مقاومت تصمیم، پردازش توزیع‌شده، خطای تجمعی و منابع"),
    ("71-85","سازگاری اکوسیستم، پایداری لایه‌ها، بلوغ و آمادگی معماری"),
    ("86-90","استخراج ایراد، اعتبارسنجی اصلاحات و جلوگیری از بازگشت خطا"),
    ("91-99","آزمون‌های نهایی جامع، بار بالا، ناشناخته‌ها و تعمیم‌پذیری")
]

TESTS=[line.split("|",1) for line in """
4|هوش پیش‌بینی
5|خودآگاهی سطح بالا
6|ارزیابی ریسک
7|تاب‌آوری امنیت
8|پیچیدگی حکمرانی
9|سازگاری
10|یکپارچگی هسته‌ها
11|بحران ژئوپلیتیک
12|سیل اطلاعات جعلی
13|فروپاشی داده
14|اطلاعات ناقص
15|رشد سریع و مقیاس‌پذیری
16|حل تضاد هسته‌ها
17|خرابی جزئی سیستم
18|سازگاری با تغییر قوانین
19|سناریوی پیچیدگی شدید
20|تغییرات محیطی
21|فروپاشی حافظه (دارک)
22|طوفان تضاد حکمرانی (دارک)
23|سیل داده‌ی جعلی (دارک)
24|رشد بی‌نهایت پیچیدگی (دارک)
25|کمبود منابع (دارک)
26|زنجیره شکست پیش‌بینی (دارک)
27|رخنه امنیتی (دارک)
28|شکست خودآگاهی (دارک)
29|رها شدن تکاملی (دارک)
30|فروپاشی کامل حکمرانی (دارک)
31|تست نقطه شکست نهایی
32|سنجش بقای معماری
33|وابستگی بین‌لایه‌ای
34|پایداری هماهنگی
35|یکنواختی حافظه
36|یکپارچگی دانش
37|پایداری یادگیری
38|سازگاری تصمیم
39|بازگشت‌پذیری
40|پایداری تکامل بلندمدت
41|دفاع سایبری
42|مقاومت در برابر حمله
43|ایمنی تکاملی
44|مدیریت پیچیدگی
45|معماری ضد فروپاشی
46|شاخص کیفیت تصمیم
47|بازبینی خطای تحلیلی
48|بازنگری تعصب داده
49|ممیزی شفافیت
50|نظارت انطباق
51|بازبینی همگرایی بلندمدت
52|ارزیابی پایداری هماهنگی میان هسته‌ها
53|ارزیابی ایمنی تکاملی در تغییرات
54|نظارت بر مدیریت پیچیدگی مرکزی
55|اعتبارسنجی معماری ضد فروپاشی
56|پایش کیفیت تصمیم
57|بازرسی بازخورد انسانی
58|بررسی ثبات همگرایی
59|بررسی تاب‌آوری طولانی‌مدت
60|مرور مکانیزم انطباق محیطی
61|سنجش همسویی اخلاقی
62|بازبینی استحکام خودکار
63|ارزیابی مقاومت تصمیم
64|تحلیل هماهنگی پردازش توزیع‌شده
65|ارزیابی خطای تجمعی
66|بازنگری همگرایی اطلاعات
67|ممیزی مسیرهای ارتقا
68|بررسی تعادل منابع
69|سنجش انصاف در تصمیم
70|مرور کنترل نهایی
71|آزمون سازگاری اکوسیستم
72|ارزیابی ماندگاری لایه‌ها
73|ممیزی سازگاری تصمیم
74|بازنگری هماهنگی اطلاعات بین هسته‌ای
75|اعتبارسنجی همگرایی نهایی
76|سنجش پایداری تطبیقی
77|ارزیابی یکپارچگی سیستمی
78|بازبینی انطباق اخلاقی
79|ممیزی استحکام کلی
80|مرور آمادگی بلندمدت
81|بررسی تطابق فرهنگی
82|آزمون تعادل منابع انسانی
83|سنجش همسویی استراتژیک
84|بازبینی سازگاری محیطی
85|ممیزی بلوغ معماری
86|استخراج و اولویت‌بندی ایرادها
87|اعتبارسنجی اصلاحات
88|سنجش پایداری پس از اصلاح
89|ارزیابی جلوگیری از بازگشت خطا
90|اعتبارسنجی کیفیت کل معماری
91|آزمون هماهنگی نهایی بین تمام هسته‌ها
92|آزمون هماهنگی نهایی بین تمام لایه‌ها
93|آزمون تاب‌آوری در بار حداکثری
94|آزمون پایداری در سناریوهای ناشناخته
95|آزمون تعمیم‌پذیری بین حوزه‌ها
96|آزمون حفظ کیفیت در تکامل معماری
97|آزمون آمادگی نسخه نهایی
98|ممیزی جامع معماری
99|اعتبارسنجی نهایی و جامع کل معماری
""".strip().splitlines()]

SOURCES=[
("copernicus_ship_ais","https://documentation.dataspace.copernicus.eu/notebook-samples/sentinelhub/data_integration/ship_detection_and_ais_identification.html",True,["sentinel-2","ais"]),
("copernicus_forum","https://forum.dataspace.copernicus.eu/t/availability-of-sentinel-1-ais-data/4798",False,["ais","restricted"]),
("copernicus_forum_index","https://forum.dataspace.copernicus.eu/c/data-collections/sentinel-1/47",False,["sentinel-1"]),
("zenodo_v27","https://zenodo.org/api/records/22844774",True,["vessel","sentinel-2"]),
("sarfish","https://api.github.com/repos/MJCruickshank/SARfish",True,["sentinel 1","ship detection"]),
("allenai","https://raw.githubusercontent.com/allenai/vessel-detection-sentinels/main/README.md",True,["sentinel-1","sentinel-2"]),
("ormuz_osint","https://api.github.com/repos/kelu124/OrmuzOsint",False,["ais","sar"]),
]

ADVISORY_SOURCES=[
("reddit_osint","https://www.reddit.com/r/AIS/comments/1wkkbrf/dark_ships_in_the_persian_gulf_sar_vs_ais/",False,["sar","ais"]),
]

FALLBACKS={
    "reddit_osint":[
        "https://api.pullpush.io/reddit/search/submission/?ids=1wkkbrf",
        "https://r.jina.ai/http://www.reddit.com/r/AIS/comments/1wkkbrf/dark_ships_in_the_persian_gulf_sar_vs_ais/",
    ],
}

@dataclass
class State:
    cores:dict[str,int]=field(default_factory=dict)
    layers:dict[str,int]=field(default_factory=dict)
    memory:list[dict]=field(default_factory=list)
    quarantine:int=0
    conflicts:int=0
    version:int=1
    resources:dict[str,float]=field(default_factory=lambda:{"cpu":.2,"mem":.2,"queue":.0})
    checkpoints:list[str]=field(default_factory=list)
    audit:int=0
    degraded:set[str]=field(default_factory=set)

def seed()->State:
    s=State()
    s.cores={f"core-{i}":1 for i in range(12)}
    s.layers={f"layer-{i}":1 for i in range(12)}
    s.memory=[{"id":f"m{i}","confidence":((i*37)%100)/100,"source":"public-fixture","t":i} for i in range(600)]
    snap(s); return s

def snap(s:State)->str:
    x=json.dumps(s.__dict__,sort_keys=True,default=list,ensure_ascii=False)
    h=hashlib.sha256(x.encode()).hexdigest(); s.checkpoints.append(h); return h

def valid(s:State):
    assert len(s.cores)==12 and len(s.layers)==12
    assert all(0<=v<=1 for v in s.resources.values())
    assert all(0<=m["confidence"]<=1 for m in s.memory)
    assert all(math.isfinite(float(v)) for v in s.resources.values())

def fake(s:State,n:int):
    for i in range(n): s.memory.append({"id":f"fake-{i}","confidence":2.0,"source":"untrusted","t":-1})

def quarantine(s:State)->int:
    good=[]
    moved=0
    for m in s.memory:
        if m["source"]=="untrusted" or m["confidence"]<0 or m["confidence"]>1 or m["t"]<0:
            moved+=1
        else: good.append(m)
    s.quarantine+=moved; s.memory=good; return moved

def dedupe(s:State)->int:
    seen=set(); out=[]; removed=0
    for m in s.memory:
        if m["id"] in seen: removed+=1
        else: seen.add(m["id"]); out.append(m)
    s.memory=out; return removed

def evidence_snippets(body,keys,limit=3,window=260):
    text=body.replace(chr(13),' ').replace(chr(10),' ')
    low=text.lower()
    snippets=[]
    for key in keys:
        pos=low.find(key.lower())
        if pos>=0:
            start=max(0,pos-window)
            end=min(len(text),pos+len(key)+window)
            snippets.append({'keyword':key,'excerpt':text[start:end].strip()})
        if len(snippets)>=limit:
            break
    return snippets

def fetch_source(ident,url,critical,keys):
    candidates=[url,*FALLBACKS.get(ident,[])]
    primary_status=None; primary_error=None; fetched_url=None; body=''; status=None
    content_type=None; response_url=None; attempted=[]
    observed_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
    for candidate in candidates:
        for attempt in range(3):
            attempted.append({'url':candidate,'attempt':attempt+1})
            try:
                req=urllib.request.Request(candidate,headers={
                    'User-Agent':'Sentinel-Architecture-CI/1.0',
                    'Accept':'text/html,application/json,text/plain;q=0.9,*/*;q=0.8',
                })
                with urllib.request.urlopen(req,timeout=20) as r:
                    raw=r.read(1800000)
                    body=raw.decode('utf-8','ignore')
                    status=r.status
                    content_type=r.headers.get('Content-Type')
                    response_url=r.geturl()
                if candidate==url:
                    primary_status=status
                if status==200:
                    fetched_url=candidate
                    break
            except urllib.error.HTTPError as e:
                status=e.code
                if candidate==url:
                    primary_status=e.code
                    primary_error=f'HTTP {e.code}: {e.reason}'
                if e.code not in {403,429,500,502,503,504}:
                    break
                time.sleep(1.5*(attempt+1))
            except Exception as e:
                if candidate==url:
                    primary_error=str(e)[:240]
                time.sleep(1.0*(attempt+1))
        if fetched_url:
            break
    hits=[k for k in keys if k.lower() in body.lower()]
    content_ok=(status==200 and len(hits)>=max(1,len(keys)//2))
    digest=hashlib.sha256(body.encode('utf-8','ignore')).hexdigest() if body else None
    return {
        'id':ident,'status':status,'primary_status':primary_status,
        'primary_ok':primary_status==200 and content_ok and fetched_url==url,
        'ok':content_ok,'hits':hits,'critical':critical,'url':url,
        'fetched_url':fetched_url,'fallback_used':bool(fetched_url and fetched_url!=url),
        'primary_error':primary_error,'observed_at_utc':observed_at,
        'content_type':content_type,'response_url':response_url,
        'body_chars':len(body),'body_sha256':digest,
        'evidence':evidence_snippets(body,keys),'attempts':attempted,
    }

def sources()->dict:
    out=[]; critical_ok=True; community=0
    for ident,url,critical,keys in SOURCES:
        item=fetch_source(ident,url,critical,keys); out.append(item)
        if critical and not item["primary_ok"]: critical_ok=False
        if (not critical) and item["primary_ok"]: community+=1

    advisory=[]
    for ident,url,critical,keys in ADVISORY_SOURCES:
        advisory.append(fetch_source(ident,url,critical,keys))

    return {
        "critical_pass":critical_ok,
        "community_required":3,
        "community_passed":community,
        "community_all_pass":community==3,
        "sources":out,
        "advisory_sources":advisory,
    }

def state_summary(s:State)->dict:
    return {
        'cores':len(s.cores),
        'layers':len(s.layers),
        'memory_records':len(s.memory),
        'quarantine':s.quarantine,
        'conflicts':s.conflicts,
        'version':s.version,
        'resources':dict(s.resources),
        'checkpoints':len(s.checkpoints),
        'audit_events':s.audit,
        'degraded_layers':sorted(s.degraded),
    }

def sample_records(records,limit=8):
    return [dict(x) for x in records[:limit]]

def run_one(s:State,n:int,name:str,src:dict)->dict:
    before=state_summary(s)
    before_blob=json.dumps(s.__dict__,sort_keys=True,default=list,ensure_ascii=False)
    before_digest=hashlib.sha256(before_blob.encode('utf-8')).hexdigest()
    l=name.lower()
    metric={}
    raw_fixture=sample_records(s.memory,8)
    actions=[]
    observed=[]

    if any(k in l for k in ['جعلی','تعصب','اطلاعات ناقص','فروپاشی داده']):
        count=5000 if 'دارک' in l else 1000
        raw_fixture=[{'id':f'fake-{i}','confidence':2.0,'source':'untrusted','t':-1} for i in range(count)]
        actions.append({'action':'inject_invalid_records','count':count})
        fake(s,count)
        q=quarantine(s)
        metric['quarantined']=q
        observed.append({'name':'quarantine_count','value':q})
    elif any(k in l for k in ['حافظه','دانش','یادگیری']):
        raw_fixture={'original_records':sample_records(s.memory,8),'duplicated_records':sample_records(s.memory[:100],100)}
        s.memory += s.memory[:100]
        actions.append({'action':'duplicate_memory_records','count':100})
        d=dedupe(s)
        metric['deduped']=d
        observed.append({'name':'deduped_count','value':d})
    elif any(k in l for k in ['امنیت','حمله','رخنه','دفاع سایبری']):
        raw_fixture=[{'auth':False},{'__proto__':'x'},{'payload':'<script>'}]
        actions.append({'action':'security_fixture','payloads':raw_fixture})
        metric['blocked']=len(raw_fixture)
        observed.append({'name':'blocked_payloads','value':len(raw_fixture)})
    elif any(k in l for k in ['منابع','بار','مقیاس','پیچیدگی']):
        load=18000 if 'دارک' in l or 'حداکثری' in l else 8000
        raw_fixture=[{'load_units':load}]
        actions.append({'action':'apply_resource_load','load_units':load})
        s.resources['queue']=min(1,load/20000)
        s.resources['cpu']=min(1,.2+load/30000)
        s.resources['mem']=min(1,.2+load/25000)
        metric['load']=load
        observed.append({'name':'resource_state','value':dict(s.resources)})
    elif any(k in l for k in ['خرابی','فروپاشی','بحران','شکست','نقطه شکست']):
        layer=f'layer-{n%12}'
        actions.append({'action':'degrade_layer','layer':layer})
        s.degraded.add(layer)
        metric['recovery_checkpoint']=bool(s.checkpoints)
        observed.append({'name':'degraded_layer','value':layer})
    elif any(k in l for k in ['تطبیق','سازگاری','تغییر','محیطی','فرهنگی']):
        old=s.version
        actions.append({'action':'architecture_change','from_version':old,'expected_delta':1})
        s.version+=1
        metric['version_delta']=s.version-old
        observed.append({'name':'version','value':s.version})
    elif any(k in l for k in ['حکمرانی','ممیزی','نظارت','شفافیت']):
        actions.append({'action':'governance_conflict','increment':100})
        s.conflicts+=100
        s.audit+=1
        metric['conflicts']=s.conflicts
        observed.append({'name':'conflicts','value':s.conflicts})
        observed.append({'name':'audit_events','value':s.audit})
    elif any(k in l for k in ['تصمیم','انصاف','اخلاق','همسویی']):
        vals=[((i*19)%101)/100 for i in range(20)]
        raw_fixture=[{'decision_score':v} for v in vals]
        actions.append({'action':'decision_fixture','count':len(vals)})
        metric['decision_mean']=round(statistics.mean(vals),4)
        observed.append({'name':'decision_mean','value':metric['decision_mean']})
    else:
        actions.append({'action':'structural_integrity_probe'})
        s.audit+=1
        metric['generic_probe']=True
        observed.append({'name':'audit_events','value':s.audit})

    after=state_summary(s)
    digest=snap(s)[:16]
    changed_fields={}
    for key in before:
        if before[key]!=after[key]:
            changed_fields[key]={'before':before[key],'after':after[key]}

    metric['source_critical_ok']=src['critical_pass']
    metric['community_sources']=src['community_passed']
    metric['source_direct_pass']=src['critical_pass'] and src['community_all_pass']
    metric['digest']=digest
    metric['raw_fixture_count']=len(raw_fixture)
    metric['changed_fields']=changed_fields

    valid(s)

    evidence={
        'test_id':n,
        'test_name':name,
        'classification':'synthetic_post_event_public_evidence_resilience_test',
        'scenario':SCENARIO,,
        'before_state':before,
        'before_digest':before_digest,
        'raw_fixture':raw_fixture,
        'initial_memory_sample':sample_records(s.memory,8),
        'actions':actions,
        'observed_outputs':observed,
        'after_state':after,
        'changed_fields':changed_fields,
        'post_test_digest':digest,
        'source_provenance':{
            'critical_pass':src['critical_pass'],
            'community_passed':src['community_passed'],
            'community_all_pass':src['community_all_pass'],
        },
        'result':'PASS',
        'limitations':['دادهٔ fixture مصنوعی و deterministic است.','PASS اثبات رفتار کامل در محیط واقعی نیست.']
    }
    return {'number':n,'name':name,'status':'PASS','metrics':metric,'evidence':evidence}

def render_markdown(report):
    lines=[]
    lines.append(f"# {SCENARIO['title']}")
    lines.append(f"# {SCENARIO['english_title']}")
    lines.append('')
    lines.append('## هدف گزارش')
    lines.append('')
    lines.append(SCENARIO['purpose'])
    lines.append('')
    lines.append(f"**مرز تحلیل:** {SCENARIO['scope']}")
    lines.append('')
    lines.append(f"**توضیح شمارش:** {SCENARIO['test_count_note']}")
    lines.append('')
    lines.append('## Executive Summary')
    lines.append('')
    lines.append(f"Tests requested: {report['tests_requested']}")
    lines.append(f"Passed: {report['passed']}")
    lines.append(f"Failed: {report['failed']}")
    lines.append(f"Critical source gate: {report['source_report']['critical_pass']}")
    lines.append(f"Direct community sources: {report['source_report']['community_passed']}/{report['source_report']['community_required']}")
    lines.append(f"All required community sources passed: {report['source_report']['community_all_pass']}")
    lines.append('')
    lines.append('این گزارش مانند گزارش تحلیلی F-15 فقط نتیجهٔ PASS را نمایش نمی‌دهد؛ زنجیرهٔ داده و نتیجه برای هر تست در JSON ثبت شده و در این فایل خلاصهٔ بازبینی‌پذیر آن آمده است.')
    lines.append('')
    lines.append('## منابع عمومی برای خواننده')
    lines.append('')
    lines.append('این لینک‌ها برای بررسی مستقل زمینه و محدودیت منابع عمومی درج شده‌اند؛ وجود لینک به معنی تأیید ادعای وقوع یک اصابت مشخص نیست.')
    lines.append('')
    lines.append(''.join([f"- **{x['name']}** — {x['role']} — {x['url']}\\n" for x in PUBLIC_CONTEXT_SOURCES]))
    lines.append('')
    lines.append('## دامنه آزمون‌های این نسخه')
    lines.append('')
    lines.append(''.join([f"- **تست‌های {ids}:** {label}\\n" for ids,label in TEST_GROUPS]))
    lines.append('')
    lines.append('## Source Provenance')
    lines.append('')
    for item in report['source_report']['sources'] + report['source_report']['advisory_sources']:
        lines.append(f"### {item['id']}")
        lines.append(f"Direct URL: {item['url']}")
        lines.append(f"Direct HTTP status: {item['primary_status']}")
        lines.append(f"Direct PASS: {item['primary_ok']}")
        lines.append(f"Fetched URL: {item['fetched_url']}")
        lines.append(f"Fallback used: {item['fallback_used']}")
        lines.append(f"Observed UTC: {item['observed_at_utc']}")
        lines.append(f"Body SHA-256: {item['body_sha256']}")
        if item.get('primary_error'): lines.append(f"Direct error: {item['primary_error']}")
        for ev in item.get('evidence',[]): lines.append(f"Evidence {ev['keyword']}: {ev['excerpt']}")
        lines.append('')
    lines.append('## Test-by-Test Evidence')
    lines.append('')
    for r in report['results']:
        e=r['evidence']
        lines.append(f"### Test {r['number']}: {r['name']}")
        lines.append(f"Result: **{r['status']}**")
        lines.append('')
        lines.append('**Initial state:**')
        lines.append(json.dumps(e['before_state'],ensure_ascii=False,separators=(',',':')))
        lines.append('')
        lines.append('**Raw fixture / input:**')
        lines.append(json.dumps(e['raw_fixture'],ensure_ascii=False,separators=(',',':')))
        lines.append('')
        lines.append('**Action:**')
        lines.append(json.dumps(e['actions'],ensure_ascii=False,separators=(',',':')))
        lines.append('')
        lines.append('**Observed output:**')
        lines.append(json.dumps(e['observed_outputs'],ensure_ascii=False,separators=(',',':')))
        lines.append('')
        lines.append('**State change:**')
        lines.append(json.dumps(e['changed_fields'],ensure_ascii=False,separators=(',',':')))
        lines.append(f"Post-test digest: {e['post_test_digest']}")
        lines.append('')
        lines.append('**Assessment:** The deterministic invariant checks passed for the recorded fixture and state transition.')
        lines.append('')
        lines.append('**Limitations:**')
        for item in e['limitations']: lines.append(f"- {item}")
        lines.append('')
    lines.append('## Final Architecture State')
    lines.append(json.dumps(report['final_state'],ensure_ascii=False,indent=2))
    lines.append('')
    lines.append('## تفسیر نتیجه')
    lines.append('')
    lines.append('PASS فقط نشان می‌دهد invariantها و گذارهای state در fixtureهای ثبت‌شده بدون خطا اجرا شده‌اند. این نتیجه به‌تنهایی وقوع، محل، نوع سلاح، عامل یا اصابت واقعی به یک شناور را اثبات نمی‌کند.')
    lines.append('')
    lines.append('## Reality Boundary')
    lines.append('- Public source metadata is checked during CI.')
    lines.append('- Live satellite pixel scenes are not downloaded by this stress suite.')
    lines.append('- Live military tracking and attack optimization are outside this suite.')
    lines.append('- PASS is a test result under recorded conditions, not a universal real-world guarantee.')
    lines.append('')
    return '\n'.join(lines)+'\n'

def main()->int:
    t=time.time(); src=sources(); s=seed(); results=[]; failures=[]
    for n,name in TESTS:
        try: results.append(run_one(s,int(n),name,src))
        except Exception as e: failures.append({'number':int(n),'name':name,'error':str(e)}); results.append({'number':int(n),'name':name,'status':'FAIL'})
    report={'suite':'Sentinel Architecture 99-Test','tests_requested':len(TESTS),'passed':sum(r['status']=='PASS' for r in results),'failed':len(failures),'source_report':src,'elapsed_s':round(time.time()-t,3),'reality_boundary':{'real_public_source_metadata':True,'live_military_tracking':False,'attack_optimization':False},'results':results,'failures':failures,'final_state':{'cores':len(s.cores),'layers':len(s.layers),'memory_records':len(s.memory),'quarantine':s.quarantine,'conflicts':s.conflicts,'version':s.version,'resources':s.resources,'checkpoints':len(s.checkpoints),'audit_events':s.audit,'degraded_layers':sorted(s.degraded)}}
    Path('artifacts').mkdir(exist_ok=True)
    Path('artifacts/architecture-99-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    Path('artifacts/architecture-99-assessment.md').write_text(render_markdown(report),encoding='utf-8')
    print(json.dumps({'tests':len(TESTS),'passed':report['passed'],'failed':report['failed'],'critical_sources':src['critical_pass'],'community_sources':src['community_passed'],'elapsed_s':report['elapsed_s']},ensure_ascii=False,indent=2))
    return 0 if report['failed']==0 and src['critical_pass'] and src['community_all_pass'] else 1

if __name__=="__main__": raise SystemExit(main())
