# Riyadh Fire - Full OSINT Research Record
## 3 October 2026

> **Research record:** This document consolidates the complete investigation performed in the conversation, including the geographic narrowing, satellite and weather layers, solar/shadow analysis, social-media and local-source assessment, source-quality rules, uncertainty handling, and the 99-test analytical validation suite.
>
> **Status:** Analytical OSINT record. Not an official incident investigation.

---

# 1. What this investigation tried to solve

The investigation began with a real-time observation of smoke/fire reported over Riyadh and a social-media/Telegram clue associated with an Aramco facility.

The initial question was simple:

**Where is the smoke/fire actually coming from?**

The investigation then expanded into a multi-layer geolocation problem:

- identify the broad event area;
- identify the likely source facility;
- obtain candidate geographic coordinates;
- compare multiple coordinate references;
- examine the smoke-plume axis;
- determine likely smoke movement;
- obtain wind/weather constraints;
- calculate solar position for the claimed video time;
- use shadows and illumination to constrain camera orientation;
- compare satellite thermal observations;
- compare Sentinel/Copernicus context imagery;
- cross-check Arabic, Saudi, Persian, European and international reporting;
- distinguish original evidence from reposts;
- use the Sentinel Command repository as a reproducible research record;
- progressively reduce the area of uncertainty.

The investigation should not be read as proving an exact impact or ignition point.

---

# 2. Investigation timeline and narrowing

## Stage 1 - Broad Riyadh hypothesis

The first working hypothesis was simply that the incident occurred somewhere in Riyadh.

At that stage the possible area was many kilometres wide.

## Stage 2 - Southern Riyadh

Ground reports and photographs repeatedly associated the smoke/fire with the southern side of Riyadh and the Aramco refinery/industrial area.

This was the first major reduction.

## Stage 3 - Refinery-area coordinate comparison

Two public map references for the refinery area were compared.

The separation between the two references was approximately **0.8 km**.

An important correction was made during the investigation:

**The 0.8 km difference between two map references is not itself an uncertainty radius.**

The points are reference coordinates for the same general facility area.

## Stage 4 - Smoke-plume analysis

Public descriptions and satellite imagery descriptions indicated that the smoke moved broadly toward the north / north-northwest over Riyadh.

The plume was treated as a directional constraint rather than a direct locator.

## Stage 5 - Weather and wind

Weather sources were checked.

The detailed wind vector did not converge perfectly between all public sources and models.

Some observations/models indicated a southerly component; other sources showed an easterly component.

Therefore wind was retained as a constraint but not treated as an exact one-line reverse trajectory.

## Stage 6 - Solar geometry

A working social-media timestamp around **10:47:17 local Riyadh time** was investigated.

Approximate solar geometry:

- Solar azimuth: **~154°**
- Solar elevation: **~58°**
- Opposite shadow direction: **~334°**

This was used as a consistency test for camera orientation and the direction of visible shadows.

## Stage 7 - Satellite thermal evidence

NASA FIRMS / VIIRS was used as a thermal/fire-observation layer.

The nominal VIIRS I-band product scale is approximately **375 m**.

The critical interpretation rule was:

**FIRMS is an observation cell, not a guaranteed exact ignition/impact coordinate.**

A secondary report published on 3 October stated that higher-intensity VIIRS thermal activity was visible across the Riyadh refinery area.

## Stage 8 - Multi-source convergence

The investigation then combined:

- ground imagery;
- local reporting;
- Arabic reporting;
- Persian reporting;
- European reporting;
- Reuters material;
- FIRMS/VIIRS;
- Sentinel/Copernicus context;
- solar geometry;
- smoke direction;
- wind constraints;
- infrastructure geography.

The analytical model converged from an initial broad area, through a refinery-area hypothesis, toward a **sub-kilometre working convergence**.

During the investigation a working estimate of roughly **0.5 km** was discussed as the remaining analytical scale.

That ~0.5 km figure is **not independently confirmed** and is retained here as a description of the analytical convergence, not as an official or verified impact radius.

