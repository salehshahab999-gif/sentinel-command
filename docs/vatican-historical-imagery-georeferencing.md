# Vatican/Rome historical imagery: download and georeference workflow

This workflow is intentionally conservative: a catalogue lead is not an image footprint, and an unreferenced historical image must never be displayed as a precisely aligned map layer.

## Current research registry

See `data/vatican/global-imagery-georeferencing-registry.json`. It includes official archives and community leads across Italy, Europe, the United States, Asia, satellite archives, and moving-image collections.

## Binary-download limitation in the current execution

The connected GitHub interface can commit text files, but the current runtime could not resolve external hosts for binary downloads. No TIFF or video is represented as downloaded, and no image is represented as georeferenced. This note is here to prevent an accidental false claim.

## Acquisition procedure

For every candidate:
1. Open the original archive record and record its exact item identifier.
2. Download the original full-resolution file if access and reuse terms allow it. A preview/thumbnail is not the original.
3. Keep the untouched file under a local archive folder, for example `data/vatican/raw/<source-id>/`.
4. Record SHA-256, byte size, MIME type, dimensions, source URL, creator, archive item ID, claimed capture date, catalogue date, scan date, access date, license, and any restrictions.
5. Do not put large binary imagery in Git history unless repository policy and file-size limits permit it. Prefer Git LFS or external object storage with a checksum manifest.

## Ground-control-point file

Create one JSON per image with this shape. Coordinates must be measured from visible, stable features, not guessed:

```json
{
  "image": "data/vatican/raw/eth-1928-0190/source.tif",
  "targetCrs": "EPSG:4326",
  "imageGeometry": "oblique-aerial",
  "gcps": [
    {
      "pixel": 1200,
      "line": 850,
      "longitude": 12.4539,
      "latitude": 41.9022,
      "feature": "example only: identify the exact visible feature before use",
      "confidence": "unverified"
    }
  ]
}
```

The example coordinate and point are illustrative only and MUST NOT be used as a real GCP. Replace it with measured coordinates and a precise landmark description.

## Georeferencing rules

- Vertical aerial photographs: use camera/flight parameters and elevation data where available; orthorectify rather than merely stretching the image.
- Oblique aerial photographs: perspective and terrain/building relief can make a single 2D transform inaccurate. Use several well-distributed control points and check against independent points. For rigorous results, use photogrammetry or 3D scene constraints.
- Video frames: record source URL, timecode, frame number and SHA-256; confirm the frame actually shows the target location and whether it is aerial or ground-level. A film's release year is not automatically the shot's capture year.
- Satellite frames: retain product ID, acquisition timestamp, sensor, processing level, pixel size, CRS, cloud metadata and provider terms.
- Keep the original immutable. Export a separate GeoTIFF, footprint GeoJSON, GCP file, processing log and validation report.
- Report GCP count, independent checkpoint count, transformation, CRS, resampling method and residual/RMS error. If no valid residual can be computed, say so.
- Never infer tunnels, underground rooms or hidden structures from surface imagery alone.

## Local command pattern (GDAL)

The repository includes `scripts/vatican_georef_from_gcps.py`. It requires GDAL's Python bindings to be installed in the local environment. Run it only after downloading an original image and preparing a GCP JSON with verified coordinates. The script does not discover control points or certify accuracy on its own.

## First acquisition priorities

1. **ICCD / Aerofototeca Nazionale**: inspect its WebGIS for exact Vatican/Rome frames from 1942 onward; older Nistri and historic collections may require catalogue consultation.
2. **IGMI**: inspect the 8 September 1936 Roma catalogue item and determine whether the footprint covers Vatican City. The item is a paid catalogue entry, not assumed to be free.
3. **ETH-Bibliothek**: obtain original 1928 scans for the identified St Peter's/Vatican views; verify image metadata and reuse terms.
4. **US National Archives**: search Rome/Vatican coordinates in foreign aerial-photo indexes and record the exact series/frame IDs.
5. **Istituto Luce / Internet Archive**: inspect digitized moving images at frame-level, logging exact timecodes. Only extract and publish frames consistent with rights and license terms.

## Status vocabulary

- `catalogue-lead`: collection or record found, target coverage not verified.
- `candidate-frame`: original item appears relevant; footprint/date still being checked.
- `downloaded-original`: original bytes acquired and checksum recorded.
- `georeferenced-pending-validation`: transform created but independent checks not passed.
- `georeferenced-validated`: alignment reviewed and error metrics recorded.
- `rejected`: wrong location, wrong media type, insufficient metadata, or unusable rights.


