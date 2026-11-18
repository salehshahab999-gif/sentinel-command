# The Elements: An Advanced Scientific and Research Reference

A standalone, English-language scientific reference covering all 118 chemical elements.

## Scope
Atomic and electronic structure; nuclear properties and isotopes; spectroscopy; physical and thermodynamic properties; chemical behavior; materials science; applications; toxicology and safety.

## Editorial policy
- Cite authoritative sources for every quantitative property.
- Distinguish measured, evaluated, calculated, estimated, and unknown values.
- Record units, conditions, uncertainty, source version, and access date.
- Never infer missing values or silently reconcile conflicting datasets.
- Keep this project independent of the Sentinel Command application.

## Build
The GitHub Actions workflow **Build Chemical Elements PDF** compiles the Markdown source files into a PDF and uploads it as a downloadable workflow artifact.

The first build is a development preview. It is not the completed 118-element encyclopedia.

## Structure
- \`elements/\`: element monographs, one file per element.
- \`editorial/\`: scientific and citation standards.
- \`scripts/build_pdf.py\`: PDF compiler.
- \`.github/workflows/chemical-elements-pdf.yml\`: automated build.

## Planned coverage
118 elements, atomic numbers 1–118. The scope and depth of each monograph will reflect the available evidence; predicted properties of superheavy elements will be explicitly labeled.
