# Changelog

All important changes to this public research collection are recorded here.

## 2026-11-03 - Initial public global baseline

- Added an integrated global Earth-system assessment covering climate, atmosphere, cryosphere, ocean heat, sea level, ozone, solid-Earth structure, tectonic motion, volcanism, submarine volcanism, earthquakes, bathymetry and paleoscience.
- Added cross-country source reconciliation for WMO, NOAA, NASA, NSIDC, NIPR/Japan, EUMETSAT/OSI SAF, JMA, IMD/India, Türkiye MGM, Copernicus/ECMWF, WGMS, IEA, Global Carbon Budget, EDGAR and additional national agencies/data portals.
- Added documented raw-data access routes for NASA Earthdata, Copernicus Data Space, NSIDC, ICESat-2, CryoSat-2, EUMETSAT, NOAA JPSS and Argo.
- Added selected national volcano-monitoring updates from Iceland, New Zealand, Chile, Italy, Russia and the United States.
- Added a 33-indicator snapshot and a 67-record source register, with CSV schema documentation.
- Added methods, uncertainty, glossary, roadmap and contribution documentation.
- Added automated documentation/data validation through GitHub Actions.
- Added GitHub issue and pull-request templates for future updates and corrections.

## Update policy

New releases must add a dated entry with changed indicators, source versions and unresolved conflicts. Do not erase past values without preserving the revision history and reason for correction.


## 2026-11-03 - Visual dashboard and annual comparison system

- Added a visual dashboard with temperature and measurement gauges, percent coverage bars, polar sea-ice cards, glacier and ocean indicators, and a spatial-reference panel.
- Added a 2024–2025 comparable annual baseline for WMO global temperature, CO₂, methane, nitrous oxide and Global Carbon Budget fossil CO₂.
- Expanded the indicator snapshot to 38 records and the source register to 69 records, adding the WMO 2024 global climate report and Greenhouse Gas Bulletin No. 21.
- Added annual-observations.csv with explicit method keys, comparison windows, baselines, units, source links and uncertainty fields.
- Added deterministic Python dashboard and annual-table generation using the standard library only.
- Added GitHub Actions to rebuild generated outputs after verified data changes and to open a yearly data-review issue on 15 April.
- Improved the single-page report with visual cards, expanded heading hierarchy, emoji navigation, collapsible data tables and coordinate/CRS guidance.

The annual workflow creates a review task; it does not automatically assert that all annual scientific reports have been released or scrape unverified values.
