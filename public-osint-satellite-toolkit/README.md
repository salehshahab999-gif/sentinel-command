# Public OSINT & Satellite Research Toolkit

A public, reproducible starter kit for researchers, OSINT analysts, developers, journalists, and teams working with satellite and geospatial data.

## What this toolkit does

It provides generic building blocks for:

- ingesting public NASA FIRMS-style fire detections;
- normalizing latitude/longitude data;
- calculating distances and bearings;
- calculating solar azimuth/elevation;
- recording wind observations;
- building a source/evidence ledger;
- comparing independent evidence layers;
- exporting reproducible CSV/JSON results;
- running automated unit tests with GitHub Actions.

The toolkit is deliberately **generic**. It does not contain a target-specific geolocation workflow or coordinates for an active strategic facility.

## Intended users

### OSINT researchers
Use the templates to preserve source provenance, distinguish observations from claims, and avoid counting reposts as independent evidence.

### Programmers
Use the Python modules as a starting point for building dashboards, data pipelines, APIs, notebooks, or geospatial analysis systems.

### Satellite-data users
Public or authorized private/government satellite data can be imported through the same normalized schemas. The toolkit does not provide or attempt to obtain restricted satellite access.

## Evidence model

Every observation should be classified as:

- OBSERVED_FACT
- SOURCE_CLAIM
- ANALYTICAL_INFERENCE
- UNRESOLVED
- REJECTED

Every record should preserve:

- source;
- URL;
- acquisition/publication time;
- sensor/data type;
- coordinates;
- uncertainty;
- independence status;
- notes.

## Recommended workflow

Source discovery
-> provenance check
-> data normalization
-> time synchronization
-> satellite/imagery layer
-> weather layer
-> solar/shadow layer
-> geographic comparison
-> independent corroboration
-> uncertainty assessment
-> publication

## Key rule

Do not shrink geographic uncertainty merely because several sources repeat the same claim.

Require genuinely independent evidence layers with traceable provenance.

## Public satellite sources

NASA FIRMS:
https://firms.modaps.eosdis.nasa.gov/

Copernicus Data Space:
https://dataspace.copernicus.eu/

ESA Earth Observation:
https://www.esa.int/Applications/Observing_the_Earth

NOAA:
https://www.noaa.gov/

## File layout

- `src/osint_satellite_toolkit.py` - reusable Python utilities
- `examples/evidence.csv` - evidence schema example
- `tests/test_toolkit.py` - automated tests
- `.github/workflows/osint-toolkit-ci.yml` - CI workflow
- `LICENSE` - MIT license

## Safety and responsible publication

This repository is intended for public research, verification, disaster/environmental monitoring, journalism, science, and authorized analysis.

Do not publish sensitive operational coordinates or restricted-data content merely because a calculation produced a precise number.

For active sensitive infrastructure, prefer generalized public references and preserve the precise result only in an appropriately authorized environment.
