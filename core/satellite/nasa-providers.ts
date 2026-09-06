export type NasaProviderStatus = "POWERED_OFF" | "READY";

export type NasaProviderWire = {
  id: string;
  label: string;
  status: NasaProviderStatus;
  freeData: boolean;
  liveReady: boolean;
  purpose: string;
  endpoint: string;
  note: string;
};

export const NASA_FREE_PROVIDER_WIRES: NasaProviderWire[] = [
  {
    id: "firms",
    label: "NASA FIRMS",
    status: "READY",
    freeData: true,
    liveReady: true,
    purpose: "Active fire / thermal anomaly discovery",
    endpoint: "/api/satellite/firms",
    note: "MAP_KEY protected service; live collection remains disabled in Sentinel.",
  },
  {
    id: "gibs",
    label: "NASA GIBS / Worldview",
    status: "READY",
    freeData: true,
    liveReady: true,
    purpose: "Global Earth imagery and visualization layers",
    endpoint: "NASA GIBS WMTS/WMS",
    note: "Use as imagery layer source; keep requests viewport-bounded.",
  },
  {
    id: "cmr",
    label: "NASA Earthdata CMR",
    status: "READY",
    freeData: true,
    liveReady: true,
    purpose: "Dataset and granule discovery",
    endpoint: "https://cmr.earthdata.nasa.gov/search",
    note: "Supports JSON, STAC, KML and programmatic catalog search.",
  },
  {
    id: "cmr-graphql",
    label: "NASA CMR GraphQL",
    status: "READY",
    freeData: true,
    liveReady: true,
    purpose: "Precise metadata discovery with GraphQL",
    endpoint: "https://graphql.earthdata.nasa.gov/api",
    note: "Use for selective metadata fields instead of broad payloads.",
  },
  {
    id: "eonet",
    label: "NASA EONET",
    status: "READY",
    freeData: true,
    liveReady: true,
    purpose: "Natural-event intelligence and cross-correlation",
    endpoint: "NASA EONET API",
    note: "Event feed can enrich thermal anomalies and other Earth events.",
  },
  {
    id: "api",
    label: "NASA Open APIs",
    status: "READY",
    freeData: true,
    liveReady: true,
    purpose: "NASA metadata and public API enrichment",
    endpoint: "https://api.nasa.gov",
    note: "Use DEMO_KEY or a free API key where the service requires one.",
  },
  {
    id: "spot-the-station",
    label: "NASA Spot the Station",
    status: "READY",
    freeData: true,
    liveReady: true,
    purpose: "ISS public ephemeris/state vectors",
    endpoint: "NASA public ISS coordinates / OMM resources",
    note: "Useful for orbit/overpass examples and validation, not broad catalog coverage.",
  },
];

export const NASA_FREE_PIPELINE = [
  "FIRMS_THERMAL_TRIGGER",
  "GIBS_WORLDVIEW_IMAGERY",
  "CMR_DATA_DISCOVERY",
  "EONET_EVENT_CONTEXT",
  "NASA_API_ENRICHMENT",
  "COPERNICUS_CONFIRMATION",
  "SENTINEL_1_SAR_CONFIRMATION",
  "SENTINEL_2_OPTICAL_CONFIRMATION",
] as const;