## Expanded acquisition and mapping workflow (research update: 2026-10-24)

### A. Acquire originals, not thumbnails
- For Wikimedia Commons TIFFs, use `scripts/download_vatican_commons_originals.py`. It asks the official MediaWiki API for the canonical original URL, expected byte size, MIME type, licence label, and Commons SHA-1; it downloads to a temporary `.part` file, checks byte count, calculates local SHA-256, and writes `download-manifest.json`. It does not bypass access controls and does not overwrite an existing file.
- Target candidates currently listed by the script: ETH-BIB-MH02-04-0190, MH02-04-0191, and MH02-07-0403 through 0405. Before treating any file as Vatican coverage, visually inspect the image and catalogue record.
- ETH Library states that digitized E-Pics items can be downloaded as high-resolution JPG/TIFF, with per-image rights terms. Where a scan is not published, the reading room or a paid digitization request may be needed. Official collection guidance: https://library.ethz.ch/en/collections-and-archives/archiving/image-archive.html
- ETH's Smapshot crowdsourcing platform supports georeferencing selected historical photographs. It is a valuable comparison/reference route, not proof that every target frame has already been georeferenced: https://smapshot.heig-vd.ch/
- For Istituto Luce, distinguish the catalogue record from the full-resolution master. If no original-download control is offered, request the high-resolution scan through the archive; do not scrape around authentication or access controls.

### B. Find the correct frame before mapping
- IGMI reports an aerial archive of over 300,000 frames from 1927–2010. Images from 1935 onward can be searched online; pre-1936 material requires a support request. Their photogrammetric TIFF option is specifically intended for stereoscopy/3D reconstruction and requires at least two contiguous frames from the same flight strip. Official guide: https://igmi.esercito.difesa.it/en/product-description/aerial-photos/
- The IGMI Roma catalogue item LN00007484 is dated 1936-09-08 but described as a general panorama and an unnumbered frame; its Vatican footprint is not yet confirmed. Do not label it a Vatican frame until the preview/scan proves coverage.
- For each candidate record, preserve: institution, stable catalogue ID, capture date (not upload date), camera/view direction if known, flight/strip/frame ID, original pixel dimensions, scan resolution, licence/reuse terms, original URL, checksum, and footprint confidence.

### C. Georeference responsibly
1. Use a modern reference basemap with stable features that also existed at the capture date. Good candidates include the Tiber bends/bridges, historic street intersections, large basilica outlines, and durable wall corners. Avoid temporary objects, tree crowns, shadows, and building roofs when the old photo is oblique.
2. Add at least 6–10 well-distributed GCPs for an initial experiment, more if the frame and geometry support them. Reserve several independent checkpoints that are not used to fit the transform.
3. Start with a first- or second-order polynomial in QGIS Georeferencer; compare residuals and inspect edge drift. A low training residual alone is not proof of accuracy. For steep oblique imagery, terrain relief and camera perspective can cause parallax, so a flat 2D warp cannot produce a survey-grade orthophoto.
4. Record CRS explicitly (prefer a suitable projected CRS for local metric error analysis), transformation type, resampling method, GCP coordinates, residuals, independent checkpoint error, and known limitations. Keep original imagery immutable.
5. Only attempt 3D reconstruction when overlapping images from the same flight/strip or reliable camera/terrain metadata exist. A single oblique photograph generally cannot determine a unique, accurate 3D model by itself.

### D. Official and developer references
- QGIS Georeferencer manual: https://docs.qgis.org/latest/en/docs/user_manual/managing_data_source/georeferencer.html
- Practical historical-aerial-image workflow and QA lessons: https://medium.com/vcgi/georeferencing-vermonts-historic-aerial-imagery-2e52c0301b85
- Historical-image georeferencing research code (requires adaptation; not Vatican-specific): https://github.com/fdahle/hist_georef
- OpenDroneMap GCP/orthophoto issue history illustrates why coordinate order, CRS, and GCP configuration must be checked: https://github.com/OpenDroneMap/ODM/issues/213

### Current execution truth
The downloader script has been committed, but no claim is made here that the script has run on the user's Windows machine or that image bytes are already present in the repository. The next verifiable state is the local manifest plus actual file sizes and SHA-256 hashes. Do not create GCPs from guessed points or publish a georeferenced raster until independent checks have passed.
