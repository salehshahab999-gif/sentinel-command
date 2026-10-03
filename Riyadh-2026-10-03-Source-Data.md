# Riyadh Fire OSINT - Source Data Notes

## Date
3 October 2026

## Event
Large smoke/fire reported in southern Riyadh near an Aramco facility.

## Key evidence
- Reuters eyewitness report: https://www.reuters.com/business/energy/fire-smoke-seen-near-aramco-facility-riyadh-witness-says-2026-10-03/
- Reuters Connect photographs: https://www.reutersconnect.com/
- Türkiye Today satellite/FIRMS reporting: https://www.turkiyetoday.com/region/smoke-reported-over-riyadh-after-alleged-houthi-strike-on-aramco-refinery-3229510
- NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/
- NASA FIRMS documentation: https://wiki.earthdata.nasa.gov/spaces/FIRMS/pages/32079892/Fire%2BInformation%2Bfor%2BResource%2BManagement%2BSystem%2BFIRMS
- NASA VIIRS 375 m product: https://modaps.eosdis.nasa.gov/services/about/products/viirs-land-c2-nrt/vnp14imgtdl_nrt.html
- ESA Riyadh Sentinel-2: https://www.esa.int/ESA_Multimedia/Images/2024/10/Earth_from_Space_Riyadh_Saudi_Arabia
- Saudipedia Riyadh geography: https://saudipedia.com/en/riyadh-city
- Al Riyadh local reporting: https://www.alriyadh.com/news.local

## Satellite data interpretation
VIIRS is a thermal anomaly detector with nominal 375 m I-band resolution. FIRMS coordinates should be treated as satellite observation cells, not exact fire/impact coordinates.

Sentinel-2 is valuable for infrastructure and change comparison but is not a minute-by-minute incident sensor.

## Solar geometry used in the investigation
Working time hypothesis: approximately 10:47 local Riyadh time.

Approximate solar azimuth: 154 degrees.
Approximate solar elevation: 58 degrees.
Expected shadow direction: about 334 degrees.

These numbers are consistency checks only.

## Smoke and wind
Public descriptions place the smoke axis broadly northward / north-northwestward.

Weather sources did not provide one consistent minute-level wind vector, so no exact back-trace should be inferred from wind alone.

## Generalized public coordinate
Generalized reference only:
24.6 N, 46.8 E
Public uncertainty: at least 10 km
Broad Riyadh elevation reference: about 600 m above sea level

A precise active-fire/impact coordinate is intentionally omitted from this public record.

## Reproducibility
For each future image/video:
1. Preserve the original URL and uploader.
2. Record first-seen time separately from claimed capture time.
3. Extract EXIF when the original file is available.
4. Hash original media where possible.
5. Record visible shadows, smoke axis, structures, roads, signs, and distinctive objects.
6. Separate observations from source claims and analytical inferences.
7. Record contradictions rather than deleting them.

## Status
Public evidence supports the broad southern-Riyadh industrial-area assessment. Exact incident-point accuracy remains unresolved.
