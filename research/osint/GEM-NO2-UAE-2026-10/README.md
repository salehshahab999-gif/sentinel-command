# GEM NO.2 Tanker Incident and Umm Al Quwain Oil Spill

**Case ID:** GEM-NO2-UAE-2026-10  
**Last updated:** 2026-11-02  
**Language:** English  
**Research type:** Open-source intelligence (OSINT)

## Purpose
This folder preserves the public-source material, reported coordinates, source register, and research workflow assembled so far concerning the October 2026 incident involving the tanker GEM NO.2 and the subsequent oil pollution reported along the UAE coast.

This is an evolving OSINT working dossier, not a final incident investigation. A source or coordinate included here is not automatically independently verified.

## Executive summary
The vessel associated with this case is reported as **GEM NO.2** (IMO **9735373**, MMSI **354264000**), a Panama-flagged crude-oil VLCC. Public reporting places an incident on 9 October 2026 west of Al Jazirah, UAE. AIS positions cited for 10 October and satellite-image analyses published for 19 and 21 October place a large vessel and an oil slick in a nearby maritime area. UAE state media reported on 30 October that the spill attributed to GEM NO.2 had been contained.

**The exact impact/incident coordinate has not been independently established.** Later AIS positions and satellite observations must not be mislabeled as the impact point.

## Vessel particulars (secondary-source values)
| Field | Reported value |
|---|---|
| Vessel | GEM NO.2 |
| IMO | 9735373 |
| MMSI | 354264000 |
| Type | Crude-oil tanker / VLCC |
| Flag | Panama |
| Year built | 2017 |
| Builder | Japan Marine United, Ariake |
| Length | approx. 330 m |
| Beam | approx. 60 m |
| DWT | approx. 302,783 t |
| Registered owner | GEM NO. 2 Maritime Corporation |
| Technical manager | Fleet Management Limited |

These particulars require cross-checking against authoritative vessel registries before formal publication.

## Coordinate register
All coordinates use WGS84 decimal degrees. See [coordinates.csv](coordinates.csv) and [reference-points.geojson](reference-points.geojson).

| ID | Date/time (UTC) | Latitude | Longitude | Evidence type | Interpretation |
|---|---|---:|---:|---|---|
| P-01 | 2026-10-09, approx. 10:00 | 25.733333 | 55.566667 | Coordinate attributed in prior research to a weekly UKMTO summary | Reported incident-area reference; original notice must be checked. Not a confirmed impact point. |
| P-02 | 2026-10-10 03:18:03 | 25.7883 | 55.5811 | Public AIS tracker event cited in prior research | Later vessel position; raw AIS message not archived. |
| P-03 | 2026-10-10 03:43:52 | 25.7886 | 55.5811 | Public AIS tracker event cited in prior research | Reported stop position; raw AIS message not archived. |
| P-04 | 2026-10-19 | 25.8058049 | 55.5862595 | Published satellite-image analysis | Later observation area, not the impact point. |
| P-05 | 2026-10-19 | approx. 25.788–25.806 | approx. 55.586–55.587 | Published image-analysis area | Approximate area only. |
| P-06 | 2026-10-21 | approx. 25.789 | approx. 55.587 | Published Sentinel-1 interpretation | Approximate secondary interpretation; raw product not archived. |
| CAM-01 | undated | 25.5472 | 55.5369 | Public webcam directory listing | Kite Beach Center webcam; historical footage for 9–11 October is unconfirmed. |

### Coordinate cautions
- P-01 is attributed to a weekly UKMTO summary in the research trail. Verify it against the original UKMTO/MSCIO notice before describing it as an official precise coordinate.
- P-02 and P-03 are later AIS positions, not the incident location.
- P-04 to P-06 refer to later satellite observations or interpretations, not the impact location.
- The estimate **25.78, 55.57** mentioned in secondary reporting is not a confirmed official coordinate.
- The approximately 6.3 km separation between P-01 and P-02 is a difference between reported positions at different times, not proof of the vessel's actual track.

## Timeline
| Date/time | Event | Evidence status |
|---|---|---|
| 2026-10-09, approx. 10:00 UTC | Incident reported west of Al Jazirah | Maritime reporting; exact impact position unresolved |
| 2026-10-10, 03:18–03:44 UTC | AIS positions/stopping event cited for GEM NO.2 | Secondary AIS history; raw messages not archived |
| 2026-10-10 | Crew video reportedly posted by X account “Mariner Avin” | Reported by secondary coverage; original post/video not archived |
| 2026-10-19 | Optical satellite-image analysis of vessel and slick | Published analysis; raw imagery not archived |
| 2026-10-21 | Sentinel-1 radar interpretation cited | Published analysis; raw product ID/file not archived |
| 2026-10-24 to 25 | Oil pollution reported on UAE beaches | Media video/reporting; shoreline evidence, not original impact point |
| 2026-10-30 | UAE state media reports spill contained | Official UAE media report |