Because the event concerns strategic energy infrastructure, the public record does not publish an operationally precise incident coordinate.

---

# 3. Public geographic reference

The public reference point is intentionally generalized.

## Decimal coordinates

**24.6000 N, 46.8000 E**

## Degrees / minutes / seconds

**24°36'00" N, 46°48'00" E**

## Broad elevation reference

**~600 m above sea level**

This is a broad Riyadh geographic reference, not a measured elevation for the incident point.

## Google Maps

https://www.google.com/maps?q=24.6000,46.8000

## Distance reference

Using the commonly used Riyadh city-centre reference:

**24.7136 N, 46.6753 E**

the generalized research point is approximately:

**~18 km straight-line distance**

This is a map-reference distance only.

## Public uncertainty

The generalized public point intentionally carries an uncertainty of:

**at least 10 km**

It is a starting point for researchers, not an exact event coordinate.

---

# 4. Geographic coordinate forms retained for reproducibility

Three coordinate representations are preserved:

### 1. Decimal
24.6000 N, 46.8000 E

### 2. DMS
24°36'00" N, 46°48'00" E

### 3. Elevation
~600 m broad Riyadh reference elevation

This prevents the common problem where a researcher has to convert formats before beginning the next stage of analysis.

---

# 5. Satellite evidence

## NASA FIRMS / VIIRS

NASA FIRMS provides near-real-time active-fire observations from MODIS and VIIRS.

The VIIRS I-band active-fire product has a nominal ground-sampling scale of about **375 m**.

Important limitations:

- satellite overpass timing;
- pixel geometry;
- viewing angle;
- geolocation uncertainty;
- fire size;
- atmospheric effects;
- smoke/cloud effects;
- temporal mismatch between fire onset and satellite acquisition.

Therefore:

**FIRMS should be used as a thermal/fire observation layer, not as a meter-level impact coordinate.**

FIRMS:
https://firms.modaps.eosdis.nasa.gov/

FIRMS documentation:
https://wiki.earthdata.nasa.gov/spaces/FIRMS/pages/32079892/Fire%2BInformation%2Bfor%2BResource%2BManagement%2BSystem%2BFIRMS

VIIRS product documentation:
https://modaps.eosdis.nasa.gov/services/about/products/viirs-land-c2-nrt/vnp14imgtdl_nrt.html

## Sentinel-2 / Copernicus

Sentinel-2 was treated as a geographic and infrastructure comparison layer.

Useful for:

- roads;
- buildings;
- industrial layouts;
- terrain;
- land-use context;
- before/after change comparison.

Less suitable for:

- exact minute-level fire timing;
- direct real-time incident positioning.

ESA Riyadh example:
https://www.esa.int/ESA_Multimedia/Images/2024/10/Earth_from_Space_Riyadh_Saudi_Arabia

---

# 6. Solar and shadow analysis

Working timestamp:

**10:47:17 Riyadh local time**

Approximate solar geometry used:

- Azimuth: **~154°**
- Elevation: **~58°**
- Opposite shadow direction: **~334°**

Analytical chain:

**time -> Sun position -> shadow direction -> camera orientation**

This does not independently prove the fire location.

It can, however:

- reject an impossible camera heading;
- test a claimed time;
- distinguish alternative viewing directions;
- strengthen or weaken a geolocation hypothesis.

A later researcher should recalculate the Sun position if the original media timestamp changes.

---

# 7. Smoke-plume analysis

The visible smoke was described as moving broadly:

**North to North-Northwest**

Important distinction:

**Smoke direction != exact source wind direction**

The plume can be influenced by:

- wind at multiple altitudes;
- thermal buoyancy;
- plume rise;
- local turbulence;
- urban/industrial heat;
- terrain;
- wind shear.

Therefore the correct analytical method is not simply:

"Draw one line backward from the end of the smoke."

The correct method is:

**plume axis + time + atmospheric layer + source-area candidates + satellite observation + visual geometry**

---

# 8. Weather and wind

The weather layer showed incomplete agreement between public data sources.

