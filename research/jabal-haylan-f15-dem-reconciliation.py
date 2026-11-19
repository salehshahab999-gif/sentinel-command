#!/usr/bin/env python3
"""Reproducible DEM profile comparison for the Jabal Haylan F-15 OSINT study.

Samples the straight terrain transect from the publicly reported Me1Ray coordinate
toward the Jabal Haylan summit reference using OpenTopoData SRTM 30m and ASTER 30m.
This is a terrain-screening aid, not an impact-site detector.
"""
from __future__ import annotations
import csv
import json
import math
import urllib.parse
import urllib.request
from pathlib import Path

ME1RAY = (15.5419000, 45.0807920)
SUMMIT = (15.5241700, 45.0747200)
SALEH = (15.4976100, 45.0751700)
TARGET_M = 1897.0
SAMPLES = 41
OUT = Path("research/output")
OUT.mkdir(parents=True, exist_ok=True)


def haversine(a, b):
    r = 6371000.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp = math.radians(b[0] - a[0])
    dl = math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def bearing(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dl = math.radians(b[1] - a[1])
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def get_profile(dataset):
    loc = f"{ME1RAY[0]},{ME1RAY[1]}|{SUMMIT[0]},{SUMMIT[1]}"
    query = urllib.parse.urlencode({"locations": loc, "samples": SAMPLES})
    url = f"https://api.opentopodata.org/v1/{dataset}?{query}"
    req = urllib.request.Request(url, headers={"User-Agent": "sentinel-command-osint-research/1.0"})
    with urllib.request.urlopen(req, timeout=45) as response:
        payload = json.load(response)
    if payload.get("status") != "OK" or len(payload.get("results", [])) != SAMPLES:
        raise RuntimeError(f"Unexpected {dataset} response: {payload}")
    return {i: row["elevation"] for i, row in enumerate(payload["results"])}, [
        (row["location"]["lat"], row["location"]["lng"]) for row in payload["results"]
    ]


def main():
    srtm, coords = get_profile("srtm30m")
    aster, coords2 = get_profile("aster30m")
    if coords != coords2:
        raise RuntimeError("DEM sample coordinates do not match")
    rows = []
    for i, point in enumerate(coords):
        e1, e2 = srtm[i], aster[i]
        mean = (e1 + e2) / 2
        rows.append({
            "sample_index": i,
            "latitude": point[0],
            "longitude": point[1],
            "srtm30m_m": e1,
            "aster30m_m": e2,
            "dem_mean_m": round(mean, 1),
            "dem_spread_m": abs(e1 - e2),
            "distance_from_me1ray_m": round(haversine(ME1RAY, point), 1),
            "distance_from_saleh_estimate_m": round(haversine(SALEH, point), 1),
            "distance_from_summit_m": round(haversine(SUMMIT, point), 1),
            "bearing_from_me1ray_deg": round(bearing(ME1RAY, point), 1),
            "absolute_mean_difference_from_saleh_elevation_m": round(abs(mean - TARGET_M), 1),
        })
    rows.sort(key=lambda r: (r["absolute_mean_difference_from_saleh_elevation_m"],
                             r["dem_spread_m"],
                             r["distance_from_me1ray_m"]))
    csv_path = OUT / "me1ray_to_summit_dem_profile.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda r: r["sample_index"]))
    result = {
        "source": "OpenTopoData API",
        "datasets": ["SRTM 30m", "ASTER 30m"],
        "transect": {"start_me1ray": ME1RAY, "end_summit_reference": SUMMIT},
        "target_elevation_m": TARGET_M,
        "sample_count": SAMPLES,
        "candidate_ranking": rows[:8],
        "warning": "Elevation matching alone cannot determine a unique horizontal correction or establish the crash site.",
        "csv": str(csv_path),
    }
    (OUT / "dem_candidate_summary.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
