# Vatican 3D Map Research Record

**Project:** Sentinel Command Center  
**Working branch:** `feat/pnt-multi-source-switch`  
**Status:** source inventory and matching workflow; no archival frame has yet been georeferenced.

## Scope
Build a source-linked, layered map of Vatican City that separates:
1. Present-day basemap and public landmarks.
2. Historical aerial/satellite image records.
3. The St Peter's Basilica digital twin.
4. Documented archaeological/subterranean locations.
5. Unverified claims, kept out of the factual map until independently corroborated.

## Key distinction: two different image collections
- The Vatican/Microsoft/Iconem digital twin is a detailed 3D reconstruction focused on St Peter's Basilica, not the whole Vatican City State and not the national aerial-photo archive.
  - Digital twin: https://virtual.basilicasanpietro.va/en
  - Microsoft project overview: https://unlocked.microsoft.com/vatican/
- The Italian Military Geographic Institute (IGM) archive's reported 300,000+ aerial frames refer to the broader archive, not 300,000 frames of Vatican City.
  - IGM aerial photography: https://igmi.esercito.difesa.it/descrizione-prodotti/foto-aeree/
- The National Aerofototeca's WebGIS is the first practical route for locating archived frame footprints.
  - WebGIS: https://afn.cultura.gov.it/webgis/

## Historical imagery leads
These are source records or image publications, not yet georeferenced raster overlays:
- 1921 printed aerial view; image capture date not verified: https://commons.wikimedia.org/wiki/File:Collier%27s_1921_Vol_9_Frontispiece_--_Vatican.jpg
- Aerial postcard catalog record with postmark 9 July 1955; postmark is not the capture date: https://digital.sandiego.edu/vaticancitypc/194/
- Aerial postcard catalog record with postmark 10 August 1957; postmark is not the capture date: https://digital.sandiego.edu/vaticancitypc/192/
- QuickBird image published by Corriere in 2005: https://www.corriere.it/Primo_Piano/Cronache/2005/04_Aprile/07/sat/sat2.shtml
- ESA COSMO-SkyMed radar image, published in 2015: https://www.esa.int/ESA_Multimedia/Images/2015/03/Vatican_heights_detected_by_satellite_radar
- NASA ASTER image page: https://science.nasa.gov/photojournal/vatican-city/
- Historical aerial photo portal, Rome municipality: https://geoportale.comune.roma.it/aerofototeca/

## Documented underground references
- St Peter's Basilica necropolis: https://www.basilicasanpietro.va/en/san-pietro/the-necropolis
- Via Triumphalis archaeological site: https://www.turismoroma.it/en/node/1093
- Rome underground cavity map from ISPRA: https://www.isprambiente.gov.it/en/news/map-of-underground-cavities-of-rome-2026

These references document specific archaeological/underground spaces. They do **not** establish a continuous tunnel network across Vatican City.

## Reproducible matching workflow
1. In the AFN WebGIS, navigate to Vatican City and select the aerial-photo footprint layer.
2. Export the selected frame footprints as GeoJSON if the portal offers the export for the chosen layer.
3. Preserve original metadata: archive ID, flight/sortie, frame number, acquisition date, scale/resolution, and license/access status.
4. Filter candidate footprints that intersect the Vatican search extent. Treat bounding-box filtering as a first pass only; use polygon intersection for final candidates.
5. Inspect each candidate's footprint and metadata against the published historical image records.
6. Georeference only the image files actually obtained from the archive. Record control points, CRS, transformation method, and residual error.
7. Add each overlay to the map as a separate date-stamped layer, with its provenance and confidence.
8. Keep the digital twin as an external linked model until a verified spatial registration or supported embed is available.

## Current evidence status
- **Verified links:** official digital-twin entry point, AFN WebGIS, IGM aerial archive, official necropolis page.
- **Historical leads:** records/pages identified above; capture dates and exact footprint need individual validation.
- **Not yet done:** retrieving Vatican-overlapping IGM/AFN frame IDs, downloading archive scans, georeferencing them, and merging them into a single spatially aligned layer.
- **Do not claim:** that the 300,000 archive frames are all Vatican images; that historical postcards' postmark dates are image capture dates; or that surface imagery reveals underground tunnels.

## Suggested next commit
Add a small data manifest (GeoJSON/CSV) with one record per verified frame, then expose those records as a separate historical-imagery layer in the existing Cesium-based Sentinel satellite view. Do not modify the current global viewer until the source manifest and layer behavior are tested.
