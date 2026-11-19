#!/usr/bin/env python3
"""Reproducible public-data inventory: Sentinel-1/2, NASA GIBS/FIRMS, ERA5."""
from __future__ import annotations
import csv, datetime as dt, json, os, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path

OUT = Path("research/output/jabal-haylan-multisensor")
OUT.mkdir(parents=True, exist_ok=True)
UA = "SentinelCommand-public-research/1.0"
BBOX = os.getenv("AOI_BBOX", "45.00,15.45,45.15,15.60")
START = os.getenv("START_UTC", "2026-09-15T00:00:00Z")
END = os.getenv("END_UTC", "2026-11-20T00:00:00Z")
DATES = ["2026-09-16", "2026-09-17", "2026-09-18", "2026-10-28", "2026-11-17"]
STAC = "https://stac.dataspace.copernicus.eu/v1"
GIBS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"

def get_bytes(url, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")

def get_json(url):
    body, _ = get_bytes(url, 90)
    return json.loads(body.decode("utf-8"))

def write_json(name, value):
    (OUT / name).write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding="utf-8")

def bbox_values():
    v = [float(x) for x in BBOX.split(",")]
    if len(v) != 4 or not (-180 <= v[0] < v[2] <= 180 and -90 <= v[1] < v[3] <= 90):
        raise ValueError("AOI_BBOX must be valid west,south,east,north")
    return v

def stac_search(collection):
    w, s, e, n = bbox_values()
    q = urllib.parse.urlencode({"bbox": f"{w},{s},{e},{n}",
                                "datetime": f"{START}/{END}", "limit": "100"})
    url = f"{STAC}/collections/{collection}/items?{q}"
    items, pages = [], 0
    while url and pages < 20:
        page = get_json(url)
        pages += 1
        for f in page.get("features", []):
            p, assets = f.get("properties", {}), f.get("assets", {})
            keys = (["thumbnail", "visual", "B02_10m", "B03_10m", "B04_10m",
                     "B08_10m", "B11_20m", "SCL_20m"] if collection == "sentinel-2-l2a"
                    else ["thumbnail", "vv", "vh", "Product"])
            items.append({
                "collection": collection, "id": f.get("id"),
                "datetime_utc": p.get("datetime"), "platform": p.get("platform"),
                "cloud_cover_pct": p.get("eo:cloud_cover"),
                "orbit_state": p.get("sat:orbit_state"),
                "relative_orbit": p.get("sat:relative_orbit"),
                "product_type": p.get("product:type"),
                "processing_level": p.get("processing:level"),
                "polarizations": p.get("sar:polarizations"),
                "bbox": f.get("bbox"),
                "assets": {k: assets[k].get("href") for k in keys if k in assets}
            })
        url = next((x.get("href") for x in page.get("links", [])
                    if x.get("rel") == "next"), None)
    items.sort(key=lambda x: x.get("datetime_utc") or "")
    result = {"collection": collection, "pages_read": pages,
              "feature_count": len(items), "items": items}
    write_json(f"{collection}_catalog.json", result)
    return result

def nasa_gibs():
    w, s, e, n = bbox_values()
    layers = ["VIIRS_SNPP_Thermal_Anomalies_375m_All",
              "VIIRS_NOAA20_Thermal_Anomalies_375m_All",
              "MODIS_Terra_Thermal_Anomalies_All",
              "VIIRS_SNPP_CorrectedReflectance_TrueColor"]
    records = []
    for day in DATES:
        for layer in layers:
            q = urllib.parse.urlencode({
                "SERVICE":"WMS","REQUEST":"GetMap","VERSION":"1.1.1",
                "LAYERS":layer,"STYLES":"","SRS":"EPSG:4326",
                "BBOX":f"{w},{s},{e},{n}","WIDTH":"1000","HEIGHT":"800",
                "FORMAT":"image/png","TIME":day})
            url = f"{GIBS}?{q}"
            rec = {"date_utc":day,"layer":layer,"url":url}
            try:
                body, ctype = get_bytes(url)
                if ctype.startswith("image/") and body[:8] == bytes.fromhex("89504e470d0a1a0a"):
                    name = f"{day}_{layer}.png"
                    (OUT/name).write_bytes(body)
                    rec.update(status="downloaded",filename=name,bytes=len(body))
                else:
                    rec.update(status="not_image",content_type=ctype,
                               preview=body[:200].decode("utf-8","replace"))
            except Exception as ex:
                rec.update(status="unavailable",error=str(ex)[:400])
            records.append(rec)
    write_json("nasa_gibs_download_log.json", records)
    return records

