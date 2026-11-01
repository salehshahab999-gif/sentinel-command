# Sources, Evidence Notes, and Open Tasks

## Source register
| Source | Material used / relevance | Limitations |
|---|---|---|
| [WAM, 30 Oct 2026](https://www.wam.ae/en/article/c3051mm-oil-spill-from-gem-no-tanker-contained) | UAE state-media report that spill attributed to GEM NO.2 was contained | Official media statement; does not independently establish impact point or full causal chain |
| [The Red Zone analysis](https://theredzone-newsletter.beehiiv.com/p/umm-al-quwain-spill-imagery-gem-no-2) | Published interpretation of Sentinel-2 (19 Oct) and Sentinel-1 (21 Oct) imagery | Raw products and processing workflow not archived in this dossier |
| [AIS Vessel Tracker](https://aisvesseltracker.com/vessel/gem-no2-mmsi-354264000-imo-9735373) | Vessel identity and AIS history reference | Raw AIS messages/source chain not archived |
| [MSCIO alert 171](https://mscio.eu/alerts/171) | Maritime-security alert reference for incident context | Exact coordinate attribution must be checked against original notice |
| [Auke Visser](https://www.aukevisser.nl/supertankers/VLCC-G/id1041.htm) | Secondary vessel particulars | Not an authoritative ship registry |
| [Copernicus Data Space](https://browser.dataspace.copernicus.eu/) | Retrieval portal for Sentinel imagery | No raw scene downloaded in this research stage |
| [ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-timeseries) | Candidate hourly wind/wave reanalysis | No local data extraction performed |
| [Copernicus Marine](https://marine.copernicus.eu/) | Candidate current/wave datasets | No local data extraction performed |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/map/) | Check separate thermal-anomaly lead | Raw record for Fujairah lead not independently retrieved |
| [Kite Beach Center webcam listing](https://worldcam.eu/webcams/asia/uae/19880-umm-al-quwain-kite-beach-center) | Potential public webcam source | Historical footage for 9–11 Oct not confirmed |
| [KBC station](https://www.seanssurfreport.com/stations/kbc) | Public station reference | No archived footage verified |
| [AP/Yahoo coastal video](https://www.yahoo.com/news/videos/oil-spill-washes-over-umm-100912184.html) | Public video of shoreline pollution | Coastal aftermath, not initial incident point |
| [LiveTube coastal report](https://www.livetube.tv/news/video-oil-spill-washes-over-umm-al-quwain-beaches-in-uae-following-tanker-strike) | Public video/report of shoreline pollution | Geolocation and capture time require frame-level verification |
| [Al Jazeera Arabic, 25 Oct 2026](https://www.aljazeera.net/news/2026/10/25/تسرب-نفطي-واسع-قبالة-رأس-الخيمة) | Regional reporting on oil pollution | Verify original footage date/location |
| [CCTV+, 12 Oct 2026](https://www.cctvplus.com/news/20261012/8503254.shtml) | Reports an Iranian-source claim about a tanker explosion | Vessel identity/location not independently matched to GEM NO.2 |
| [Misbar fact-check](https://www.misbar.com/en/factcheck/2026/10/19/video-oil-tanker-being-hit-strait-hormuz-old) | Identifies a circulated Sky Light video as old | Exclude that clip as evidence of the October GEM NO.2 event |

## Evidence distinctions
- A reported incident-area coordinate is not automatically the impact coordinate.
- AIS positions recorded after the reported event are not the impact point.
- A satellite image of a vessel or slick days later is not direct proof of where the initial incident occurred.
- Publication time is not necessarily video capture time.
- The Fujairah thermal-anomaly lead at 25.14 N, 56.94 E is separate and must not be attributed to GEM NO.2 without independent linkage.

## Open tasks, in priority order
1. Retrieve the original UKMTO/MSCIO notice and verify exact wording, time, and coordinate.
2. Acquire raw AIS messages for IMO 9735373 / MMSI 354264000 covering 8–11 October 2026; preserve provider, timestamps, and message fields.
3. Identify Sentinel-1 and Sentinel-2 product IDs covering the area and dates; download metadata and scenes where access permits.
4. Independently reproduce the 19 October optical and 21 October SAR observations; document processing parameters and uncertainty.
5. Recover the original Mariner Avin X post/video; record URL, account, publication timestamp, capture-time caveat, and file hash.
6. Geolocate shoreline video frames from AP, LiveTube, and Al Jazeera using fixed coastal features.
7. Check whether the Kite Beach Center webcam has a retrievable archive for 9–11 October; do not assume the public listing means historical footage exists.
8. Retrieve hourly ERA5 wind/wave and Copernicus Marine current/wave data; record product IDs, time range, grid, and units.
9. Run a transparent slick-drift analysis with uncertainty bounds; do not back-project a single deterministic track.
10. Retrieve raw NASA FIRMS observations for the separate Fujairah lead and keep it in a separate case file.

## Data acquisition log
As of 2026-11-02, the raw AIS, Sentinel-1/2, ERA5, Copernicus Marine, and NASA FIRMS files have **not** been downloaded or independently processed in this dossier. The coordinates and interpretations above are transcribed from the research notes and cited public/secondary sources.

## Method for future updates
For each new item, log source URL, publisher/account, publication time, observation/acquisition time (UTC), retrieval date, coordinates and CRS, raw/derived status, processing method, confidence, and limitations. Preserve original files and checksums where permitted.
