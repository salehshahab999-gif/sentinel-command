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