A Weather Channel local forecast for the Riyadh/Duruma area showed a **SSE** wind component around the relevant daytime period, while other datasets/observations produced different components.

Saudi local reporting also recorded wind and dust conditions in the wider Riyadh region around the same date.

Saudi local source:
https://www.alriyadh.com/news.local

Weather Channel:
https://weather.com/sa/riyadh/city/duruma/hourbyhour

Saudi local weather warning archive:
https://www.alriyadh.com/

Interpretation:

- wind direction is supporting evidence;
- a single forecast should not determine location;
- higher-resolution time-matched atmospheric data would be preferable;
- vertical wind profile is more useful than surface wind alone.

Recommended future datasets:

- ECMWF/IFS;
- NOAA GFS;
- ERA5/reanalysis;
- surface observations;
- radiosonde profiles when available.

---

# 9. Local Saudi evidence

Saudi local reporting was included specifically so the analysis would not depend only on US/international reporting.

The Al Riyadh newspaper archive showed contemporaneous security and weather reporting on 2-3 October 2026.

https://www.alriyadh.com/news.local

The public Saudi material reviewed during this investigation did not provide an official exact fire coordinate.

This is an important negative result and should remain in the record rather than being omitted.

---

# 10. Arabic regional evidence

The New Arab reported the Riyadh smoke/fire event and explicitly noted that there was no immediate Saudi official confirmation or immediate Aramco comment at the time of its report.

https://www.newarab.com/news/oil-tankers-attacked-hormuz-smoke-seen-near-aramco-riyadh

Türkiye Today reported social-media video, satellite fire-detection information and the broad refinery-area location, while also describing the cause as unverified.

https://www.turkiyetoday.com/region/smoke-reported-over-riyadh-after-alleged-houthi-strike-on-aramco-refinery-3229510

These are useful corroboration layers but should not be treated as independent from every other source because they may reproduce the same underlying imagery.

---

# 11. European and international reporting

Reuters reported:

- a large smoke/fire plume;
- a witness seeing the event near an Aramco facility in Riyadh;
- no immediate Saudi official confirmation;
- no immediate Aramco comment;
- no immediate claim of responsibility.

Reuters:
https://www.reuters.com/business/energy/fire-smoke-seen-near-aramco-facility-riyadh-witness-says-2026-10-03/

Reuters Connect:
https://www.reutersconnect.com/

European reporting was used primarily as a corroboration layer, not as the sole source.

---

# 12. Persian / Iranian-source search

Persian-language searches were performed for the same date and incident.

The accessible Iranian search results did not produce a strong independent primary-source geolocation dataset for this specific event.

That negative finding is recorded deliberately.

Older Persian reports about historic Aramco incidents were rejected because they were not evidence about the 3 October 2026 event.

Example of rejected historical material:
https://www.mehrnews.com/news/4839534/

Reason for rejection:

**wrong event date / historical incident**

---

# 13. Social-media and Telegram methodology

The investigation focused on the original-media problem.

The Telegram/Arabic social-media clue was important because it pointed toward an image showing:

- smoke/fire;
- an Aramco reference;
- a visible white vehicle;
- a ground-level camera perspective.

However, an indexed Telegram copy was not sufficient to establish original metadata.

For future work, researchers should obtain the earliest/original file whenever possible.

For each image:

1. original URL;
2. original uploader;
3. first-seen timestamp;
4. claimed capture time;
5. EXIF;
6. image hash;
7. reverse-image comparison;
8. visible vehicle position;
9. shadows;
10. skyline;
11. smoke axis;
12. roads/buildings;
13. satellite comparison.

---

# 14. Source-independence rule

The investigation repeatedly encountered the same image being republished by multiple sites.

Therefore:

**10 websites carrying one photograph = 1 visual observation, not 10 independent confirmations.**

Source independence was treated as more important than raw source count.

Evidence was classified as:

- **Observed fact**
- **Source claim**
- **Analytical inference**
- **Unresolved question**

---

# 15. The coordinate-reduction logic

The reduction process can be summarized as:

