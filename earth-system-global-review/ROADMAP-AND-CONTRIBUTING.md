# Roadmap and Contribution Guide
## How to continue the Global Earth System Review

## 1. Purpose

This project is designed as a public research baseline that future contributors can extend. A researcher should be able to identify the current question, see the sources already checked, understand the uncertainty, and add new evidence without rebuilding the source collection from zero.

## 2. Priority roadmap

### Phase 1 - Maintain the global indicator snapshot
- Update global temperature from WMO, NOAA, Berkeley Earth, Copernicus and JMA.
- Update atmospheric CO₂, methane and nitrous oxide from WMO GAW and NOAA GML.
- Update fossil and energy-related CO₂ from Global Carbon Budget, IEA and EDGAR.
- Update sea-ice extent and rank from NASA/NSIDC, NIPR and OSI SAF.
- Update glacier and ice-sheet mass from WGMS and NASA GRACE/GRACE-FO.
- Update sea level from NASA altimetry, tide gauges and Copernicus Marine.

### Phase 2 - Expand regional and national comparison
Prioritize original products from China, Russia, India, Japan, Türkiye, Australia, South Africa, Brazil, Indonesia, Chile, Iceland and New Zealand. Record each nation's baseline and spatial domain. Do not force national anomalies into a global scale without a documented transformation.

### Phase 3 - Volcano and seismic monitoring atlas
Create structured records for active and restless volcanoes using Smithsonian GVP and national observatories. Track global earthquake events from USGS, ISC and EMSC, while keeping rapid and reviewed catalogs separate. Add local observatory alerts without comparing alert colours as universal danger levels.

### Phase 4 - Ocean-floor mapping and submarine systems
Prioritize new GEBCO grids, Seabed 2030 contributions, NOAA/JAMSTEC/GEOMAR expeditions, repeat multibeam surveys and cabled observatories. For submarine volcanoes, track depth, crater geometry, survey date, new volume and the evidence method.

### Phase 5 - Deep Earth and paleoscience
Add peer-reviewed seismic tomography, mineral physics, geomagnetic models, GPlates plate reconstructions, GEOROC rock analyses, Macrostrat stratigraphy, NOAA paleo records and PANGAEA datasets. Distinguish direct measurement from inversion and interpretation.

### Phase 6 - Public interface
Consider a static GitHub Pages dashboard after the data model stabilizes. The dashboard should read only from the versioned CSV/JSON tables and should show source dates, uncertainties and stale-data warnings.

## 3. How to submit a new data update

A valid update should include:
1. the source institution;
2. the exact product/report title;
3. publication date and observation period;
4. direct URL or DOI;
5. measurement or claim;
6. unit and baseline;
7. method and uncertainty;
8. whether it confirms, revises or contradicts an existing record;
9. the proposed change to the indicator snapshot;
10. a short explanation of why it matters.

Use the GitHub issue form **Earth-system data update** to propose a new observation. Use **Research correction / source conflict** when an existing statement needs correction or reconciliation.

## 4. File conventions

- Narrative reports: Markdown.
- Time series and indicators: CSV with one variable per row or a documented wide-format table.
- Machine-readable source metadata: CSV or JSON.
- Images: include only if the licensing and provenance are clear.
- Raw scientific datasets: link to the original archive; do not commit very large raw files to this repository.
- Analysis code: include a README, environment or dependency notes, and validation tests.

## 5. Naming convention

Use:
- report: YYYY-MM-DD-topic.md;
- data snapshot: YYYY-MM-DD-indicator-snapshot.csv;
- source record: stable source ID such as WMO-GHG-2026-22;
- event ID: agency-native ID where available.

## 6. Data freshness policy

Recommended update frequency:
- volcano alert bulletins: daily or when an agency changes status;
- earthquake event awareness: daily;
- atmospheric CO₂ and other greenhouse gases: monthly or when new official data are released;
- global temperature: monthly;
- sea ice: daily during melt/freeze seasons, monthly annual summary;
- ocean heat and sea level: monthly or quarterly product updates;
- glacier mass balance: annual;
- plate motion and deep-Earth reviews: when a new model or peer-reviewed study is released;
- paleoclimate archives: on dataset release.

Do not fabricate current data to satisfy a schedule. Mark unavailable or not yet updated.

## 7. Review checklist

Before merging:
- [ ] primary source linked;
- [ ] publication date and observation period stated;
- [ ] units and baseline recorded;
- [ ] product version recorded where available;
- [ ] uncertainty and coverage limitation stated;
- [ ] observation separated from interpretation;
- [ ] independent source checked where possible;
- [ ] conflicting values preserved;
- [ ] CSV passes validation;
- [ ] report links resolve;
- [ ] no unsupported prediction or alarmist language added.

## 8. Responsible public communication

This is a scientific information project, not an emergency warning service. In a hazard situation, readers should follow the official local geological, meteorological and civil-protection authority. The project should not forecast exact earthquake times, eruption times or local tsunami arrival times unless quoting a responsible agency's official warning.

## 9. Citation and reuse

When reusing a value, cite the original data producer and the product. The project documentation is offered under CC BY 4.0 unless a different license applies to the linked source. Always preserve source attribution and respect original dataset terms.

## 10. Suggested next scientific tasks

1. Download and compare the latest 2026 sea-ice daily grids from NSIDC and OSI SAF.
2. Build a reproducible monthly global-temperature comparison across NASA GISTEMP, NOAA, JMA, Berkeley Earth and ERA5 using one common baseline.
3. Create a glacier mass-balance table by region from WGMS.
4. Compare 2025 emissions by country from EDGAR and Global Carbon Budget without mixing CO₂ and CO₂-equivalent.
5. Build a global volcano status snapshot from GVP plus national observatories.
6. Create a seafloor survey coverage map from GEBCO_2026 and identify high-priority gaps.
7. Add a separate evidence register for submarine volcanoes with bathymetric survey provenance.
8. Build a plate-motion table from GNSS velocity products, with reference-frame metadata.

Contributors are encouraged to open small, well-sourced pull requests rather than one large, unauditable revision.


## Annual year-over-year review cycle

The project maintains annual series in data/annual-observations.csv. Each row stores the observation year, source publication date, product/method key, comparison window, unit, baseline, geography and uncertainty. Add a new year only after its primary source is available and verified.

The scheduled GitHub Actions workflow opens an annual review issue each 15 April at 08:23 UTC, targeting the previous complete calendar year against the year before it. The issue is a research checklist, not an automated data claim. Publication windows differ by agency, so unreleased values must remain pending.

After source review:

1. Add or revise the source-register row.
2. Add the annual value to annual-observations.csv and, where appropriate, indicator-snapshot.csv.
3. Keep method_key, comparison_window, unit, baseline and geography explicit.
4. Use absolute change for temperature anomalies; use percentage points for percent departures; only calculate relative percentages for meaningful series.
5. Run build_dashboard.py and validate.py.
6. Submit the changes for review. GitHub Actions checks them and regenerates the dashboard and single-page annual panel after the verified data update reaches master.

Do not compare unlike products or treat a change in data coverage as a physical Earth-system change.
