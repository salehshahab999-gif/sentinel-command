# Riyadh Fire OSINT Assessment — 3 October 2026

## Purpose

This document records a public, reproducible OSINT assessment of the large smoke/fire event reported in Riyadh on 3 October 2026.

The objective is to preserve the evidence, methodology, uncertainty, and source trail so that other researchers do not need to repeat the initial multi-hour collection from zero.

This is an analytical assessment, not an official incident investigation.

## Public Safety Note

The event is associated in reporting with an energy facility in southern Riyadh. Because this is an active strategic infrastructure incident, this public record intentionally does not publish an operationally precise fire/impact coordinate or a sub-2-km target area.

The coordinate below is therefore a generalized research reference only.

## Generalized Geographic Reference

- Area: Southern Riyadh, Saudi Arabia
- Generalized latitude: approximately 24.6 N
- Generalized longitude: approximately 46.8 E
- Intended uncertainty: at least 10 km
- City elevation reference: approximately 600 m above sea level

Riyadh is generally described by Saudi and international geographic sources as being at roughly 600 m elevation. ESA's Sentinel-2 presentation of Riyadh also describes the city as approximately 600 m above sea level.

## Event Time

The main eyewitness reporting appeared on 3 October 2026.

One of the visual-analysis hypotheses investigated a social-media video timestamp around 10:47:17 local Riyadh time. This timestamp is treated as a working hypothesis rather than an independently authenticated camera timestamp.

## Evidence Convergence

The following evidence categories converge on the broad southern-Riyadh area:

1. Eyewitness reporting of a large plume of smoke and fire near an Aramco facility.
2. Mobile-phone imagery documenting smoke rising over southern Riyadh.
3. Satellite thermal-anomaly reporting associated with the refinery area.
4. Public descriptions of thick smoke moving northward over the city.
5. Weather information indicating a southerly component in some observations/models, although wind observations are not completely consistent.
6. Solar-position geometry compatible with the reported daytime imagery.

## Satellite Evidence

### NASA FIRMS / VIIRS

NASA FIRMS distributes near-real-time MODIS and VIIRS active-fire detections. The VIIRS I-band active-fire product has a nominal 375 m resolution.

Important limitation: a FIRMS detection should not be interpreted as a meter-level impact coordinate. Pixel geometry, geolocation uncertainty, fire size, viewing geometry, cloud/smoke effects, and the timing of the satellite overpass all matter.

A current secondary report stated that higher-intensity VIIRS thermal activity was visible across the Riyadh refinery area on 3 October 2026.

### Sentinel-2

Sentinel-2 is useful for geographic context, infrastructure/terrain comparison, and before/after analysis, but it is not a minute-by-minute incident sensor. It should therefore have lower weight than time-matched VIIRS/FIRMS and verified ground photography when reconstructing the exact event moment.

### ESA / Copernicus

ESA's published Riyadh Sentinel-2 material confirms that Riyadh can be examined at Sentinel-2 imagery scales down to 10 m for suitable bands/products.

## Solar Geometry

For the working hypothesis of approximately 10:47 local Riyadh time on 3 October 2026:

- Solar azimuth: approximately 154°
- Solar elevation: approximately 58°
- Expected shadow direction: approximately 334°

This is useful only as a consistency test. Shadow geometry can help determine whether a claimed timestamp and camera orientation are plausible, but it cannot establish the fire origin on its own.

## Smoke Direction

Available public reporting and imagery descriptions indicate a broadly northward / north-northwestward smoke displacement over Riyadh.

Smoke direction is not the same thing as wind direction at the source. A reliable back-trace also requires the boundary-layer wind, wind shear with altitude, plume rise, and local turbulence.

## Weather / Wind

The collected weather sources did not converge on one exact minute-level wind vector at the facility.

Observed/modelled values included a southerly component in some datasets and easterly components in others.

Therefore:

- Wind is treated as supporting evidence.
- Wind is not used as a single-line back-trace to a precise coordinate.
- A future analysis should prefer station observations or high-resolution reanalysis at the event time.

## Open-Source / Social-Media Evidence

Public videos and photographs circulated through Arabic, Persian, European, and international channels.

The major limitation is duplication: multiple websites and channels appear to have republished the same original photographs or video.

For reproducibility, researchers should record:

- original uploader;
- first-seen timestamp;
- exact media hash where available;
- frame extraction timestamp;
- visible shadows;
- skyline/infrastructure geometry;
- direction of smoke;
- vehicle placement;
- signs and text;
- EXIF metadata if the original file is available.

## Geolocation Method

Preferred workflow:

Event timestamp -> sun position -> shadow direction -> camera orientation -> smoke direction -> weather/wind constraints -> satellite thermal evidence -> infrastructure/road geometry -> independent visual verification.

No single layer is sufficient.

## Confidence Assessment

### High confidence

- A significant smoke/fire event occurred in Riyadh on 3 October 2026.
- The event was reported in the southern Riyadh / Aramco refinery vicinity.
- Satellite thermal anomalies were reported in the broader facility area.

### Moderate confidence

- The visible smoke displacement was generally northward.
- Daytime solar geometry is consistent with the reported time window.

### Low-to-moderate confidence

- Any inference about the precise wind vector at the source.
- Any claim assigning a precise ignition/impact point.
- Any claim about attack mechanism without independent official confirmation.

## Current Research Boundary

The public evidence supports a southern-Riyadh industrial-zone assessment.

It does not justify a public meter-level or sub-2-km incident coordinate.

The purpose of this file is to preserve the evidence chain while preventing an approximate research result from being mistaken for a confirmed operational coordinate.

## Sources

1. Reuters — Fire, smoke seen near Aramco facility in Riyadh, witness says
   https://www.reuters.com/business/energy/fire-smoke-seen-near-aramco-facility-riyadh-witness-says-2026-10-03/

2. Reuters Connect — Smoke rises from a fire at the Aramco refinery south of Riyadh
   https://www.reutersconnect.com/

3. Türkiye Today — Smoke reported over Riyadh after alleged Houthi strike on Aramco refinery
   https://www.turkiyetoday.com/region/smoke-reported-over-riyadh-after-alleged-houthi-strike-on-aramco-refinery-3229510

4. NASA Earthdata / FIRMS
   https://firms.modaps.eosdis.nasa.gov/

5. NASA Earthdata FIRMS documentation
   https://wiki.earthdata.nasa.gov/spaces/FIRMS/pages/32079892/Fire%2BInformation%2Bfor%2BResource%2BManagement%2BSystem%2BFIRMS

6. NASA/MODAPS VIIRS 375 m active-fire product
   https://modaps.eosdis.nasa.gov/services/about/products/viirs-land-c2-nrt/vnp14imgtdl_nrt.html

7. ESA — Earth from Space: Riyadh, Saudi Arabia
   https://www.esa.int/ESA_Multimedia/Images/2024/10/Earth_from_Space_Riyadh_Saudi_Arabia

8. Saudipedia — Riyadh City
   https://saudipedia.com/en/riyadh-city

9. Saudi newspaper Al Riyadh — local security reporting
   https://www.alriyadh.com/news.local

## Reuse

This document may be used as a public research starting point. New findings should be appended with source dates, source URLs, acquisition times, and an explicit distinction between:

- observed fact;
- source claim;
- analytical inference;
- unresolved question.
