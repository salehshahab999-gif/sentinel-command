# 🚢 Sentinel Naval Incident Scenario Coverage Matrix

## Purpose

This document connects the public naval-incident scenario to the actual Sentinel modules and test surfaces in this repository.

The scenario is a post-event analytical reconstruction around a reported missile impact on a U.S. naval vessel.

The goal is to test evidence handling, sensor/data continuity, source conflicts, uncertainty, and system resilience.

It is not a weapon-guidance, target-selection, firing-solution, or attack-optimization system.

---

## 1. Current Scenario Context

Public reporting dated September 28, 2026 states that USS Theodore Roosevelt (CVN-71) departed San Diego on September 27, 2026, with an expected extended Middle East deployment context.

Source:
https://news.usni.org/2026/09/28/uss-theodore-roosevelt-deploys-from-san-diego-uss-abraham-lincoln-near-hawaii

The scenario model treats this only as public contextual evidence.

It does not infer a live position, route, ETA to a specific location, or operational movement from this article alone.

---

## 2. Scenario Evidence Domains

| Domain | Scenario question | Sentinel coverage | Current implementation |
|---|---|---|---|
| 🚢 Carrier / naval context | Can the system represent a vessel, its public context, and track continuity? | Maritime provider layer + source provenance | core/maritime/ |
| 🚀 Missile-event evidence | Can reports of a missile event be represented, time-aligned, challenged, and audited without inventing a weapon identity? | Risk, crisis, evidence conflict, audit, resilience | tools/architecture_99_suite.py + core resilience/audit |
| 🛩️ UAV / drone evidence | Can aircraft/UAV observations be represented, filtered, historically queried, and treated as uncertain evidence? | Aircraft identity, speed, altitude, filters, history | core/air/ + scripts/test-aircraft-target-engine.mjs |
| 📡 Electronic-interference indicators | Can GNSS loss, communications gaps, sensor dropouts, spoofing/jamming claims and contradictory reports be represented as evidence conditions? | Security, incomplete-data, degraded-state, conflict and audit tests | core/security/ + core/resilience/ + tools/architecture_99_suite.py |
| 📻 Radar / sensor continuity | Can missing tracks, delayed tracks and conflicting observations be represented? | Incomplete-data, degradation, source fusion, checkpoint and rejection logic | core/position/ + core/resilience/ |
| ✈️ Aircraft / ADS-B | Can aircraft speed, altitude, track, identity and history be filtered and normalized? | Direct unit tests already exist | core/air/aircraft-target-engine.ts |
| 📡 AIS / maritime movement | Can vessel position, course, speed and source availability be represented? | Maritime contracts, provider registry and runtime | core/maritime/ |
| 🛰️ SAR / optical satellite | Can satellite-style geospatial processing be validated and provenance recorded? | Synthetic SAR/optical smoke tests + public-source gate | tools/satellite_osint_smoke_test.py |
| 📍 Precision position | Can multiple observations be fused only when they refer to the same target and valid time/frame? | Common-frame fusion, rejected observations, residuals, quality | core/position/precision-position-engine.ts |
| 🔥 Aftermath / thermal evidence | Can a thermal or imagery change be represented as supporting evidence rather than automatic proof? | Satellite source layer + evidence limitations | core/satellite/ + tools/satellite_osint_smoke_test.py |
| 📰 OSINT / public provenance | Can source availability, fallback behavior and evidence provenance be recorded? | Direct URL checks, evidence snippets, hashes, fallback handling | tools/architecture_99_suite.py |
| 🌦️ Environment | Can environmental change or incomplete context be represented without pretending to have perfect conditions? | Adaptation, uncertainty and incomplete-data tests | tools/architecture_99_suite.py |

---

## 3. Missile Evidence: What Is Tested

The test suite does not need to know a weapon's guidance parameters to test the analytical problem.

The relevant evidence questions are:

1. Was a missile event reported?
2. What timestamp is attached to each report?
3. Do independent sources agree on the event window?
4. Is the reported object classified consistently?
5. Are there contradictory reports?
6. Is physical aftermath evidence available?
7. Are imagery observations consistent with the reported time?
8. Is the confidence level explicit?
9. Can unsupported weapon identity claims be quarantined?
10. Can the final report distinguish observation from inference?

### Important limitation

The material recovered for this branch does not provide a verified list of exact missile models used in the scenario.

Therefore, the repository deliberately does not invent a missile model.

It tests the more general and reproducible concept of:

missile-event evidence → timestamp → cross-source consistency → aftermath evidence → confidence → audit

---

## 4. UAV / Drone Evidence

The aircraft layer already provides real code for:

- ICAO identification
- registration
- callsign
- type code
- altitude
- ground speed
- heading / track
- provider
- state
- source timestamp
- historical position queries
- optional military filtering

The current engine normalizes knots into km/h and km/s.

It also supports filtering by identity, aircraft type, altitude, speed, state, source, squawk, and military flag.

This gives the scenario a structured place for UAV/air-track evidence without assuming that every unknown aircraft is a drone.

Source:
https://github.com/salehshahab999-gif/sentinel-command/blob/test/architecture-99-suite/core/air/aircraft-target-engine.ts

Test:
https://github.com/salehshahab999-gif/sentinel-command/blob/test/architecture-99-suite/scripts/test-aircraft-target-engine.mjs

