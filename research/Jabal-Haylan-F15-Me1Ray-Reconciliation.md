# Jabal Haylan F-15: Me1Ray Coordinate Reconciliation

**Status:** preliminary terrain-screening result, not a verified crash-site coordinate  
**Research update:** 20 November 2026 (Asia/Tehran)  
**GitHub Actions:** run #1 completed successfully  
**Repository:** `salehshahab999-gif/sentinel-command`

## Question

Can the Me1Ray coordinate be adjusted using Saleh's reported elevation of approximately 1,897–1,898 m and the terrain profile toward the Jabal Haylan summit?

## Fixed reference coordinates

| Reference | Latitude | Longitude | DEM / reported elevation |
|---|---:|---:|---:|
| Saleh estimate | 15.497610 | 45.075170 | approximately 1,897–1,898 m |
| Me1Ray attribution | 15.541900 | 45.080792 | SRTM approximately 1,594 m; ASTER approximately 1,583 m |
| Jabal Haylan summit reference | 15.524170 | 45.074720 | SRTM approximately 2,002 m; ASTER approximately 2,001 m |

Elevation values are OpenTopoData API grid samples from SRTM 30m and ASTER 30m products, not surveyed ground elevations.

## GitHub Actions execution

The workflow ran on the `master` branch and completed successfully.

- Workflow: [Jabal Haylan F-15 DEM Reconciliation](https://github.com/salehshahab999-gif/sentinel-command/actions/workflows/jabal-haylan-dem-reconciliation.yml)
- Run #1: [completed successfully](https://github.com/salehshahab999-gif/sentinel-command/actions/runs/44625110348)
- Commit: `151e2f7a7cd856633e8c256bd30600dc035d053c`
- Job: `Sample and compare SRTM / ASTER elevation profiles`
- Result: all five substantive steps completed successfully, including DEM query, ranking, and artifact upload.
- Artifact: `jabal-haylan-dem-profile` (CSV profile and JSON candidate summary), retained until 19 December 2026.

## 41-point transect result

The workflow sampled 41 points along the straight transect from the Me1Ray coordinate toward the summit reference, using both SRTM 30m and ASTER 30m.

Two nearby samples deserve attention, for different reasons:

### Candidate A: closest mean elevation to Saleh's reference

**15.53480802, 45.07836308**

- SRTM: 1,904 m
- ASTER: 1,892 m
- Mean: 1,898 m
- Difference between DEM products: 12 m
- Distance from Me1Ray: 830.4 m
- Bearing from Me1Ray: 198.3° (south-southwest)
- Distance from Saleh's estimate: 4,150.4 m
- Distance from summit reference: 1,245.6 m

This is the closest sampled mean elevation to the 1,897 m target, but the two DEM products differ by 12 m at this cell.

### Candidate B: strongest agreement between the two DEM products

**15.53436477, 45.07821127**

- SRTM: 1,901 m
- ASTER: 1,900 m
- Mean: 1,900.5 m
- Difference between DEM products: 1 m
- Distance from Me1Ray: 882.3 m
- Bearing from Me1Ray: 198.3° (south-southwest)
- Distance from Saleh's estimate: 4,099.9 m
- Distance from summit reference: 1,193.7 m

Candidate B is slightly higher than the target, but the close agreement between two separate DEM products makes its elevation estimate more internally consistent.

## Interpretation

1. At the Me1Ray coordinate, the sampled terrain is roughly 300 m lower than Saleh's reported elevation.
2. Along the Me1Ray-to-summit transect, the terrain reaches the 1,897–1,898 m elevation band about 0.83 km southwest of Me1Ray.
3. The candidate points remain approximately 4.1 km from Saleh's coordinate. Therefore, matching elevation does not reconcile the two horizontal estimates.
4. The transect is only one line through the terrain. It does not establish that the camera viewpoint, wreckage, or impact point lies on that line.
5. Elevation alone cannot provide a unique horizontal correction vector. The two candidates are terrain-screening points, not replacement crash coordinates.

## Provisional conclusion

**Do not replace either published coordinate yet.** Keep Saleh's estimate, **15.497610, 45.075170**, and the attributed Me1Ray coordinate, **15.541900, 45.080792**, unchanged in the main assessment.

For the next visual test, retain Candidate A as the closest elevation match and Candidate B as the more consistent two-DEM match. Neither result justifies reducing the original 1.5 km uncertainty radius. That requires independent matching of the original footage against skyline geometry, ridgelines, slope/aspect, and fixed terrain features.

## Reproducibility

The script `research/jabal-haylan-f15-dem-reconciliation.py` samples 41 points and writes:
- `research/output/me1ray_to_summit_dem_profile.csv`
- `research/output/dem_candidate_summary.json`

The GitHub Actions run uploaded both outputs as the `jabal-haylan-dem-profile` artifact.

- API: https://www.opentopodata.org/
- SRTM endpoint: https://api.opentopodata.org/v1/srtm30m
- ASTER endpoint: https://api.opentopodata.org/v1/aster30m
- Original assessment: https://github.com/salehshahab999-gif/sentinel-command/blob/master/Jabal-Haylan-F15-Geolocation-Assessment.md
- Method guide: https://github.com/salehshahab999-gif/sentinel-command/blob/master/OSINT-Geolocation-Further-Uncertainty-Reduction-Guide.md

## Evidence labels

- **OBSERVED DATA:** 41 coordinate/elevation samples returned by the SRTM 30m and ASTER 30m API endpoints; GitHub Actions logs and uploaded artifact confirm the run.
- **ANALYTICAL INFERENCE:** a segment southwest of Me1Ray reaches terrain elevations close to Saleh's reported elevation.
- **UNRESOLVED:** whether either candidate matches the filmed viewpoint, debris field, or impact point.
