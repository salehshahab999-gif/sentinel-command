# Scientific Audit Log

**Project:** The Elements: An Advanced Scientific and Research Reference  
**Audit snapshot:** 18 November 2026  
**Scope:** 118 element monographs (atomic numbers 1–118)  
**Current status:** twenty monographs have passed a limited Phase I cross-check; no monograph is yet certified as fully audited or peer-reviewed.

## 1. Audit principles

1. A numerical value is not accepted solely because it appears on a general periodic-table website.
2. Every quantitative field must be traceable to a property-specific primary or critically evaluated authority.
3. The manuscript must preserve the source's reported value, units, significant figures, uncertainty, conditions, and evidence type.
4. Ranges describing natural variability must not be relabelled as measurement uncertainties.
5. Experimental, evaluated, calculated, estimated, and unknown values must be separated explicitly.
6. Conflicting values must be shown with their definitions, methods, and conditions; incompatible values are not averaged.
7. Each online source must carry a version/release identifier where available and a date of access.
8. A source homepage is not sufficient where a table, nuclide evaluation, record identifier, DOI, or primary paper is available.

## 2. Evidence hierarchy

- **CIAAW:** standard atomic weights and representative isotopic compositions. Use the current table for each data class and preserve the Commission's footnotes concerning normal-material variation.
- **NIST Atomic Spectra Database (ASD):** atomic ground-state configurations and term designations, ionization energies, uncertainties, and NIST bibliography keys. Cite the precise neutral/ionic spectrum and record keys.
- **NNDC ENSDF / NuDat and IAEA nuclear-data resources:** evaluated nuclide masses, levels, decay modes, half-lives, and decay schemes. Cite the specific nuclide evaluation or dataset date, not only the database landing page.
- **NUBASE:** cross-check nuclear and decay properties, with the exact evaluation edition identified.
- **Peer-reviewed primary literature and specialist handbooks:** phase transitions, thermodynamic functions, crystallography, material properties, spectroscopy, and reaction properties. Each value must carry its own method and experimental conditions.
- **Royal Society of Chemistry (RSC) and IUPAC:** element-specific context, nomenclature, classification, history, and secondary cross-checking. They are not substituted for primary or specialist evaluated sources when reporting research-grade numerical data.

## 3. Phase I: atomic and isotopic baseline

Phase I is intentionally narrow. It covers only:
- CIAAW 2024 standard atomic weight;
- CIAAW 2024 representative isotopic composition for normal terrestrial materials;
- NIST ASD 5.12 neutral-atom first ionization energy, including the reported uncertainty;
- NIST ASD 5.12 neutral-atom ground-state term/configuration where shown;
- exact NIST ASD bibliography key(s) for the first-ionization record.

Each audited monograph includes a source list with DOI or stable URL, data version, access date, and record identifiers. For isotope tables, CIAAW fractions are atom fractions; bracketed intervals indicate natural variability and must not be confused with uncertainty bars.

### Phase I status

| Atomic numbers | Status | Scope |
|---|---|---|
| 1–20 | Phase I audit complete* | CIAAW weight/isotope fields and NIST ASD ground-state/first-ionization fields cross-checked |
| 11–118 | Drafted; Phase I not yet audited | Source-by-source cross-check pending |

*Phase I does not certify the rest of the monograph. The discovery narrative, applications, chemistry, material properties, nuclear dossiers, toxicology, and other quantitative properties remain subject to separate review.

## 4. Verified source releases for this audit snapshot

### CIAAW
- *Standard Atomic Weights 2024*: https://ciaaw.org/atomic-weights.htm
- *Isotopic Compositions of the Elements 2024*: https://ciaaw.org/isotopic-abundances.htm
- Access date: 2026-11-18.
- The Commission's published intervals are interpreted as representative ranges for normal terrestrial materials, not as uncertainty estimates for a single specimen.

