# OSINT Geolocation - Further Uncertainty Reduction Guide

This guide documents a general research method for reducing geographic uncertainty in a public OSINT investigation.

## Recommended sequence

1. Preserve the original media file, not a screenshot or repost.
2. Verify capture time independently from publication time.
3. Extract multiple frames from video and compare stable visual features.
4. Preserve EXIF and file metadata when available.
5. Retrieve raw satellite observations together with acquisition timestamps.
6. Compare more than one satellite observation or sensor before treating a thermal signal as persistent.
7. Use time-matched surface weather and atmospheric reanalysis at several heights.
8. Measure the visible plume axis from multiple frames rather than estimating it from one image.
9. Recalculate solar position and shadow geometry whenever the claimed timestamp changes.
10. Match stable public geographic features such as roads, terrain and skyline geometry.
11. Deduplicate reposts so repeated copies do not count as independent evidence.
12. Preserve contradictory evidence instead of deleting it.
13. Label every item as OBSERVED FACT, SOURCE CLAIM, ANALYTICAL INFERENCE, or UNRESOLVED.
14. Reduce the uncertainty interval only when genuinely independent evidence layers converge on the same conclusion.

## Evidence order

Original media
-> authenticated time
-> satellite acquisition time
-> satellite observation
-> atmospheric context
-> solar/shadow consistency
-> public geographic matching
-> independent corroboration

## Stopping rule

Do not reduce the uncertainty merely because several accounts repeat the same claim.

A defensible reduction should have:
- at least two genuinely independent evidence layers;
- traceable provenance;
- compatible timestamps;
- no unresolved contradiction that would materially change the location.

## Reproducibility

Every new result should preserve:
- source;
- URL;
- acquisition/publication time;
- data type;
- observation;
- interpretation;
- uncertainty;
- independence status.

This guide is intended to reduce duplicated research effort and make future OSINT work reproducible.
