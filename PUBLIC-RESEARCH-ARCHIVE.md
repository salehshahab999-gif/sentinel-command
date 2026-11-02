# Public Research Archive and Output Inventory

**Repository:** [Sentinel Command](https://github.com/salehshahab999-gif/sentinel-command)  
**Archive type:** Curated index of public research outputs  
**Last inventory review:** 3 November 2026

## Purpose and scope

This page is the public entry point for research reports, analytical assessments, data tables and reusable research methods authored for this repository.

It is an index of research artifacts, **not an export of private conversations**. User messages, chat transcripts, personal details, health information, private device/network settings, credentials, local file paths and unrelated personal material are not part of this archive.

The inventory distinguishes material already published from research topics that appeared in earlier work but still require source-level reconstruction before they can be released as complete reports. A topic appearing in the backlog does not mean that a complete report or verified dataset for it is already present.

## Published research outputs

### 1. Global Earth System Review

**Status:** Published in the repository's `master` branch  
**Snapshot:** 3 November 2026  
**Coverage:** Climate, atmosphere, greenhouse gases, cryosphere, sea level, oceans, solid Earth, tectonics, volcanoes, seismology, bathymetry and paleoscience.

Start here:

- [Global Earth System Review index](earth-system-global-review/README.md)
- [Integrated executive assessment](earth-system-global-review/EXECUTIVE-ASSESSMENT.md)
- [Climate, cryosphere and atmosphere](earth-system-global-review/CLIMATE-CRYOSPHERE-ATMOSPHERE.md)
- [Solid Earth, interior and plate tectonics](earth-system-global-review/SOLID-EARTH-INTERIOR-TECTONICS.md)
- [Volcanoes and submarine volcanism](earth-system-global-review/VOLCANOES-SUBMARINE-VOLCANISM.md)
- [Global seismology](earth-system-global-review/GLOBAL-SEISMOLOGY.md)
- [Ocean floor and marine observing](earth-system-global-review/OCEAN-FLOOR-AND-MARINE-OBSERVING.md)
- [Paleo-Earth and deep time](earth-system-global-review/PALEO-EARTH-AND-DEEP-TIME.md)
- [Cross-country source reconciliation](earth-system-global-review/CROSS-COUNTRY-SOURCE-RECONCILIATION.md)
- [Source and data catalog](earth-system-global-review/SOURCE-CATALOG.md)
- [Methods, uncertainty and reproducibility](earth-system-global-review/METHODS-UNCERTAINTY-AND-REPRODUCIBILITY.md)
- [Indicator snapshot CSV](earth-system-global-review/data/indicator-snapshot.csv)
- [Source register CSV](earth-system-global-review/data/source-register.csv)

The published baseline contains 33 indicator rows and 67 source-register records. It uses published agency products and assessments; it does not claim that every raw satellite, sonar or seismic archive was independently downloaded and reprocessed.

### 2. Riyadh fire/smoke OSINT case file

**Event date:** 3 October 2026  
**Status:** Published as an analytical OSINT record, not an official incident investigation.

- [Full OSINT research record](Riyadh-2026-10-03-Full-OSINT-Research-Record.md)
- [OSINT assessment](Riyadh-2026-10-03-OSINT-Assessment.md)
- [Source data notes](Riyadh-2026-10-03-Source-Data.md)
- [Generalized public location reference](Riyadh-2026-10-03-Generalized-Location.md)
- [Further uncertainty-reduction guide](OSINT-Geolocation-Further-Uncertainty-Reduction-Guide.md)

The public assessment deliberately uses a generalized geographic reference and does not publish an operationally precise incident coordinate for strategic energy infrastructure.

### 3. Suspected F-15 crash-site geolocation assessment

- [Jabal Haylan F-15 geolocation assessment](Jabal-Haylan-F15-Geolocation-Assessment.md)

This is an analytical estimate based on open-source geographic, geological, meteorological, satellite-derived and topographic clues. It is not an official crash-site confirmation. Readers must retain the document's stated uncertainty and evidence limitations.

### 4. Reusable public satellite / OSINT toolkit

- [Public OSINT and satellite research toolkit](public-osint-satellite-toolkit/README.md)

The toolkit provides generic components and examples for public fire detections, coordinate handling, distance/bearing calculations, solar geometry, wind observations, evidence ledgers, exports and automated tests. It is not a target-specific operational tool.

## Research topics identified for archive backfill

The following topics appeared in earlier research requests and discussions. They are listed here as **backfill work**, not as completed or verified publications. Each needs a fresh, dated source review and a separate report before it can be called archived.

| Research track | Intended public artifact | What must be re-verified before publication |
|---|---|---|
| Energy and financial markets | Timestamped market snapshot and historical series | Exact instrument/pair, exchange or benchmark, quote time, units, source timestamp and market status |
| Oil, fuels and energy security | Multi-benchmark energy report | WTI, Brent and Dubai/Oman definitions, contract/maturity, gasoline/diesel/jet fuel/LNG scope and source dates |
| Gulf, Hormuz and Red Sea shipping | Maritime traffic and disruption assessment | AIS provider coverage, vessel categories, observation window, baseline traffic, gaps and independent corroboration |
| Aviation and NOTAM | Dated airspace and flight-restriction record | NOTAM identifier, FIR, issue/effective/expiry times, cancellations and official issuing authority |
| Geopolitical and security research | Country- and institution-level research papers | Primary documents, local/regional sources, explicit comparison criteria and dated evidence |
| Think-tank and research-institute comparison | Reproducible institution comparison | Transparent methodology, research scope, publication record and comparable evidence; no unsupported universal ranking |
| Public forums and opinion samples | Country- and topic-specific discussion sample | Platform, language, collection window, sample size, duplicate handling, coding method and non-representativeness caveat |
| Further satellite and event OSINT cases | One case file per event | Original media, acquisition/capture times, sensor/product IDs, weather, independent source checks and uncertainty |
| Strategic infrastructure mapping | Generalized public geospatial research | Public-interest rationale and a safety review; do not publish precise operational targeting coordinates or exploitable sensitive details |

### Backfill rules

1. Rebuild from current primary sources and dated data, not from remembered summaries or stale market/news values.
2. Preserve the observation date separately from the publication date and retrieval date.
3. Separate direct observations, official statements, media claims, analytical inferences, hypotheses and unresolved questions.
4. Record exact dataset/product versions, units, baselines, geography and uncertainty.
5. Record forum samples as samples. Do not convert them into claims about an entire country's population.
6. Do not average measurements that use incompatible definitions, baselines or time windows.
7. Do not state that raw imagery, AIS, waveforms or other archives were independently processed unless the processing is documented and reproducible.
8. Publish corrections with a dated changelog entry; preserve the prior value and explain the reason for change.

## Excluded from this public archive

- User-authored chat messages and private conversation transcripts.
- Personal, medical, financial-account, device, network and location details.
- Passwords, access tokens, API keys, cookies, private configuration files and local machine paths.
- Private application data, database contents, deployment secrets and unrequested application changes.
- Unverified allegations presented as facts.
- Operationally precise coordinates or detail that would materially facilitate targeting of sensitive infrastructure.

## Completeness statement

This archive currently indexes the research artifacts that can be verified in the repository and the research tracks that can be identified from available project context. It is **not a complete historical export of every assistant response from every past conversation**. Full historical chat text is not available as one retrievable source in this workflow, so missing reports must be reconstructed from primary sources rather than invented or attributed to an unverified past answer.

For instructions on asking an AI assistant to search and explain this repository, see the [AI Research Guide](AI-RESEARCH-GUIDE.md).
