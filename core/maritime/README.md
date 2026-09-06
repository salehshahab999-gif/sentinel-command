# Sentinel Maritime Bus

The maritime layer is intentionally **POWERED OFF** by default.

## Wired sources

- Open Waters / aiscast: free read API, GeoJSON snapshot, WebSocket and SSE.
- AISStream: free global AIS WebSocket slot; token required when activated.
- AIS-catcher Community: community AIS receiver/source slot.
- VesselFinder: official API slot; credentials must come from runtime environment.
- TankerTrackers: OSINT enrichment slot for tanker, STS and satellite-observation intelligence.
- Global Fishing Watch: vessel/fishing intelligence enrichment slot.
- OpenSky Network: aircraft/ADS-B source slot kept separate from maritime collection.
- Flightradar24: official API slot; no website scraping or access-control bypass.

## Power gate

Live collection is enabled only when the server environment explicitly sets:

`SENTINEL_MARITIME_LIVE=1`

Any other value, including an unset variable, keeps the runtime in `SKELETON` mode and performs no upstream live collection.

## Internal API

`GET /api/maritime`

Optional bounding box:

`GET /api/maritime?bbox=minLat,minLon,maxLat,maxLon`

The API returns the current maritime mode, provider wire status and vessel array. In the default skeleton mode the vessel array is empty and no upstream request is made.

## Design rules

- Never put provider API keys in source code.
- Never bypass authentication, paywalls, anti-bot controls or access restrictions.
- Prefer official/public APIs and open-data licenses.
- Keep provider adapters isolated so one source can fail without taking down the fusion layer.
- Keep rendering separate from collection: the UI can demonstrate vessel motion while collectors remain off.
