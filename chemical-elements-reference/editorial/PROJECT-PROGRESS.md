# Project Progress Snapshot

**Snapshot date:** 2026-11-21 (Asia/Tehran)  
**Scope:** `chemical-elements-reference` only. The main Sentinel Command application is outside this work item.  
**Branch:** `master`

## Verified baseline

- Individual Markdown draft files exist for all 118 elements (Z=1–118), as represented in `elements/INDEX.md`.
- A file's existence means an initial draft exists, not that its scientific content is complete.
- Elements 1–30 are marked `Phase I audit complete*` in the index. This is a limited baseline cross-check, not a full review of all ten scientific domains.
- Elements 31–118 are marked `Drafted (initial)`.
- The limited Phase I baseline covers standard atomic weight and natural isotopic composition (CIAAW), plus ground-state configuration/term and first ionization energy (NIST ASD), with source identifiers.
- The ten-domain editorial standard exists in `editorial/SCIENTIFIC-STANDARDS.md`.
- A source register exists, but it is not yet a comprehensive bibliography for all 118 elements and all claims.
- The PDF build script and GitHub Actions workflow exist. Their existence does not mean the final scientific book or final PDF is complete.
- No element is certified as fully audited or peer-reviewed in the current audit record.

## Ten required scientific domains

1. Identity, classification, discovery, and name etymology.
2. Atomic structure, electron configuration, term symbols, and quantum properties.
3. Ionization energy, electron affinity, and atomic spectroscopy.
4. Nuclear structure, isotopes, decay, and evaluated nuclear data.
5. Physical properties with measurement conditions and phase.
6. Thermodynamics and chemical reactivity.
7. Bonding, compounds, oxidation states, and coordination chemistry.
8. Materials properties, crystal structure, and applications.
9. Toxicology, radiological hazards, and safe handling.
10. Sources, data provenance, uncertainty, and limitations.

## Progress classification

- **Infrastructure completed:** the ten-domain standard, initial records for all 118 elements, source-register framework, PDF build script, and CI workflow.
- **Partially completed:** initial content exists across the element drafts; the limited Phase I baseline is recorded for elements 1–30.
- **Not completed:** comprehensive, source-backed coverage of all ten domains for all 118 elements.
- **Not yet measured:** exact completion counts for each domain across all 118 files. A full structural/content inventory is still required. Do not infer percentages from file counts or headings.
- **Deferred by user instruction:** comprehensive final audit/release review. Do not begin it before content and PDF work are complete.

## Next execution sequence

1. Continue from existing element files; do not regenerate content from scratch.
2. Build a per-element gap inventory against the ten-domain standard. This is a progress inventory, not the final scientific audit.
3. Fill verified gaps using authoritative, element-appropriate sources. Label measured, evaluated, calculated, estimated, predicted, and unknown values distinctly; preserve conditions and uncertainty.
4. Expand the source register so claims can be traced to suitable sources.
5. Integrate and normalize all 118 entries.
6. Build the final PDF and inspect content, typography, layout, equations, tables, and references.
7. Only after steps 1–6, conduct the comprehensive final audit and release review.

## Working rules

- Never claim a domain is complete for all elements without evidence from all 118 files.
- Never report a project-wide percentage until a documented inventory defines and counts completion criteria.
- Distinguish infrastructure, draft content, verified data, final audit, and publication status.
- For superheavy elements, explicitly distinguish measured facts from theoretical predictions and unknown properties.