**Riyadh**
-> **Southern Riyadh**
-> **Aramco/refinery vicinity**
-> **thermal-observation overlap**
-> **smoke-axis constraint**
-> **solar/shadow constraint**
-> **wind/weather constraint**
-> **infrastructure comparison**
-> **sub-kilometre analytical convergence**

The earlier **~16 km** separation encountered in the analysis was corrected and was not retained as an uncertainty radius.

The later **~0.8 km** separation between two refinery-area reference coordinates was treated correctly as a difference between geographic reference points, not as an error radius.

The final analytical discussion reached roughly **0.5 km scale** as a working convergence, but the precise coordinate behind that working model is not published in this public record.

---

# 16. The 99-test validation suite

## Test 1-3

The original names of Tests 1-3 are not reproduced in the current preserved conversation excerpt. They belong to the earlier baseline stage of the project's validation work and should be recovered from the original test notes before being represented as named tests.

The full named series supplied in the preserved investigation begins with Test 4.

## Test 4 - Predictive Intelligence
Check whether the system can anticipate likely evidence paths without confusing prediction with observation.

## Test 5 - High-Level Self-Awareness
Check whether the analysis can identify its own uncertainty and distinguish reasoning from evidence.

## Test 6 - Risk Assessment
Check whether the investigation recognizes operational, evidentiary and analytical risks.

## Test 7 - Security Resilience
Check whether the evidence chain remains useful under adversarial conditions and source disruption.

## Test 8 - Governance Complexity
Check whether conflicting evidence can be managed without collapsing source hierarchy.

## Test 9 - Adaptation
Check whether the analytical process can incorporate new satellite, weather or social data.

## Test 10 - Core Integrity
Check consistency among the major analytical components.

## Test 11 - Geopolitical Crisis
Check whether geopolitical context is prevented from automatically becoming proof of causation.

## Test 12 - Information Flood / False Information
Check resistance to large quantities of duplicated, false or misleading reports.

## Test 13 - Data Collapse
Check analytical behavior when major evidence sources disappear.

## Test 14 - Incomplete Information
Check whether conclusions remain explicitly uncertain when data are missing.

## Test 15 - Rapid Growth and Scalability
Check whether the method remains usable as source volume expands.

## Test 16 - Core Conflict Resolution
Check whether contradictory source layers can be reconciled without arbitrary selection.

## Test 17 - Partial System Failure
Check whether the investigation remains functional after losing one evidence layer.

## Test 18 - Adaptation to Rule Changes
Check whether methodology remains valid when source policies or data formats change.

## Test 19 - Severe Complexity Scenario
Stress-test multi-layer interactions.

## Test 20 - Environmental Change
Check whether changing weather, smoke and satellite conditions are incorporated.

## Test 21 - Memory Collapse (Dark)
Test whether evidence hierarchy survives loss of prior contextual information.

## Test 22 - Governance Conflict Storm (Dark)
Stress conflicting source priorities and incompatible analytical instructions.

## Test 23 - False-Data Flood (Dark)
Stress the system with coordinated misinformation and duplicated false evidence.

## Test 24 - Infinite Complexity Growth (Dark)
Check whether scope expansion can be controlled.

## Test 25 - Resource Scarcity (Dark)
Check whether useful conclusions can survive limited source access.

## Test 26 - Prediction Failure Chain (Dark)
Check whether one incorrect assumption propagates through the whole model.

## Test 27 - Security Breach (Dark)
Check whether compromised evidence can be isolated from trusted evidence.

## Test 28 - Self-Awareness Failure (Dark)
Check whether unjustified confidence can be detected.

## Test 29 - Uncontrolled Evolution (Dark)
Check whether the methodology remains bounded during repeated adaptation.

## Test 30 - Total Governance Collapse (Dark)
Check whether the analytical framework can recover from complete conflict among its layers.

## Test 31 - Final Failure Point
Identify the point where evidence is no longer sufficient for a defensible conclusion.

## Test 32 - Architecture Survival
Measure whether the analytical structure remains useful under stress.

