# Data Directory

This directory contains compact, human-readable CSV snapshots that complement the narrative reports.

## Files

### indicator-snapshot.csv

One row per measured or assessed indicator in the dated release.

| Column | Meaning |
|---|---|
| indicator_id | Stable identifier used for references and future revisions |
| domain | Earth-system domain such as climate, cryosphere, ocean or volcanology |
| indicator | Human-readable name of the variable |
| value | Numeric or categorical value as published |
| unit | Unit exactly or approximately as stated by the source; see notes |
| period | Observation period, date or averaging interval |
| reference_baseline | Reference period or product baseline |
| geographic_scope | Global, regional or national coverage |
| status | Observation, assessment or estimate |
| uncertainty_or_rank | Published uncertainty, rank or explicit caveat |
| source_id | Stable foreign key into source-register.csv |
| source_url | Direct source URL |
| notes | Important interpretation restrictions |

### source-register.csv

One row per source, institution or cited product.

| Column | Meaning |
|---|---|
| source_id | Stable source identifier |
| institution | Data producer, research institution or assessment body |
| country_or_scope | National, regional or international coverage |
| domain | Main science domain |
| product_or_report | Exact product, report or dataset name |
| observation_period_or_coverage | Time period represented by the dataset |
| publication_or_update_date | Source publication or retrieval/update date |
| source_url | Direct public source URL |
| evidence_type | Observation, assessment, estimate, archive or institutional directory |
| typical_update | Typical release cadence where known |
| notes | Limitations, language, scope or usage caveats |

## Data handling rules

- Every row must retain its source identifier and direct URL.
- Do not convert blank values to zero.
- Do not average rows from distinct satellite products simply because they measure a similar variable.
- Keep unit, date, averaging window, baseline and product name together.
- Negative mass-balance values represent mass loss where the source convention uses signed values.
- A reported estimate is not a directly measured raw value unless the source says so.
- When a source revises a value, add a dated change note and preserve the prior release in Git history.
- Do not place large raw satellite, sonar or waveform archives in this repository. Link to the original archive and record the exact version or retrieval date.

## CSV validation

Run from the repository root:

    python earth-system-global-review/scripts/validate.py

The validation checks the column schema, row identifiers, HTTPS source links, source-date formats and indicator-to-source references. It does not certify the scientific validity of a number or test whether every URL remains online.


### annual-observations.csv

A machine-readable annual time-series register used for strict year-over-year comparisons. It is separate from the indicator snapshot because the same indicator may have several year records, observation windows or source products.

Columns:

| Column | Meaning |
|---|---|
| series_id | Stable comparison-series identifier. |
| year | Observation year, not publication year. |
| indicator_name | Human-readable metric name. |
| value / unit | Published numeric value and unit. |
| reference_baseline | Baseline or reference definition. |
| geographic_scope | Global, national, polar or other stated area. |
| method_key | Stable method/product family used to decide comparability. |
| comparison_window | Calendar year, annual minimum, annual maximum, hydrological year, or named month/interval. |
| comparison_type | absolute_only or absolute_and_percent. |
| period | Original observation period as stated by the source. |
| source_id / source_url | Exact row in the source register and original publication/product link. |
| publication_date | Source publication date, distinct from observation year. |
| uncertainty | Published uncertainty, range or explicit unavailable status. |
| evidence_class | Observation, assessment or estimate. |
| reported_yoy_percent | Optional source-reported year-on-year percentage. Prefer this when source values are rounded. |
| notes | Caveats, revision history and comparability restrictions. |

**Comparison rules:** only adjacent years with identical unit, baseline, geographic scope, method key and comparison window are compared. Percent changes are generated only for series marked absolute_and_percent. Temperature anomalies and precipitation departures use absolute or percentage-point changes instead. Preliminary and consolidated emissions estimates are not silently mixed.

The initial baseline contains comparable 2024 and 2025 values for WMO global temperature, WMO greenhouse-gas concentrations and Global Carbon Budget fossil CO₂, plus single-year baselines for regional climate, sea ice, glacier mass, ocean heat, sea level and seafloor mapping.

### Generated visual outputs

- The SVG at assets/earth-system-dashboard.svg is generated from indicator-snapshot.csv.
- The root-level EARTH-SYSTEM-ANNUAL-COMPARISON.md is generated from annual-observations.csv.
- The generated annual comparison is also embedded in the single-page Global-Earth-System-Complete-Report.md between AUTO-ANNUAL markers.
- Run python earth-system-global-review/scripts/build_dashboard.py from the repository root to regenerate the visual outputs.
- Run python earth-system-global-review/scripts/validate.py to check CSV schemas, source IDs, dates, local links and dashboard integrity.
