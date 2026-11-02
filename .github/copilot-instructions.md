# GitHub Copilot instructions

## Repository purpose

This repository contains the Sentinel Command application and separate public research collections. Research documentation is not a live operational feed. Read the relevant README and research index before answering questions.

## Research behavior

- Use repository files as context, not as proof that a claim is currently true.
- Cite exact repository paths and original source URLs for substantive claims.
- Preserve observation date, publication date, retrieval date, timezone, product/version, units, baseline, geographic coverage and uncertainty.
- Separate direct observations, source claims, assessments, estimates, forecasts, analytical inferences, hypotheses and unresolved questions.
- Cross-check primary sources and independent corroboration where available. Reposted versions of one report are not independent confirmation.
- Do not average products with incompatible methods, definitions, baselines or time windows.
- Never invent missing values, source links, citations, coordinates or test results.
- Do not describe raw satellite scenes, AIS, waveforms or other archives as independently processed unless the processing is documented.
- Treat forum and social-media samples as limited samples, not representative measurements of a population.
- For changing facts, require fresh dated sources. Clearly label stale snapshots.

## Public-release and privacy rules

- Never publish user-authored messages, private chat transcripts, personal or health information, account identifiers, passwords, tokens, API keys, cookies, private URLs, local machine paths, private network settings or private database records.
- Review geospatial outputs for public-interest and safety before publication. Generalize or omit operationally precise details that could materially facilitate targeting of sensitive infrastructure.
- Keep source provenance and uncertainty notes with every public report.
- Use English for repository research documentation unless the user explicitly requests another language.

## Change-control rules

- Do not modify application source, database schemas, APIs, authentication, secrets or deployment settings for a research-only task.
- For documentation or data changes, use a separate branch and propose a pull request.
- Do not merge or deploy unless the user explicitly requests it.
- Run the repository's relevant validation workflow and report exactly what passed or failed.
- Do not claim a change is public or merged until GitHub confirms it.

## Research entry points

- [Public Research Archive](../PUBLIC-RESEARCH-ARCHIVE.md)
- [AI Research Guide](../AI-RESEARCH-GUIDE.md)
- [Global Earth System Review](../earth-system-global-review/README.md)
- [Public OSINT Satellite Toolkit](../public-osint-satellite-toolkit/README.md)


## Visual and annual-report rules

- Keep the single-page Global Earth System report as the primary reading experience. Use consistent heading levels, clear whitespace, concise metric cards, collapsible long CSV sections and accessible text alternatives for SVGs.
- Treat dashboard gauge ranges as display aids, never as risk thresholds unless an authoritative threshold source is explicitly cited.
- Use annual-observations.csv for year-over-year work. Compare only adjacent years with matching unit, baseline, geographic scope, method_key and comparison_window.
- Do not calculate percentage change for temperature anomalies or precipitation departures. Use absolute change or percentage-point change.
- Prefer source-reported percentage changes when published values are rounded; explain any difference between displayed-value arithmetic and the source-reported rate.
- Keep WMO/NSIDC/NIPR and other incompatible products separate. Never force a false average.
- Before publishing a new annual value, check the original data product and publication date, update its source-register entry, and run build_dashboard.py plus validate.py.
- GitHub Actions may regenerate the image and comparison table after a data update. The scheduled yearly issue is a reminder for source review, not permission to invent or infer missing data.