## Sources
1. **UAE state media (WAM), 2026-10-30:** [Oil spill from GEM NO.2 tanker contained](https://www.wam.ae/en/article/c3051mm-oil-spill-from-gem-no-tanker-contained)
2. **The Red Zone:** [Umm Al Quwain spill imagery / GEM NO.2 analysis](https://theredzone-newsletter.beehiiv.com/p/umm-al-quwain-spill-imagery-gem-no-2)
3. **AIS Vessel Tracker:** [GEM NO.2 vessel page and reported AIS history](https://aisvesseltracker.com/vessel/gem-no2-mmsi-354264000-imo-9735373)
4. **MSCIO/UKMTO reference:** [Alert reference 171](https://mscio.eu/alerts/171) — original notice and coordinate provenance require verification.
5. **Vessel particulars:** [Auke Visser, VLCC-G / GEM NO.2](https://www.aukevisser.nl/supertankers/VLCC-G/id1041.htm) — secondary vessel reference.
6. **Copernicus Data Space Browser:** [Sentinel product search](https://browser.dataspace.copernicus.eu/)
7. **Copernicus Sentinel-1:** [Mission and data collection](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-1)
8. **ERA5:** [Hourly single-level reanalysis](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-timeseries)
9. **Copernicus Marine:** [Marine data service](https://marine.copernicus.eu/)
10. **NASA FIRMS:** [Fire Information for Resource Management System](https://firms.modaps.eosdis.nasa.gov/map/)
11. **Public webcam listing:** [Kite Beach Center, Umm Al Quwain](https://worldcam.eu/webcams/asia/uae/19880-umm-al-quwain-kite-beach-center)
12. **Webcam station listing:** [KBC station](https://www.seanssurfreport.com/stations/kbc)
13. **Coastal video:** [AP video via Yahoo](https://www.yahoo.com/news/videos/oil-spill-washes-over-umm-100912184.html)
14. **Coastal video:** [LiveTube report](https://www.livetube.tv/news/video-oil-spill-washes-over-umm-al-quwain-beaches-in-uae-following-tanker-strike)
15. **Coastal video:** [Al Jazeera Arabic report, 2026-10-25](https://www.aljazeera.net/news/2026/10/25/تسرب-نفطي-واسع-قبالة-رأس-الخيمة)
16. **CCTV+:** [Video report, 2026-10-12](https://www.cctvplus.com/news/20261012/8503254.shtml) — reports an Iranian-source claim about a tanker explosion; vessel identity and location have not been independently matched to GEM NO.2.
17. **Misbar:** [Fact-check on an old Sky Light video](https://www.misbar.com/en/factcheck/2026/10/19/video-oil-tanker-being-hit-strait-hormuz-old) — the checked video should not be used as evidence of the October GEM NO.2 event.

## Research workflow and progress
### Completed desk-research steps
1. Identified the reported vessel name and public identifiers.
2. Collected secondary-source vessel particulars.
3. Recorded the incident-area coordinate attributed to UKMTO/weekly reporting and separated it from later AIS positions.
4. Collected later AIS positions cited for 10 October.
5. Recorded satellite-image coordinates and interpretations cited for 19 and 21 October.
6. Identified public-source references for crew and coastal videos.
7. Identified a public webcam listing near Umm Al Quwain and recorded that historical footage availability is unconfirmed.
8. Separated an unrelated eastern Fujairah thermal-anomaly lead from this GEM NO.2 case.
9. Added coordinate/source cautions to prevent later observations from being confused with the incident point.

### Not yet completed
The following steps have **not** been completed in this research stage. Do not infer that raw data have been downloaded or processed:
- Download and inspect raw Sentinel-1 GRD/SLC scenes for 8–22 October 2026.
- Search Sentinel-2 and Landsat scenes and archive product IDs and metadata.
- Obtain raw AIS messages for 8–11 October with timestamps, position, SOG, COG, heading, and source.
- Recover the original Mariner Avin X post and video file; inspect metadata and keyframes.
- Geolocate AP, LiveTube, and Al Jazeera coastal-video frames using fixed shoreline features.
- Download hourly ERA5 wind/wave fields and Copernicus Marine current/wave fields.
- Build a slick-drift model and estimate an uncertainty polygon for the incident area.
- Independently verify the provenance and exact wording of the UKMTO coordinate.

## Separate lead: eastern Fujairah thermal detections
A separate PANOPT entry was cited at **25.14°N, 56.94°E** for thermal detections on 7–8 October. This lead is **not attributed to GEM NO.2**. Raw NASA FIRMS records have not been independently retrieved in this research stage. Keep this lead separate unless vessel identity and event linkage are independently demonstrated.

## Evidence grading
- **High:** primary official record or raw data independently reproduced.
- **Medium:** reputable published reporting or track record with identifiable source, but raw source not independently archived.
- **Low:** secondary interpretation, approximate coordinate, or unverified social-media claim.
- **Unverified:** source or raw evidence not yet recovered.

## Reproducibility rules
For each new item, record source URL, publisher/account, publication time, observation/acquisition time (UTC), retrieval date, coordinates and CRS, raw/derived status, processing method, confidence, and limitations. Preserve original files and checksums when licensing and access permit. Never conflate publication time with capture time, a later vessel position with the impact location, or the separate Fujairah lead with GEM NO.2.

## Disclaimer
This is an OSINT working dossier. It does not establish responsibility, weapon type, exact impact point, or causation beyond what cited sources explicitly support. Public CCTV directories do not grant access to private shop or municipal camera systems.
