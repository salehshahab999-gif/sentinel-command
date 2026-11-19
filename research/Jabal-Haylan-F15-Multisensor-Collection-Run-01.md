# Jabal Haylan F-15: Multisensor Collection Run 01

**Collection time:** 2026-11-19 22:15 UTC  
**Branch:** `research/jabal-haylan-multisensor-audit-2026-11-20`  
**Workflow:** Jabal Haylan F-15 Multisensor Evidence Audit  
**Run:** [44626768317](https://github.com/salehshahab999-gif/sentinel-command/actions/runs/44626768317)  
**Artifact:** `jabal-haylan-multisensor-evidence` (artifact ID `14578724937`)

## Confirmed collection

- Copernicus STAC returned **9 Sentinel-1 GRD scenes** from 23 September to 11 November 2026, all with VV/VH polarization metadata.
- Copernicus STAC returned **40 Sentinel-2 L2A tile records**, representing **20 distinct T38PNC acquisition dates** from 15 September to 17 November 2026. Most T38PNC scene-level cloud-cover values are low; this is scene metadata, not a pixel-level cloud mask at the wreckage candidate.
- The Sentinel-2 dates include 15, 18, 23, 25 and 28 September; 3, 5, 8, 13, 15, 18, 23, 25 and 28 October; and 2, 4, 7, 12, 14 and 17 November.
- Public NASA GIBS returned **19 image responses out of 20 requests**. The 17 November VIIRS SNPP thermal layer returned an OGC service exception.
- The downloaded NASA GIBS thermal anomaly PNGs have fully transparent/empty pixel arrays in this AOI. This means the browse-layer request did not render a plotted anomaly in the requested tile. It is **not** a verified FIRMS non-detection and cannot establish that no fire occurred.
- GIBS VIIRS true-colour browse imagery was returned for 16, 17, 18 September, 28 October and 17 November. It is coarse context, not sufficient to identify small wreckage.
- Open-Meteo Historical API returned **96 hourly ERA5 model records** for 16–19 September 2026 at the generalized AOI centre (15.525 N, 45.075 E). These are regional model/reanalysis values, not measured wind at the ridge or valley.
- NASA FIRMS archive query was **skipped** because the GitHub Actions secret `NASA_FIRMS_MAP_KEY` is not configured.

## Selected ERA5 context (UTC)

At 07:00 UTC on 16 September: 2 m temperature 28.2 °C, relative humidity 19%, 10 m wind 9.2 m/s from 35° (meteorological direction), gust 24.8 m/s, cloud cover 2%, no precipitation. At 12:00 UTC: wind 18.3 m/s, gust 42.5 m/s, direction 38°. These values are coarse ERA5 context and must not be used as a site-specific plume trajectory without pressure-level and terrain-aware analysis.

## What this run does not establish

1. It does not visually confirm a burn scar, aircraft debris or a wreckage-removal route.
2. Sentinel-1 scene metadata is not yet a calibrated/co-registered SAR change analysis.
3. Sentinel-2 STAC metadata and asset links are not the same as inspecting the 10 m / 20 m source rasters.
4. No FIRMS archive detection table was retrieved.
5. The 375 m-class VIIRS fire product cannot reliably exclude a small or short-lived fire.
6. No revised coordinate or smaller uncertainty radius is justified.

## Next technical stage

- Retrieve and inspect actual Sentinel-2 JP2 bands (B02/B03/B04/B08/B11 and SCL) for pre/post dates, with a pixel-level cloud/shadow mask and consistent map projection.
- Obtain Sentinel-1 VV/VH COG assets for compatible relative-orbit passes, then terrain-correct/co-register before comparing backscatter.
- Configure a NASA FIRMS MAP_KEY as a repository Actions secret only if the owner chooses; never put the key in a committed file or chat.
- Compare any apparent surface anomaly against basalt outcrops, topographic shadow, slope/aspect and illumination geometry.
- Trace original community/forum posts and classify them by source independence; reposts of BBC/Me1Ray material are not independent confirmations.
- Keep the user's and Me1Ray's candidate coordinates unchanged until a reproducible visual match supports a revision.

## Machine-readable output

The run artifact contains the two STAC catalog JSON files, GIBS download log and browse images, ERA5 hourly JSON, FIRMS status JSON and a machine-readable summary.
