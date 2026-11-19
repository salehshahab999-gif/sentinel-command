# Jabal Haylan F-15: Me1Ray Coordinate Reconciliation

**Status:** preliminary terrain-screening result, not a verified crash-site coordinate  
**Research date:** 19 November 2026  
**Repository:** `salehshahab999-gif/sentinel-command`

## Question

Can the Me1Ray coordinate be adjusted using Saleh's reported elevation of approximately 1,897 m and the terrain profile toward the Jabal Haylan summit?

## Fixed reference coordinates

| Reference | Latitude | Longitude | Reported / sampled elevation |
|---|---:|---:|---:|
| Saleh estimate | 15.497610 | 45.075170 | approximately 1,897–1,898 m |
| Me1Ray attribution | 15.541900 | 45.080792 | SRTM 1,594 m; ASTER 1,583 m |
| Jabal Haylan summit reference | 15.524170 | 45.074720 | SRTM 2,002 m; ASTER 2,001 m |

Source for the elevations: OpenTopoData API, SRTM 30m and ASTER 30m endpoints. These are DEM grid samples, not surveyed ground elevations.

## First measurable result

A 21-point profile was sampled along the straight transect from the Me1Ray coordinate toward the summit reference.

The terrain rises from 1,594 m at the Me1Ray coordinate to approximately 1,904 m around **15.53492085, 45.07840172** in SRTM, then continues toward the summit. ASTER gives 1,887 m at that same coordinate. A nearby sample at **15.53453099, 45.07826820** gives SRTM 1,902 m and ASTER 1,898 m.

The nearby point **15.53453099, 45.07826820** is therefore a useful *elevation-matched candidate* for further visual testing:
- distance from Me1Ray: approximately 863 m;
- bearing from Me1Ray: approximately 198.3°;
- distance from Saleh's estimate: approximately 4.12 km;
- distance from summit reference: approximately 1.21 km;
- SRTM elevation: 1,902 m;
- ASTER elevation: 1,898 m.

This candidate is not a correction to the crash coordinate. It is a point on the Me1Ray-to-summit transect whose DEM elevations happen to be close to Saleh's reference elevation. It remains about 4.1 km from Saleh's coordinate, so elevation agreement does **not** reconcile the two horizontal estimates.

## What this does and does not establish

1. The Me1Ray coordinate lies on terrain roughly 300 m lower than Saleh's elevation reference in both sampled DEM products.
2. A higher-elevation part of the transect exists roughly 0.86 km southwest of Me1Ray.
3. SRTM and ASTER disagree locally by several metres to more than 10 m, so a single 1–2 m match must not be overinterpreted.
4. The DEM transect does not prove that the video camera, wreckage, or impact point lies on this line.
5. Elevation alone supplies no unique horizontal displacement vector. The candidate must be tested against independent skyline, ridge, slope/aspect, and fixed-feature matches from the original media.

## Provisional conclusion

**Do not replace either published coordinate yet.** Record **15.53453099, 45.07826820** only as an elevation-matched terrain candidate for visual comparison. The currently available measurements do not justify shrinking Saleh's 1.5 km uncertainty radius or claiming that Me1Ray's coordinate has been corrected.

## Reproducibility

The script `research/jabal-haylan-f15-dem-reconciliation.py` samples 41 points from Me1Ray toward the summit reference using both OpenTopoData DEM products and writes a CSV profile plus a JSON candidate ranking. GitHub Actions runs it on pushes affecting this investigation and can also be started manually from the repository's Actions tab.

- API: https://www.opentopodata.org/
- SRTM endpoint: https://api.opentopodata.org/v1/srtm30m
- ASTER endpoint: https://api.opentopodata.org/v1/aster30m
- Original assessment: https://github.com/salehshahab999-gif/sentinel-command/blob/master/Jabal-Haylan-F15-Geolocation-Assessment.md
- Method guide: https://github.com/salehshahab999-gif/sentinel-command/blob/master/OSINT-Geolocation-Further-Uncertainty-Reduction-Guide.md

## Evidence labels

- **OBSERVED DATA:** API-returned SRTM/ASTER elevation samples at the coordinates listed above.
- **ANALYTICAL INFERENCE:** nearby transect segment reaches approximately Saleh's elevation.
- **UNRESOLVED:** whether any candidate corresponds to the filmed viewpoint, debris field, or impact point.