## Test 33 - Inter-Layer Dependency
Identify hidden dependencies between weather, satellite and visual evidence.

## Test 34 - Coordination Stability
Check whether independent evidence layers remain synchronized.

## Test 35 - Memory Uniformity
Check whether equivalent evidence is represented consistently.

## Test 36 - Knowledge Integrity
Check whether known facts remain distinguishable from inferred facts.

## Test 37 - Learning Stability
Check whether new observations improve rather than destabilize the assessment.

## Test 38 - Decision Adaptation
Check whether decisions change appropriately when evidence changes.

## Test 39 - Reversibility
Check whether unsupported conclusions can be rolled back.

## Test 40 - Long-Term Evolution Stability
Check whether methodology remains stable as the evidence archive grows.

## Test 41 - Cyber Defence
Check resistance to manipulated digital evidence.

## Test 42 - Attack Resistance
Check whether adversarial narratives can force an unsupported conclusion.

## Test 43 - Evolutionary Safety
Check whether future adaptation remains evidence-bounded.

## Test 44 - Complexity Management
Check ability to control many simultaneous evidence streams.

## Test 45 - Anti-Collapse Architecture
Check whether the system avoids single-point analytical failure.

## Test 46 - Decision Quality Index
Measure consistency, evidence quality and uncertainty.

## Test 47 - Analytical Error Review
Review known analytical mistakes.

Important correction captured by this case:
**the 16 km separation was not an uncertainty radius.**

## Test 48 - Data-Bias Review
Check whether source availability biases the result toward US/international sources.

Important observation:
the investigation deliberately added Saudi, Arabic, Persian and European sources.

## Test 49 - Transparency Audit
Ensure the distinction between observation and inference remains visible.

## Test 50 - Compliance Monitoring
Check that sources, uncertainty and publication rules are respected.

## Test 51 - Long-Term Convergence Review
Check whether independent clues converge on the same broad area over time.

## Test 52 - Cross-Core Coordination Stability
Check whether separate analytical cores remain consistent.

## Test 53 - Evolutionary Safety Under Change
Check resilience when new evidence invalidates an old assumption.

## Test 54 - Central Complexity Management
Check whether core evidence remains manageable.

## Test 55 - Anti-Collapse Architecture Validation
Check whether uncertainty remains explicit.

## Test 56 - Decision Quality Monitoring
Check whether higher source volume actually improves quality.

## Test 57 - Human Feedback Inspection
Check whether user-provided clues are incorporated without becoming unverified facts.

## Test 58 - Convergence Stability
Check whether the same broad conclusion survives source replacement.

## Test 59 - Long-Term Resilience
Check whether the model remains usable after repeated revisions.

## Test 60 - Environmental Adaptation Mechanism
Check response to changing wind, smoke and weather.

## Test 61 - Ethical Alignment
Check whether useful analytical detail is separated from unnecessarily operational information.

## Test 62 - Automated-Robustness Review
Check whether automated reasoning remains explainable.

## Test 63 - Decision Resistance
Check whether external narrative pressure can distort conclusions.

## Test 64 - Distributed Processing Coordination
Check whether independent source streams converge correctly.

## Test 65 - Cumulative Error Analysis
Check whether small errors compound.

## Test 66 - Information-Convergence Review
Check whether independent evidence increases confidence appropriately.

## Test 67 - Upgrade-Path Audit
Check whether improved tools can be added without invalidating prior records.

## Test 68 - Resource Balance
Check whether source quantity is balanced against source quality.

## Test 69 - Decision Fairness
Check whether all source categories are evaluated consistently.

## Test 70 - Final Control Review
Check the final publication gate.

## Test 71 - Ecosystem Compatibility
Check whether the methodology can operate across different source environments.

## Test 72 - Layer Persistence
Check whether evidence layers remain reproducible.

## Test 73 - Decision Compatibility Audit
Check whether decisions remain consistent with evidence.

## Test 74 - Cross-Core Information Coordination
Check whether information survives transfer between analytical modules.

## Test 75 - Final Convergence Validation
Check whether the strongest evidence agrees after conflicts are resolved.