def nasa_firms():
    key = os.getenv("NASA_FIRMS_MAP_KEY")
    if not key:
        result = {"status":"skipped","reason":"NASA_FIRMS_MAP_KEY secret is not configured"}
        write_json("nasa_firms_status.json", result)
        return result
    w,s,e,n = bbox_values()
    area = f"{w},{s},{e},{n}"
    sources = ["VIIRS_SNPP_NRT","VIIRS_NOAA20_NRT","VIIRS_NOAA21_NRT","MODIS_NRT"]
    rows = []
    for day in DATES[:3]:
        for source in sources:
            url = (f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/"
                   f"{source}/{area}/1/{day}")
            try:
                body, ctype = get_bytes(url)
                name = f"firms_{day}_{source}.csv"
                (OUT/name).write_bytes(body)
                rows.append({"date_utc":day,"source":source,"status":"downloaded",
                             "file":name,"bytes":len(body),"content_type":ctype})
            except Exception as ex:
                rows.append({"date_utc":day,"source":source,"status":"unavailable",
                             "error":str(ex)[:400]})
    result = {"status":"queried","records":rows}
    write_json("nasa_firms_status.json", result)
    return result

def era5_context():
    w,s,e,n = bbox_values()
    lat,lon = (s+n)/2,(w+e)/2
    q = urllib.parse.urlencode({
        "latitude":lat,"longitude":lon,"start_date":"2026-09-16","end_date":"2026-09-19",
        "hourly":"temperature_2m,relative_humidity_2m,precipitation,cloud_cover,"
                 "wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl",
        "timezone":"UTC","models":"era5"})
    url = f"https://archive-api.open-meteo.com/v1/archive?{q}"
    try:
        data = get_json(url)
        write_json("era5_hourly_context.json", data)
        return {"status":"downloaded","url":url,
                "hours":len(data.get("hourly",{}).get("time",[])),
                "caveat":"ERA5 is coarse regional reanalysis, not local mountain-valley wind."}
    except Exception as ex:
        return {"status":"unavailable","error":str(ex)[:400]}

def main():
    catalogs = {}
    for collection in ("sentinel-1-grd","sentinel-2-l2a"):
        try:
            r = stac_search(collection)
            catalogs[collection] = {"status":"ok","count":r["feature_count"],"pages":r["pages_read"]}
        except Exception as ex:
            catalogs[collection] = {"status":"error","error":str(ex)[:400]}
    gibs, firms, weather = nasa_gibs(), nasa_firms(), era5_context()
    summary = {
        "retrieved_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
        "window_utc":[START,END],"generalized_bbox":BBOX,
        "sentinel_catalogs":catalogs,
        "nasa_gibs":{"requested":len(gibs),
                     "downloaded":sum(x.get("status")=="downloaded" for x in gibs),
                     "log":"nasa_gibs_download_log.json",
                     "caveat":"Browse layers only, not calibrated fire-radiative-power measurements."},
        "nasa_firms":firms,"era5_context":weather,
        "limitations":[
            "A catalogue hit proves scene coverage, not visibility of wreckage or a burn scar.",
            "Sentinel-1 GRD is radar backscatter, not an optical image or direct fire detector.",
            "Sentinel-2 dark pixels may be terrain shadow, basalt, moisture or burn; inspect alternatives.",
            "VIIRS/MODIS non-detection cannot rule out a small or short-lived fire.",
            "Forum and community geolocation records are leads, not independent confirmation by themselves.",
            "ERA5 cannot resolve local mountain-valley winds.",
            "This public workflow does not calculate or publish a more precise wreckage coordinate."
        ]}
    write_json("multisensor_summary.json", summary)
    print(json.dumps(summary,indent=2))
    if not any(v.get("status")=="ok" for v in catalogs.values()):
        sys.exit("Both Sentinel catalogue queries failed.")
if __name__ == "__main__":
    main()
