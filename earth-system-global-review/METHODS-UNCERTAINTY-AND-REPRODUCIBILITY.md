# Methods, Uncertainty and Reproducibility
## Rules for preserving scientific traceability

## 1. Evidence hierarchy

Use the following order when a claim can be checked:

1. Original calibrated observations and official data products.
2. National monitoring-agency bulletins and international observing networks.
3. Peer-reviewed research with methods and uncertainty available.
4. Reviewed assessments such as WMO, IPCC, WGMS and national state-of-climate reports.
5. Technical documentation and agency explanations.
6. Specialist forums and community observations.
7. General media reporting and social-media posts.

This is a source-quality hierarchy, not a rule that a national source is always correct or that a peer-reviewed paper is automatically error-free. Contradictory evidence must be preserved.

## 2. Evidence labels

Every data row and analytical paragraph should be assigned one of these labels:

| Label | Meaning | Example |
|---|---|---|
| OBSERVATION | Direct measurement or sensor-derived product | Satellite sea-ice extent |
| ASSESSMENT | Reviewed synthesis of multiple datasets | WMO State of Global Climate |
| ESTIMATE | Derived quantity with model or accounting method | Glacier mass balance |
| FORECAST | Probabilistic statement about a future period | Seasonal temperature outlook |
| INTERPRETATION | Explanation based on independent evidence | Attribution of regional pattern |
| HYPOTHESIS | Plausible but unconfirmed explanation | Possible source of discoloured water |
| UNRESOLVED | Incomplete or contradictory evidence | Different sea-ice products return different extents |

## 3. Required metadata

Every new indicator should include:
- stable indicator ID;
- name and short definition;
- value and unit;
- start and end dates;
- retrieval date in UTC;
- geographic domain;
- baseline or reference period;
- observing platform or method;
- institution and product version;
- uncertainty or confidence interval;
- status (observed, assessed, estimated, forecast);
- direct source URL;
- caveats and known incompatibilities.

For time-sensitive events, save both local time and UTC. Do not silently convert the source's date to another timezone.

## 4. Baselines and comparability

A temperature anomaly is meaningless without its baseline. A 2025 national anomaly relative to 1991–2020 cannot be compared directly with a global anomaly relative to 1850–1900.

Likewise:
- sea-ice extent is not sea-ice area, thickness or volume;
- annual sea-ice minimum is not winter maximum;
- land-ice mass balance is not sea-ice extent;
- CO₂ atmospheric concentration is not annual CO₂ emissions;
- total greenhouse gases in CO₂-equivalent are not fossil CO₂ alone;
- ocean heat content anomaly is not total ocean heat;
- relative sea level at a coast is not identical to global mean sea level;
- earthquake event count is not seismic moment release;
- volcanic unrest is not an eruption;
- a thermal satellite pixel is not proof of a specific ground event.

## 5. Reconciliation of independent products

When two sources differ:
1. record both values without averaging;
2. inspect product definitions;
3. compare observation time and averaging window;
4. compare sensor and retrieval algorithm;
5. compare spatial grid and coverage;
6. compare threshold and quality-control rules;
7. check uncertainty estimates;
8. explain whether the discrepancy changes the interpretation.

A product's rank should only be quoted using that product's own record.

## 6. Uncertainty and confidence

Use confidence labels consistently:
- **Very high:** several independent observing systems agree and the result is physically well understood.
- **High:** strong evidence, with some known limitations.
- **Medium:** evidence is useful but product or coverage differences matter.
- **Low:** indirect evidence, weak corroboration or substantial missing data.
- **Unresolved:** insufficient or conflicting evidence.

Do not invent a percentage confidence score unless a model has explicitly calculated a calibrated probability. Expert judgement labels are not statistical probabilities.

## 7. Satellite data rules

### Optical sensors
Sentinel-2, Landsat, MODIS and VIIRS can observe surface colour, vegetation, snow, ash and thermal context. Cloud, polar night, viewing geometry and revisit intervals constrain observation.

### Radar
Sentinel-1 SAR can observe surface structure and ground deformation in many cloud conditions and at night. A single radar scene does not directly measure underground magma or the composition of the core.

### Gravity missions
GRACE and GRACE-FO estimate changes in mass distribution over large spatial scales. The product is not a high-resolution photograph of ice or groundwater.

### Magnetic missions
ESA Swarm measures the magnetic field and helps separate field sources. It does not directly image molten metal inside the core.

### Ocean-altimetry missions
Radar altimeters estimate sea-surface height. Tide gauges and GNSS are necessary for local relative sea-level interpretation.

### Bathymetric sonar
Ship-based multibeam sonar measures the seabed directly along survey tracks. Repeated surveys require careful inter-survey calibration.

## 8. Seismic and volcanic data rules

- Preserve original event IDs.
- Keep rapid and reviewed catalogs separate.
- Record magnitude type, depth and agency.
- Do not count aftershocks as independent mainshocks without explaining the method.
- Use the national observatory's own alert definitions.
- Treat volcanic gas, thermal, deformation and seismic signals as distinct channels.
- For submarine events, record water depth and whether evidence is satellite, acoustic, sonar, ROV or chemical.

## 9. Forum and social-media rules

Public discussion can identify an observation or a possible contradiction. It is not a substitute for a calibrated data product.

When using forum or citizen evidence:
- preserve original post URL and capture time;
- distinguish original author from reposts;
- record number of genuinely independent reports;
- note language and geographic bias;
- retain conflicting reports;
- avoid turning anecdotal reports into population-level percentages;
- do not infer scientific consensus from comment volume.

## 10. Reproducible update workflow

1. Choose the indicator and exact question.
2. Retrieve the primary dataset and documentation.
3. Save the retrieval time and product version.
4. Check the dataset's unit, baseline and temporal window.
5. Compare one independent source where available.
6. Update the source register and indicator CSV.
7. Write the interpretation separately from the measurement.
8. Add known limitations and unresolved conflicts.
9. Run the project validation script.
10. Submit a pull request with source links and a short change summary.

## 11. Rejected analytical shortcuts

The following shortcuts are not accepted:
- averaging incompatible satellite products;
- comparing temperature anomalies with different baselines as if they were identical;
- inferring global seismic acceleration from a short cluster;
- inferring an imminent eruption from a single hot pixel;
- treating all continental motion as divergence;
- attributing current atmospheric warming to geomagnetic variation without a demonstrated energy-budget mechanism;
- using a dramatic single-year anomaly as proof of a long-term trend;
- counting repeated posts as independent reports.

## 12. Public transparency

A public research record should make it possible for another researcher to reproduce the chain from source to conclusion. Corrections should be traceable, the old value should not disappear without explanation, and material changes should be recorded in the changelog.
