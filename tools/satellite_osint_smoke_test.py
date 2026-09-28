#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import json
import tempfile

import numpy as np
import rasterio
from pyproj import Geod
from shapely.geometry import Point


def assert_close(actual: float, expected: float, tol: float, label: str) -> None:
    if abs(actual - expected) > tol:
        raise AssertionError(f"{label}: {actual} != {expected} within {tol}")


def main() -> None:
    print("== Satellite / maritime OSINT smoke test ==")

    # 1) WGS84 geodesic sanity check.
    geod = Geod(ellps="WGS84")
    az1, az2, distance_m = geod.inv(51.0, 24.0, 52.0, 25.0)
    if not (100_000 < distance_m < 200_000):
        raise AssertionError("WGS84 geodesic calculation failed")
    print(f"[PASS] WGS84 geodesic: {distance_m/1000:.2f} km")

    # 2) GeoJSON point sanity check for downstream OSINT storage.
    point = Point(51.0, 24.0)
    if not point.is_valid:
        raise AssertionError("Shapely point invalid")
    print("[PASS] GeoJSON geometry sanity")

    # 3) Build a tiny synthetic Sentinel-1-like single-band raster.
    #    This validates the GeoTIFF read/write path without downloading live imagery.
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "sar_fixture.tif"
        data = np.zeros((1, 512, 512), dtype=np.float32)
        data[0, 240:272, 240:272] = 18.0

        transform = rasterio.transform.from_origin(51.0, 24.1, 0.0001, 0.0001)
        with rasterio.open(
            path,
            "w",
            driver="GTiff",
            height=512,
            width=512,
            count=1,
            dtype="float32",
            crs="EPSG:4326",
            transform=transform,
        ) as dst:
            dst.write(data)

        with rasterio.open(path) as src:
            if src.crs.to_string() != "EPSG:4326":
                raise AssertionError("Synthetic SAR CRS mismatch")
            arr = src.read(1)
            if float(arr.max()) != 18.0:
                raise AssertionError("Synthetic SAR target fixture mismatch")
            bounds = src.bounds

    print(
        "[PASS] Synthetic Sentinel-1/SAR GeoTIFF: "
        f"EPSG:4326, bounds={bounds.left:.5f},{bounds.bottom:.5f},"
        f"{bounds.right:.5f},{bounds.top:.5f}"
    )

    # 4) Build a tiny synthetic Sentinel-2-style four-band cube.
    optical = np.stack(
        [
            np.full((64, 64), 0.10, dtype=np.float32),  # B2
            np.full((64, 64), 0.12, dtype=np.float32),  # B3
            np.full((64, 64), 0.15, dtype=np.float32),  # B4
            np.full((64, 64), 0.30, dtype=np.float32),  # B8
        ],
        axis=0,
    )
    ndvi = (optical[3] - optical[2]) / (optical[3] + optical[2])
    assert_close(float(ndvi.mean()), 0.3333333, 1e-5, "NDVI")
    print("[PASS] Synthetic Sentinel-2 four-band / NDVI path")

    # 5) AIS-like schema validation.
    ais = {
        "mmsi": "257000000",
        "timestamp": "2026-09-28T12:00:00Z",
        "lat": 24.0000,
        "lon": 51.0000,
        "sog_knots": 14.2,
        "cog_deg": 91.0,
    }
    required = {"mmsi", "timestamp", "lat", "lon", "sog_knots", "cog_deg"}
    if set(ais) != required:
        raise AssertionError("AIS schema mismatch")
    if not (-90 <= ais["lat"] <= 90 and -180 <= ais["lon"] <= 180):
        raise AssertionError("AIS coordinate range invalid")
    print("[PASS] AIS-like schema and coordinate validation")

    # 6) Persist a small machine-readable result.
    result = {
        "status": "pass",
        "tests": 5,
        "live_satellite_download": False,
        "live_military_tracking": False,
        "notes": [
            "Synthetic fixtures validate the processing path only.",
            "Real Sentinel-1/2 scenes require externally supplied imagery.",
        ],
    }
    Path("satellite_osint_test_result.json").write_text(
        json.dumps(result, indent=2), encoding="utf-8"
    )
    print("[PASS] Result JSON written")


if __name__ == "__main__":
    main()