## Test 76 - Adaptive Stability
Check whether adaptation improves stability.

## Test 77 - System Integrity
Check total evidence-chain integrity.

## Test 78 - Ethical Compliance Review
Check that research publication remains responsible.

## Test 79 - Global Robustness Audit
Stress the entire framework.

## Test 80 - Long-Term Readiness
Check whether a later researcher can continue from the saved record.

## Test 81 - Cultural Compatibility
Check whether Arabic, Saudi, Persian, European and international sources can coexist without source-culture bias.

## Test 82 - Human Resource Balance
Check whether human interpretation is preserved where automation cannot verify source context.

## Test 83 - Strategic Alignment
Check whether the investigation remains focused on the original geolocation question.

## Test 84 - Environmental Compatibility Review
Check weather and atmospheric adaptation.

## Test 85 - Architecture Maturity Audit
Assess the maturity of the complete investigation framework.

## Test 86 - Issue Extraction and Prioritization
Identify unresolved errors and rank them.

## Test 87 - Correction Validation
Check whether corrections actually remove earlier analytical errors.

## Test 88 - Post-Correction Stability
Check whether the corrected model remains internally consistent.

## Test 89 - Regression Prevention
Check whether earlier mistakes reappear.

## Test 90 - Whole-Architecture Quality
Check overall analytical quality.

## Test 91 - Final Coordination Between Cores
Check all analytical cores together.

## Test 92 - Final Coordination Between Layers
Check all evidence layers together.

## Test 93 - Maximum Load Resilience
Check whether large numbers of sources can be processed without destroying the evidence hierarchy.

## Test 94 - Unknown-Scenario Stability
Check performance where the correct answer is not known in advance.

## Test 95 - Cross-Domain Generalization
Check whether the same method works beyond this single incident.

## Test 96 - Quality Preservation During Evolution
Check whether new tools preserve evidence quality.

## Test 97 - Final-Version Readiness
Check whether the research record can be handed to another researcher.

## Test 98 - Comprehensive Architecture Audit
Full audit of evidence, uncertainty, source hierarchy and reproducibility.

## Test 99 - Final Comprehensive Validation
Final review of the complete analytical chain.

### Overall 99-test conclusion

The suite identifies the strongest remaining uncertainties as:

1. exact incident coordinate;
2. exact minute-level wind field;
3. original-media provenance for some social posts;
4. independent authentication of the video timestamp;
5. cause/attribution of the fire.

The suite does **not** convert an analytical estimate into an official coordinate.

---

# 17. Major analytical corrections made during the investigation

## Correction 1 - 16 km

The early ~16 km separation between two candidate points was incorrectly tempting as a "large radius".

Correct interpretation:

**It was a separation between reference points, not a confidence radius.**

## Correction 2 - 0.8 km

The later candidate coordinates were about **0.8 km apart**.

Correct interpretation:

**They represented the same general refinery-area geography, not an 0.8 km uncertainty circle.**

## Correction 3 - FIRMS precision

A VIIRS/FIRMS cell is not an exact impact coordinate.

## Correction 4 - Weather

The plume cannot be reverse-traced to a single point without time-matched atmospheric data.

## Correction 5 - Source independence

Multiple reposting websites do not equal multiple independent observations.

## Correction 6 - Solar geometry

Sun/shadow geometry is a consistency constraint, not a standalone geolocation proof.

## Correction 7 - Cause vs location

A confirmed fire location does not automatically confirm a missile, drone, sabotage or any other cause.

---

# 18. What the evidence supports

### High confidence

- A significant smoke/fire event occurred in Riyadh on 3 October 2026.
- The broad event area is southern Riyadh.
- Public reporting links the event to the Aramco/refinery vicinity.
- Satellite thermal activity was reported in the broader facility area.

### Moderate confidence

- Smoke moved broadly northward / north-northwestward.
- The claimed daytime imagery is compatible with the calculated solar geometry.
- Multiple source categories converge on the same broad industrial area.

### Low-to-moderate confidence

