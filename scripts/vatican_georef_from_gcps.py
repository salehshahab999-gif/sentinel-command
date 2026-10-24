#!/usr/bin/env python3
"""Georeference an image from explicitly verified GCPs using GDAL.

This does not find GCPs, correct camera perspective, or certify accuracy.
For oblique aerial photos, inspect the result and consider photogrammetry.
Requires GDAL Python bindings. Example:
  python scripts/vatican_georef_from_gcps.py --input source.tif --gcps gcps.json --output result.tif
"""
import argparse
import json
import os
import sys

try:
    from osgeo import gdal
except ImportError:
    print("ERROR: GDAL Python bindings are required. Install/configure GDAL first.", file=sys.stderr)
    sys.exit(2)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Path to original raster image")
    p.add_argument("--gcps", required=True, help="JSON with targetCrs and verified gcps")
    p.add_argument("--output", required=True, help="Output GeoTIFF path")
    p.add_argument("--resampling", default="cubic", choices=["near", "bilinear", "cubic", "cubicspline", "lanczos"])
    p.add_argument("--tps", action="store_true", help="Use thin-plate spline; only after adequate GCP distribution")
    args = p.parse_args()

    with open(args.gcps, "r", encoding="utf-8") as f:
        spec = json.load(f)

    target_crs = spec.get("targetCrs")
    gcps_json = spec.get("gcps", [])
    if not target_crs or len(gcps_json) < 4:
        raise SystemExit("Need targetCrs and at least 4 well-distributed, verified GCPs.")
    for i, g in enumerate(gcps_json, 1):
        for key in ("pixel", "line", "longitude", "latitude", "feature", "confidence"):
            if key not in g:
                raise SystemExit(f"GCP {i} missing required field: {key}")
        if g["confidence"] in ("unverified", "guess", "low"):
            raise SystemExit(f"GCP {i} is marked {g['confidence']}; verify it before processing.")

    src = gdal.Open(args.input, gdal.GA_Update)
    if src is None:
        raise SystemExit(f"Cannot open input raster: {args.input}")

    gcp_list = [
        gdal.GCP(float(g["longitude"]), float(g["latitude"]), 0.0,
                 float(g["pixel"]), float(g["line"]), str(g["feature"]), "")
        for g in gcps_json
    ]
    # GCP coordinates are assumed to be in WGS84 longitude/latitude.
    src.SetGCPs(gcp_list, gdal.SpatialReference(wkt=gdal.osr.SpatialReference(target_crs).ExportToWkt()).ExportToWkt()
                if False else gdal.osr.SpatialReference().ExportToWkt())
    # Re-set the GCP CRS explicitly. GDAL's SetGCPs accepts the CRS WKT as its second argument.
    srs = gdal.osr.SpatialReference()
    if srs.SetFromUserInput(target_crs) != 0:
        raise SystemExit(f"Unsupported target CRS: {target_crs}")
    src.SetGCPs(gcp_list, srs.ExportToWkt())
    src.FlushCache()

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    opts = gdal.WarpOptions(
        format="GTiff",
        dstSRS=target_crs,
        tps=args.tps,
        resampleAlg=args.resampling,
        creationOptions=["TILED=YES", "COMPRESS=DEFLATE", "BIGTIFF=IF_SAFER"],
    )
    out = gdal.Warp(args.output, src, options=opts)
    if out is None:
        raise SystemExit("GDAL Warp failed. Inspect GCP distribution and CRS.")
    out.FlushCache()
    out = None
    src = None
    print(f"Created {args.output}")
    print("Validation required: inspect alignment, calculate independent checkpoint residuals, and document limitations.")


if __name__ == "__main__":
    main()
