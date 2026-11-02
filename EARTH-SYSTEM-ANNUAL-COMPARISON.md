# 🌍 Annual Earth-System Comparison

**Generated:** 2026-11-02  
**Annual data years currently stored:** 2024–2026  
**Rule:** compare adjacent years only when unit, baseline, geographic scope, method and observation window match.

> [!IMPORTANT]
> This is a source-backed year-to-year comparison, not a forecast and not a live sensor feed. A one-year change does not replace a multi-decadal trend. Missing or incompatible values remain un-compared.

## 📊 Comparable year-over-year results

| Indicator | Earlier year | Latest year | Absolute change | Relative change | Evidence |
|---|---:|---:|---:|---:|---|
| Global annual mean surface methane concentration | 2024: 1942 ppb | 2025: 1948 ppb | +6 ppb | +0.31% (calculated from displayed values) | [WMO-GHG-22](https://wmo.int/resources/publication-series/greenhouse-gas-bulletin/no-22) |
| Global annual mean surface CO2 concentration | 2024: 423.9 ppm | 2025: 426.8 ppm | +2.9 ppm | +0.68% (calculated from displayed values) | [WMO-GHG-22](https://wmo.int/resources/publication-series/greenhouse-gas-bulletin/no-22) |
| Global fossil CO2 emissions including cement carbonation | 2024: 37.8 GtCO2 | 2025: 38.1 GtCO2 | +0.3 GtCO2 | +1% (source-reported) | [GCP-2025](https://essd.copernicus.org/articles/18/3211/2026/) |
| Global mean near-surface temperature anomaly | 2024: 1.55 degC | 2025: 1.43 degC | −0.12 degC | Not meaningful for this metric | [WMO-STATE-2025](https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025) |
| Global annual mean surface nitrous oxide concentration | 2024: 338.0 ppb | 2025: 339.1 ppb | +1.1 ppb | +0.33% (calculated from displayed values) | [WMO-GHG-22](https://wmo.int/resources/publication-series/greenhouse-gas-bulletin/no-22) |

## 🧭 Interpretation notes

- **Global temperature:** compare annual anomalies against the same 1850–1900 reference. The 2024-to-2025 change is annual variability; it is not evidence that the multi-decadal warming trend reversed.
- **Greenhouse gases:** concentrations are atmospheric stock measurements, not annual emissions. Their year-to-year change is shown separately from emissions.
- **Fossil CO₂:** the Global Carbon Budget's published 2025 growth estimate is shown as source-reported. Displayed values are rounded, so recomputing a percentage from 37.8 and 38.1 GtCO₂ would not reproduce the source's reported +1.0%.
- **Regional anomalies:** country-specific normals remain separate from the global 1850–1900 series.
- **Sea ice:** NASA/NSIDC and NIPR products are separate methods. They are never averaged or substituted for one another.
- **Percentage change:** used only where it is meaningful and permitted by the metric record. Temperature anomalies and precipitation departures use absolute changes instead.

## ⏳ Series awaiting the next comparable year

| Series | Latest stored year | Latest value | Why no year-to-year result is shown | Source |
|---|---:|---:|---|---|
| Antarctic sea-ice annual maximum extent | 2026 | 17.71 million km2 | No adjacent year with matching method/window yet | [NIPR-ANTARCTIC-2026](https://asic.nipr.ac.jp/e/info/2026-09-28-01/) |
| Antarctic sea-ice annual maximum extent | 2026 | 17.59 million km2 | No adjacent year with matching method/window yet | [NASA-NSIDC-ANTARCTIC-2026](https://science.nasa.gov/earth/earth-observatory/antarctic-sea-ice-grows-to-its-2026-maximum/) |
| Arctic sea-ice annual minimum extent | 2026 | 4.60 million km2 | No adjacent year with matching method/window yet | [NASA-NSIDC-ARCTIC-2026](https://nsidc.org/news-analyses/news-stories/arctic-sea-ice-has-reached-minimum-extent-2026-antarctic-sea-ice-maximum-most-likely-reached-well) |
| Brazil mean annual temperature anomaly | 2025 | 0.33 degC | No adjacent year with matching method/window yet | [INMET-BRAZIL](https://portal.inmet.gov.br/noticias/ano-de-2025-foi-o-s%C3%A9timo-mais-quente-no-brasil-desde-1961) |
| Global seafloor mapped to modern standards | 2026 | 28.7 percent | No adjacent year with matching method/window yet | [GEBCO-2026](https://www.gebco.net/) |
| Full-depth global ocean heat-content annual change | 2025 | 24 ZJ | No adjacent year with matching method/window yet | [OHC-2025-REVIEW](https://www.nature.com/articles/s43017-026-00775-1) |
| India mean annual temperature anomaly | 2025 | 0.28 degC | No adjacent year with matching method/window yet | [IMD-INDIA-2025](https://mausam.imd.gov.in/Forecast/marquee_data/Statement_climate_of_india_2025.pdf) |
| Mountain glacier mass change | 2025 | -408 Gt | No adjacent year with matching method/window yet | [WGMS-GLACIER-2025](https://wgms.ch/ncc_glaciers_in_2025/) |
| Global mean sea-level indicator | 2026 | 115.8 mm | No adjacent year with matching method/window yet | [NASA-SEA-LEVEL-2026](https://science.nasa.gov/earth/explore/earth-indicators/sea-leve/) |
| Türkiye annual precipitation anomaly | 2025 | -27.6 percent | No adjacent year with matching method/window yet | [MGM-TURKIYE-2025](https://www.mgm.gov.tr/eng/Yearly-Climate/State_of_the_Climate_in_Turkey_in_2025.pdf) |
| Türkiye annual mean temperature anomaly | 2025 | 1.2 degC | No adjacent year with matching method/window yet | [MGM-TURKIYE-2025](https://www.mgm.gov.tr/eng/Yearly-Climate/State_of_the_Climate_in_Turkey_in_2025.pdf) |

## 🔁 Annual update cycle

GitHub Actions opens an annual review issue on 15 April (08:23 UTC) to request the previous complete calendar year's authoritative datasets. Maintainers or AI-assisted researchers must verify each primary source, add the new year to the annual-observations.csv file, and update the indicator/source registers. The dashboard and this comparison are then rebuilt automatically.

The scheduled issue is a review trigger, not an automatic claim that the newest year's scientific reports have all been released. Publication windows differ by institution.

## 🧾 Data and method

- Machine-readable values: [annual-observations.csv](earth-system-global-review/data/annual-observations.csv)
- Current indicator snapshot: [indicator-snapshot.csv](earth-system-global-review/data/indicator-snapshot.csv)
- Source registry: [source-register.csv](earth-system-global-review/data/source-register.csv)
- Reproducible builder: [build_dashboard.py](earth-system-global-review/scripts/build_dashboard.py)
- Workflow: [Earth System annual review](.github/workflows/earth-system-annual-review.yml)

Generated from repository data only. No web scraping, missing-value interpolation or unverified number insertion is performed by this script.