### NIST
- Kramida, A., Ralchenko, Yu., Reader, J., and NIST ASD Team. *NIST Atomic Spectra Database*, version 5.12 (2024).
- DOI: https://doi.org/10.18434/T4W30F
- Version history: https://physics.nist.gov/PhysRefData/ASD/Html/verhist.shtml
- Ionization-energy form and output: https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html
- Access date: 2026-11-18.
- NIST ASD 5.12 version-history page records the release date as 7 November 2024.
- NIST's ionization-energy help explains that uncertainty is supplied when available; a blank uncertainty must not be invented from displayed digits. The database also documents its parentheses convention for values calculated theoretically.

### Secondary element-specific cross-check
- Royal Society of Chemistry Periodic Table: https://periodic-table.rsc.org/
- Used for element overview, classification, block, common physical state, history, and applications, not as the controlling authority for CIAAW/NIST numerical values.
- Individual element page and access date are recorded in each Phase I monograph.

## 5. Remaining audit stages

**Phase II — Atomic structure and spectroscopy**
- electron configurations and exceptions;
- atomic term symbols and excited states;
- electron affinities and ionization sequences;
- atomic/ionic radii, with definitions and coordination/oxidation-state context;
- spectroscopic lines, transition probabilities, and uncertainties.

**Phase III — Nuclear dossier**
- stable and radioactive nuclides;
- atomic/nuclear masses and mass excesses;
- decay modes, branching ratios, half-lives, nuclear levels, spin/parity;
- ENSDF/NuDat and NUBASE cross-checks;
- explicit distinction between measured, evaluated, predicted, and unknown properties.

**Phase IV — Physical, thermodynamic, and materials data**
- phase, allotropy, crystal structures and space groups;
- melting/boiling/sublimation points with pressure;
- density with temperature and phase;
- heat capacity, enthalpy, entropy, thermal expansion, conductivity, elastic properties;
- sample purity, pressure, temperature, method, and uncertainty.

**Phase V — Chemistry and applications**
- oxidation states and their evidential status;
- compounds, bonding, coordination chemistry, reaction energetics;
- catalysis and materials applications;
- distinguish established industrial use from experimental or proposed applications.

**Phase VI — Toxicology and radiological safety**
- chemical form, exposure route, dose metrics, occupational limits, and agency;
- radiological activity, dose, containment, and nuclide-specific hazards;
- cite authoritative safety agencies and the applicable jurisdiction/date;
- do not generalize the hazard of an element to every compound or oxidation state.

**Phase VII — Editorial and release review**
- reference completeness and DOI/link verification;
- consistency of symbols, units, significant figures, terminology, and data labels;
- contradiction and uncertainty register;
- final PDF rendering, table/page-break review, bookmarks, and full text search;
- release notes with explicit audit coverage and known limitations.

## 6. Required record format for every quantitative property

| Field | Requirement |
|---|---|
| Property | Clearly defined quantity; avoid ambiguous labels |
| Value | Exact source value, preserving significant digits |
| Unit | SI where practical; retain source unit where conversion is needed |
| Uncertainty | Exact reported uncertainty or explicitly “not reported” |
| Conditions | Temperature, pressure, phase, allotrope, medium, sample purity |
| Evidence label | MEASURED / EVALUATED / CALCULATED / ESTIMATED / UNKNOWN |
| Method | Experimental method or computational model where available |
| Authority | Publisher, agency, database, or journal |
| Version | Edition, evaluation, dataset date, or database release |
| Locator | Table, record ID, nuclide ID, bibliography key, DOI, or page |
| Access date | YYYY-MM-DD for online sources |

## 7. Quality gate

A field may be marked audited only when:
- the exact datum is found in the cited authority;
- units and uncertainty agree;
- source version and locator are recorded;
- the value is correctly classified as measured/evaluated/calculated/estimated;
- relevant conditions and source limitations are stated;
- an independent cross-check is completed where appropriate.

A monograph may be marked fully audited only after all applicable phases are complete. Missing or unverified data must remain marked UNKNOWN or pending, never filled by inference merely to make the entry look complete.