- Exact wind vector at the source.
- Exact ignition/impact point.
- Exact camera position.
- Cause and attribution without independent official confirmation.

---

# 19. Public research location

### General public reference

**24.6000 N, 46.8000 E**

DMS:

**24°36'00" N, 46°48'00" E**

Elevation reference:

**~600 m**

Google Maps:

https://www.google.com/maps?q=24.6000,46.8000

Straight-line reference from Riyadh city centre:

**~18 km**

Public uncertainty:

**at least 10 km**

The more precise internal analytical convergence discussed during the investigation is not published as an operational coordinate.

---

# 20. Source directory

## Saudi / Arabic

Al Riyadh:
https://www.alriyadh.com/news.local

New Arab:
https://www.newarab.com/news/oil-tankers-attacked-hormuz-smoke-seen-near-aramco-riyadh

Türkiye Today:
https://www.turkiyetoday.com/region/smoke-reported-over-riyadh-after-alleged-houthi-strike-on-aramco-refinery-3229510

Saudipedia:
https://saudipedia.com/en/riyadh-city

## International / European

Reuters:
https://www.reuters.com/business/energy/fire-smoke-seen-near-aramco-facility-riyadh-witness-says-2026-10-03/

Reuters Connect:
https://www.reutersconnect.com/

Euronews:
https://www.euronews.com/2026/09/19/flames-and-smoke-spotted-at-riyadhs-king-khalid-airport-after-overnight-air-raid-alert

## Satellite / space

NASA FIRMS:
https://firms.modaps.eosdis.nasa.gov/

NASA FIRMS documentation:
https://wiki.earthdata.nasa.gov/spaces/FIRMS/pages/32079892/Fire%2BInformation%2Bfor%2BResource%2BManagement%2BSystem%2BFIRMS

NASA VIIRS product:
https://modaps.eosdis.nasa.gov/services/about/products/viirs-land-c2-nrt/vnp14imgtdl_nrt.html

ESA:
https://www.esa.int/ESA_Multimedia/Images/2024/10/Earth_from_Space_Riyadh_Saudi_Arabia

## Weather

Weather Channel - Duruma/Riyadh:
https://weather.com/sa/riyadh/city/duruma/hourbyhour

---

# 21. Recommended continuation workflow

A researcher continuing from this record should not restart at "Riyadh".

Start from:

**southern Riyadh -> refinery-area hypothesis -> time-matched thermal data -> original ground imagery -> solar/shadow test -> atmospheric data -> infrastructure matching**

Priority order:

1. Obtain original Telegram/media file.
2. Authenticate timestamp.
3. Extract video frames.
4. Calculate Sun and shadow geometry.
5. Obtain time-matched FIRMS detections.
6. Obtain Copernicus/Sentinel context imagery.
7. Retrieve time-matched ECMWF/NOAA wind fields.
8. Compare roads/buildings/industrial geometry.
9. Separate original observations from reposts.
10. Record every contradiction.

---

# 22. Final assessment

The investigation successfully transformed the problem from an initially broad **~16 km-scale confusion** into a much tighter refinery-area analytical hypothesis and ultimately a **sub-kilometre working convergence**.

The key lesson is that no single source solved the problem.

The convergence came from:

**local/social imagery + source provenance + satellite thermal data + smoke direction + solar geometry + weather + geographic reference points + independent cross-checking.**

The working sub-kilometre convergence should remain labeled as an **analytical estimate** until independently verified.

The public repository version intentionally preserves the methodology, sources and generalized map reference while not exposing an operationally precise incident coordinate.

---

# 23. Reproducibility statement

This record is intended so that another researcher can reproduce the investigation without repeating the entire initial search.

Every future addition should include:

- source;
- URL;
- timestamp;
- data type;
- observation;
- interpretation;
- uncertainty;
- whether the source is independent or a repost.

Use these labels consistently:

**OBSERVED FACT**

**SOURCE CLAIM**

**ANALYTICAL INFERENCE**

**UNRESOLVED**

**REJECTED / WRONG EVENT**

That distinction is part of the result, not merely formatting.
