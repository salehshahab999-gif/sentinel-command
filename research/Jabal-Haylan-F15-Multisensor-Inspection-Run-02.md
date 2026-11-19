# Jabal Haylan F-15: Multisensor Inspection Run 02

**Inspection date:** 2026-11-20  
**Branch:** `research/jabal-haylan-multisensor-audit-2026-11-20`  
**Input workflow run:** [44626768317](https://github.com/salehshahab999-gif/sentinel-command/actions/runs/44626768317)  
**Input artifact:** `jabal-haylan-multisensor-evidence` (artifact ID `14578724937`)  
**AOI:** 45.00–45.15 E, 15.45–15.60 N (catalogue/browse AOI; not a wreckage coordinate)

## Executive result

The downloaded artifact was inspected at pixel/file level, not just accepted from its collection summary.

1. **Sentinel-2:** 40 STAC records resolve to 20 acquisition dates, with two adjacent tiles per date: T38PNC and T38PMC. The T38PNC record is the tile of primary interest for the stated candidate area. Its scene-level cloud-cover metadata is 0.00–0.42% on several useful dates (notably 25, 28 September; 8, 15, 18, 28 October; 2, 4, 7 and 17 November). These percentages are tile/scene metadata, not a pixel-level cloud/shadow mask at the candidate.
2. **Sentinel-1:** nine GRD COG catalogue records form two useful same-relative-orbit sequences: descending relative orbit 108 (23 Sep, 5 Oct, 17 Oct, 10 Nov) and ascending relative orbit 43 (24 Sep, 6 Oct, 18 Oct, 30 Oct, 11 Nov). VV/VH are present. This is a candidate comparison design, not yet a calibrated or co-registered change-detection result.
3. **NASA GIBS thermal:** every successfully downloaded thermal PNG in the artifact is 1000×800 and has **zero non-transparent pixels** (all RGBA pixels transparent; the 14 inspected files are byte-identical in size at 3,181 bytes). The 17 Nov VIIRS SNPP request returned an OGC service exception. This means the downloaded browse outputs contain no rendered thermal-anomaly marks in the AOI; it is not a verified FIRMS CSV/archive query and must not be reported as proof that no fire occurred.
4. **NASA GIBS true colour:** four VIIRS SNPP browse images exist (16, 17, 18 Sep; 28 Oct; 17 Nov). The inspected 17 and 18 Sep images are coarse, visibly pixelated browse products; the 17 Sep image is largely obscured/washed out by bright cloud-like coverage. They do not resolve small aircraft debris or a small burn scar.
5. **ERA5:** all 96 hourly records for 16–19 Sep were parsed and aggregated. Modelled precipitation totals 0 mm on each day. Maximum 10 m gusts are 44.6 m/s (16 Sep 13:00 UTC), 45.4 m/s (17 Sep 13:00 UTC), 42.1 m/s (18 Sep 11:00 UTC), and 39.6 m/s (19 Sep 11:00 UTC). Directions at those gust maxima are 39°, 47°, 65°, and 55° respectively (meteorological direction, wind from). These are coarse regional ERA5 values, not local ridge/valley measurements.
6. **FIRMS:** no archive detections were collected because the workflow secret `NASA_FIRMS_MAP_KEY` is absent. Status is skipped, not zero detections.

## Sentinel-2: all 40 records accounted for

The catalogue contains 20 distinct dates, each represented by T38PNC and T38PMC:
15, 18, 23, 25, 28 September; 3, 5, 8, 13, 15, 18, 23, 25, 28 October; 2, 4, 7, 12, 14, 17 November 2026.

T38PNC scene cloud-cover percentages by date:
- 15 Sep 1.90%; 18 Sep 0.42%; 23 Sep 0.42%; 25 Sep 0.10%; 28 Sep 0.00%.
- 3 Oct 0.01%; 5 Oct 0.19%; 8 Oct 0.00%; 13 Oct 11.61%; 15 Oct 0.00%; 18 Oct 0.00%; 23 Oct 19.88%; 25 Oct 0.85%; 28 Oct 0.00%.
- 2 Nov 0.00%; 4 Nov 0.00%; 7 Nov 0.00%; 12 Nov 68.07%; 14 Nov 10.99%; 17 Nov 0.00%.

The low scene-level cloud values make several dates good candidates for pixel inspection. They do **not** prove that the target pixel is clear: local cloud, cirrus, terrain shadow and SCL classes must be checked. The catalogue assets expose thumbnail links plus B02/B03/B04/B08 (10 m), B11 and SCL (20 m) asset paths. The spectral bands in this collection response point to S3 object paths; the current run did not download or inspect the JP2 rasters. Therefore no spectral index, burn ratio, pixel classification or before/after scar finding is claimed.

## Sentinel-1: acquisition pairing

| Relative orbit | Direction | Acquisition dates (UTC) | Polarizations |
|---|---|---|---|
| 108 | Descending | 23 Sep, 5 Oct, 17 Oct, 10 Nov | VV, VH |
| 43 | Ascending | 24 Sep, 6 Oct, 18 Oct, 30 Oct, 11 Nov | VV, VH |

Same-orbit sequences are preferable to mixing ascending and descending passes. Before change interpretation, retrieve the VV/VH COGs, confirm footprint overlap and incidence geometry, apply radiometric calibration/terrain correction and co-registration, then compare backscatter. No SAR change result is available yet.

## NASA GIBS thermal layer: pixel-level inspection

Four target dates were requested (16, 17, 18 Sep and 28 Oct, plus 17 Nov for the later comparison set), across VIIRS SNPP, VIIRS NOAA-20 and MODIS Terra thermal layers. The artifact includes 14 successful thermal PNG files; the 17 Nov VIIRS SNPP layer returned an OGC service exception. PIL inspection found all pixels in each of the 14 PNGs fully transparent (alpha=0 for 800,000/800,000 pixels). The images are therefore empty browse renderings in this AOI, not positive evidence of a thermal event and not an independently validated negative detection.

NASA's GIBS documentation confirms these are valid thermal anomaly layer names and describes WMS/WMTS access. A separate, correctly parameterized re-request (including explicit ISO timestamp, default style and transparent rendering) and/or the underlying FIRMS active-fire archive is required before treating this as a reliable no-mark result. See:
- https://firms.modaps.eosdis.nasa.gov/content/tutorials/gibs/
- https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/
- https://nasa-gibs.github.io/gibs-api-docs/access-basics/

## ERA5 96-hour comparison

All 96 hourly records from 16–19 Sep 2026 UTC were read. Daily summaries:

| Date UTC | Temp min–max °C | RH min–max % | Mean cloud % | Precipitation mm | Max 10 m wind m/s | Max gust m/s (time UTC) | Direction at max gust |
|---|---:|---:|---:|---:|---:|---|---:|
| 16 Sep | 20.0–30.8 | 12–29 | 19.1 | 0.0 | 19.5 | 44.6 (13:00) | 39° |
| 17 Sep | 21.5–29.8 | 21–28 | 34.3 | 0.0 | 18.8 | 45.4 (13:00) | 47° |
| 18 Sep | 20.6–31.2 | 14–28 | 28.9 | 0.0 | 17.1 | 42.1 (11:00) | 65° |
| 19 Sep | 20.8–30.8 | 15–29 | 46.2 | 0.0 | 15.1 | 39.6 (11:00) | 55° |

Interpretation limits:
- The model suggests a dry four-day period at the generalized AOI point, but this is not a rain-gauge observation.
- Strong modelled gusts around 17 Sep could affect smoke/plume transport and loose lightweight debris, but a single grid-point ERA5 series cannot reconstruct a local plume path or determine the final aircraft/debris position.
- The wind directions are meteorological “from” directions. Do not reverse them or treat them as a trajectory without a time-resolved plume model and local terrain/wind data.
- ERA5 grid scale is too coarse to resolve mountain-valley channeling around Jabal Haylan.

## Cross-sensor reconciliation

- **Temporal alignment:** Sentinel-2 has a 15 Sep acquisition immediately before the 17 Sep event window and an 18 Sep acquisition shortly after; GIBS true-colour browse exists for 16–18 Sep. The 25 and 28 Sep Sentinel-2 dates and the October/November series can serve as post-event baselines, subject to actual pixel inspection.
- **Thermal vs weather:** GIBS browse images are blank/transparent and FIRMS archive is absent. ERA5 shows no modelled precipitation and strong gusts; these weather values neither confirm nor refute a fire. There is no valid thermal detection to correlate with the gusts.
- **Optical vs SAR:** Sentinel-2 catalogue coverage and Sentinel-1 orbit pairs establish that usable data candidates exist. They do not yet establish a burn scar, debris field, recovery activity or road/track change. Optical and SAR source rasters still need to be downloaded and processed.
- **Coordinate consequence:** no evidence in this run justifies moving either Saleh's coordinate or Me1Ray's coordinate, nor shrinking the uncertainty radius. Elevation agreement alone is not geolocation proof.

## Next reproducible tasks

1. Re-request GIBS thermal layers with documented WMS parameters and inspect service response headers/body, not just HTTP success; separately retrieve FIRMS CSV/archive data if an authorized MAP_KEY is configured.
2. Obtain actual Sentinel-2 B02/B03/B04/B08/B11 and SCL rasters for 15 and 18 Sep and selected clear post-event dates; mask SCL cloud/cirrus/shadow classes and compare reflectance/NBR-style indices against local basalt and illumination controls.
3. Download the nine Sentinel-1 VV/VH COGs, pair within relative orbits 108 and 43, and run calibrated terrain-corrected co-registration before change detection.
4. Tie all image products to a common projected grid and extract pixel statistics for the two candidate coordinate sets and surrounding control areas.
5. Only after reproducible image-to-video terrain matches, consider coordinate revision.

**Bottom line:** the 40 Sentinel-2 records, 9 Sentinel-1 records, 96 ERA5 hours and the NASA GIBS browse files have now been reconciled at metadata/file-pixel level. The result is a clear audit of what is present and what is missing, not yet a positive identification of the wreckage or a defensible coordinate refinement.
