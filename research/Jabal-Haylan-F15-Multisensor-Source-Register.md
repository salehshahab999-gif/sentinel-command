# Jabal Haylan F-15: Multisensor and Public-Discussion Source Register

**Prepared:** 20 November 2026  
**Purpose:** Reproducible source inventory for reassessing public wreckage footage.  
**Status:** Source register and collection plan, not a new geolocation finding.

## Evidence hierarchy
1. Original satellite products and metadata.
2. Primary statements and original media.
3. Independent visual/geolocation verification.
4. Specialist technical analysis.
5. Community geolocation datasets and specialist forums as leads.
6. Reposts and general commentary.

A repost of the same image or claim is not independent corroboration.

## Satellite and environmental data

| ID | Source | Data / use | Limitations |
|---|---|---|---|
| RS01 | [Copernicus STAC: Sentinel-1 GRD](https://stac.dataspace.copernicus.eu/v1/collections/sentinel-1-grd) | C-band SAR, VV/VH backscatter, day/night surface context; compare acquisitions before and after 16 September. | Quantitative change detection requires calibrated, terrain-corrected, co-registered scenes. Layover, radar shadow, incidence angle and surface roughness complicate interpretation. |
| RS02 | [Copernicus STAC: Sentinel-2 L2A](https://stac.dataspace.copernicus.eu/v1/collections/sentinel-2-l2a) | 10 m visible/NIR and 20 m SWIR reflectance; dated change comparison and cloud/shadow classification. | A dark pixel is not automatically a burn scar; basalt, topographic shadow, moisture and atmospheric effects are alternatives. |
| RS03 | [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) | MODIS/VIIRS active-fire detections. Optional authenticated archive query in GitHub Actions. | Nominal VIIRS I-band scale is about 375 m; a small or short-lived fire may be missed. API key belongs in GitHub Actions secrets, never in source code. |
| RS04 | [NASA GIBS / Worldview layers](https://gibs.earthdata.nasa.gov/) | Dated VIIRS thermal-anomaly and corrected-reflectance browse images. | Browse visualization only; not a calibrated fire-radiative-power measurement. |
| RS05 | [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) | ERA5 hourly context for wind, cloud, temperature and pressure during 16–19 September. | ERA5 is too coarse for local mountain-valley wind reconstruction. Regional context only. |
| RS06 | [USGS Landsat Collection 2](https://www.usgs.gov/landsat-missions/landsat-collection-2) | Independent optical/SWIR archive for before/after surface comparison where dates and cloud permit. | Revisit interval and spatial resolution may miss a small site or short-lived event. |

## Community and forum leads

| ID | Source | What it contributes | Evidentiary status |
|---|---|---|---|
| CM01 | [Pakistan Defence Forum: Yemen Civil War News and Discussion, page 516](https://defencepk.com/forums/threads/yemen-civil-war-news-and-discussion-an-evolving-situation.395/page-516) | Discussion dated 15 October questioning the lack of later wreckage imagery and a filmed removal process. | User discussion only. Absence of posted footage does not prove the wreckage was not recovered or moved. |
| CM02 | [GeoConfirmed / Dawn Géopolitique Yemen ground-footage statistics](https://geopolitique.aubeetoilee.com/en/terrain/statistiques?conflit=yemen&jour=2026-09-17&pays=YEM&periode=90&type=tout) | Public index reports a large Yemen ground-footage collection through 19 November and attributes some geolocation work to @Me1Ray. A lead for tracing original posts and visual material. | Aggregate statistics do not prove a particular F-15 image is present. Inspect the individual post, original media, timestamp and geolocation method. |
| CM03 | [GeoConfirmed / Dawn Géopolitique ground-footage browser](https://geopolitique.aubeetoilee.com/en/terrain?conflit=yemen&jour=2026-09-17&pays=YEM&periode=90&type=tout) | Searchable community-indexed posts and source accounts. | Community geolocation is a lead, not independent validation without original media and method review. |

## Original incident references already recorded

- [BBC Verify, 17 September 2026](https://www.bbc.com/news/articles/c8vgy3p6k3y9o): geolocation using terrain, sun position and satellite imagery; reports a dark mark in imagery dated 16 September as consistent with possible scorching.
- [Reuters Connect, 17 September 2026](https://www.reutersconnect.com/collection/refile-military-expert-identifies-saudi-f-15sa-from-wreckage-shown-by-houthis/dGFnOnJldXRlcnMuY29tLDIwMjY6bmV3c21sX1ZBMzQzOTE3MDkyMDI2UlAx): expert assessment of visible wreckage; not an independent geolocation.
- [Pakistan Defence Forum discussion](https://defencepk.com/forums/threads/yemen-civil-war-news-and-discussion-an-evolving-situation.395/page-516): discussion only, not proof of wreckage disposition.

## Required metadata
For every new observation, record original URL, author/publisher, capture time, publication time, retrieval time UTC, sensor/platform, product ID/version, acquisition time UTC, resolution, cloud cover, processing level, original asset URL, independence group, evidence label, uncertainty and alternative explanations.

## Interpretation guardrails
- Keep acquisition, publication and retrieval times separate.
- Keep Sentinel-1 radar separate from Sentinel-2 optical observations.
- Keep NASA FIRMS detections separate from GIBS browse images.
- Do not interpret non-detection as proof of absence.
- Do not count outlets repeating one original report as independent geolocations.
- Do not infer wreckage removal from the absence of later photographs.
- Do not reduce the existing uncertainty radius without independent, spatially discriminating evidence and a documented visual match.
- This public workflow intentionally does not publish a more precise wreckage coordinate.