---

## 5. Electronic-Warfare / Interference Evidence

The public analysis layer treats electronic warfare as an evidence condition, not as a recipe for conducting electronic attack.

Examples of admissible analytical indicators:

- GNSS position degradation
- communication gaps
- abrupt sensor dropouts
- inconsistent timing
- reported spoofing
- reported jamming
- sudden track discontinuity
- disagreement between independent sensors

The architecture can then test:

observation → degradation state → contradiction → audit → recovery

It does not calculate how to jam, how to evade a jammer, or how to optimize electronic attack.

---

## 6. Sensor and Position Fusion

The precision-position engine supports multiple observation classes:

- GNSS
- satellite
- maritime
- astronomy
- other sources

It also represents:

- reference frames
- timestamps
- ECEF position
- velocity
- observation accuracy
- residuals
- rejected observations
- source count
- quality level
- uncertainty estimates

A critical integrity rule in the code is that observations belonging to different physical targets must not be fused into a single position solution.

Source:
https://github.com/salehshahab999-gif/sentinel-command/blob/test/architecture-99-suite/core/position/precision-position-engine.ts

---

## 7. Satellite / SAR / Optical Evidence

The satellite smoke test already validates:

- WGS84 geodesic calculations
- GeoJSON geometry
- synthetic Sentinel-1-style SAR GeoTIFF processing
- SAR coordinate reference handling
- synthetic Sentinel-2-style optical bands
- NDVI calculation
- AIS-like schema validation

The test deliberately uses synthetic imagery rather than live military imagery.

Source:
https://github.com/salehshahab999-gif/sentinel-command/blob/test/architecture-99-suite/tools/satellite_osint_smoke_test.py

Workflow:
https://github.com/salehshahab999-gif/sentinel-command/blob/test/architecture-99-suite/.github/workflows/satellite-ship-osint-ci.yml

---

## 8. Maritime / AIS Evidence

The maritime layer has provider boundaries for Open Waters / aiscast, AISStream, AIS-catcher, VesselFinder, TankerTrackers, Global Fishing Watch, OpenSky, and Flightradar24.

The maritime runtime is intentionally powered off by default.

This is important for reproducibility and for preventing the public test suite from silently turning into a live collection system.

Source:
https://github.com/salehshahab999-gif/sentinel-command/blob/test/architecture-99-suite/core/maritime/maritime-providers.ts

Runtime:
https://github.com/salehshahab999-gif/sentinel-command/blob/test/architecture-99-suite/core/maritime/maritime-runtime.ts

---

## 9. The 99-Test Integration Map

| Test block | Primary scenario domains |
|---|---|
| 4–10 | Carrier context, aircraft/UAV evidence, risk, sensor integrity |
| 11–20 | Missile-event claims, UAV observations, EW indicators, AIS gaps, misinformation |
| 21–30 | Severe misinformation, sensor loss, EW-style degradation, resource stress |
| 31–40 | Track continuity, position fusion, memory, recovery, cross-layer consistency |
| 41–45 | Security, hostile-input handling, communications/security integrity |
| 46–60 | Evidence fusion, decision quality, source conflict, transparency, audit |
| 61–70 | Human review, cumulative error, source convergence, uncertainty and resources |
| 71–85 | Cross-domain architecture stability across air, sea, satellite and environmental context |
| 86–90 | Finding defects, validating corrections, preventing regression |
| 91–99 | Final integrated validation across all evidence domains |

---

## 10. What the Suite Does Not Claim

A PASS result does not prove:

- that a missile was actually launched;
- that a specific missile hit a specific vessel;
- that a specific drone participated;
- that electronic interference caused a specific sensor failure;
- who caused an incident;
- an exact impact coordinate;
- or a live military track.

Those are separate factual questions requiring independent primary evidence.

---

## 11. Evidence Hierarchy

```text
Primary source
     ↓
Independent corroboration
     ↓
Timestamp consistency
     ↓
Geospatial consistency
     ↓
Sensor / AIS / aircraft consistency
     ↓
Conflict detection
     ↓
Confidence assessment
     ↓
After-action conclusion
```

A single social-media claim is therefore not treated the same way as an official record or a directly observed satellite product.

---

## 12. Public Sources

### U.S. Navy
https://www.navy.mil/resources/fact-files/

### Naval Vessel Register
https://www.navsea.navy.mil/Resources/Naval-Vessel-Register/

### NOAA Nationwide AIS
https://www.fisheries.noaa.gov/inport/item/80362

### NOAA AIS Vessel Tracks
https://www.fisheries.noaa.gov/inport/item/79504

### ESA / Copernicus Sentinel-1
https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1/Tracking_maritime_traffic

### NASA FIRMS
https://earthdata.nasa.gov/firms

### Current Theodore Roosevelt deployment context
https://news.usni.org/2026/09/28/uss-theodore-roosevelt-deploys-from-san-diego-uss-abraham-lincoln-near-hawaii

---

## 13. Bottom Line

The naval scenario is now represented as a multi-domain analytical problem, not merely as a generic architecture stress test:

carrier → missile-event claim → UAV/air tracks → EW/interference indicators → radar/sensor continuity → AIS → satellite/SAR/optical → precision position → aftermath → OSINT → contradiction handling → audit → final assessment

The system still keeps live military targeting outside scope.

That boundary is intentional.
