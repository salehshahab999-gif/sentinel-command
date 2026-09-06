import type {
  SatelliteLayerDefinition,
  SatelliteRecord,
  SatelliteWireStatus,
} from "./satellite-contracts";

export const SATELLITE_LAYERS: SatelliteLayerDefinition[] = [
  { id: "baseMap", label: "Base Map", description: "Online global base map", liveReady: true, defaultEnabled: true },
  { id: "satellites", label: "Satellites", description: "Satellite positions", liveReady: true, defaultEnabled: true },
  { id: "orbits", label: "Orbits", description: "Orbit and ground tracks", liveReady: true, defaultEnabled: false },
  { id: "fires", label: "NASA Fires", description: "NASA FIRMS active fire and thermal anomaly layer", liveReady: true, defaultEnabled: false },
  { id: "weather", label: "Weather", description: "Meteorological satellite products", liveReady: true, defaultEnabled: false },
  { id: "clouds", label: "Clouds", description: "Cloud and atmospheric imagery", liveReady: true, defaultEnabled: false },
  { id: "ocean", label: "Ocean", description: "Ocean and Earth observation layers", liveReady: true, defaultEnabled: false },
  { id: "ais", label: "AIS / Ships", description: "Maritime traffic provider layer", liveReady: true, defaultEnabled: false },
  { id: "geography", label: "Geography", description: "Borders, coastlines and geographic context", liveReady: true, defaultEnabled: true },
  { id: "events", label: "Events", description: "Normalized satellite events", liveReady: true, defaultEnabled: false },
  { id: "alerts", label: "Alerts", description: "Satellite alert signals", liveReady: true, defaultEnabled: false },
];

export const SKELETON_SATELLITES: SatelliteRecord[] = [
  { id: "SAT-01", name: "Sentinel-1", noradId: 39634, operator: "Copernicus", mission: "SAR Earth Observation", source: "COPERNICUS", status: "ONLINE", dataMode: "SKELETON", latitude: 0, longitude: 0, altitudeKm: 693, inclinationDeg: 98.18, raanDeg: 0 },
  { id: "SAT-02", name: "Sentinel-2A", noradId: 40697, operator: "Copernicus", mission: "Multispectral Earth Observation", source: "COPERNICUS", status: "ONLINE", dataMode: "SKELETON", latitude: 12, longitude: 35, altitudeKm: 786, inclinationDeg: 98.62, raanDeg: 35 },
  { id: "SAT-03", name: "Sentinel-2B", noradId: 42063, operator: "Copernicus", mission: "Multispectral Earth Observation", source: "COPERNICUS", status: "ONLINE", dataMode: "SKELETON", latitude: -18, longitude: 72, altitudeKm: 786, inclinationDeg: 98.62, raanDeg: 72 },
  { id: "SAT-04", name: "Sentinel-3A", noradId: 41335, operator: "Copernicus", mission: "Ocean / Land Monitoring", source: "COPERNICUS", status: "ONLINE", dataMode: "SKELETON", latitude: 30, longitude: 118, altitudeKm: 814, inclinationDeg: 98.65, raanDeg: 118 },
  { id: "SAT-05", name: "Sentinel-5P", noradId: 42969, operator: "Copernicus", mission: "Atmospheric Monitoring", source: "COPERNICUS", status: "ONLINE", dataMode: "SKELETON", latitude: 46, longitude: -35, altitudeKm: 824, inclinationDeg: 98.74, raanDeg: 145 },
  { id: "SAT-06", name: "NOAA-20", noradId: 43013, operator: "NOAA", mission: "Weather / Earth Observation", source: "NOAA", status: "ONLINE", dataMode: "SKELETON", latitude: -6, longitude: -102, altitudeKm: 824, inclinationDeg: 98.7, raanDeg: 190 },
  { id: "SAT-07", name: "NOAA-21", noradId: 54234, operator: "NOAA", mission: "Weather / Earth Observation", source: "NOAA", status: "ONLINE", dataMode: "SKELETON", latitude: 58, longitude: -165, altitudeKm: 833, inclinationDeg: 98.7, raanDeg: 220 },
  { id: "SAT-08", name: "Terra", noradId: 25994, operator: "NASA", mission: "Earth Science", source: "NASA", status: "ONLINE", dataMode: "SKELETON", latitude: -42, longitude: 154, altitudeKm: 705, inclinationDeg: 98.2, raanDeg: 260 },
  { id: "SAT-09", name: "Aqua", noradId: 27424, operator: "NASA", mission: "Earth Science", source: "NASA", status: "ONLINE", dataMode: "SKELETON", latitude: 8, longitude: 8, altitudeKm: 705, inclinationDeg: 98.2, raanDeg: 300 },
  { id: "SAT-10", name: "GOES-19", operator: "NOAA", mission: "Geostationary Weather", source: "NOAA", status: "ONLINE", dataMode: "SKELETON", latitude: 0, longitude: -75, altitudeKm: 35786, inclinationDeg: 0.1, raanDeg: 345 },
];

export const SATELLITE_WIRE_STATUS: SatelliteWireStatus[] = [
  { component: "3D Globe", status: "READY", note: "CesiumJS integration target; no live satellite fetch" },
  { component: "Base Map", status: "READY", note: "Online map layer target" },
  { component: "Satellite Catalog", status: "READY", note: "Skeleton records only" },
  { component: "Orbit Engine", status: "POWERED_OFF", note: "Will use TLE/OMM + SGP4 when powered" },
  { component: "NASA FIRMS", status: "POWERED_OFF", note: "Dormant NASA FIRMS wiring; live hotspot collection disabled" },
  { component: "NASA CMR / Earthdata", status: "POWERED_OFF", note: "Metadata and dataset discovery wiring only" },
  { component: "NASA GIBS / Worldview", status: "POWERED_OFF", note: "Global imagery layer wiring only" },
  { component: "NASA EONET", status: "POWERED_OFF", note: "Natural-event discovery wiring only" },
  { component: "NASA Spot the Station", status: "POWERED_OFF", note: "Public ephemeris wiring only" },
  { component: "Google Maps / 3D Tiles", status: "POWERED_OFF", note: "Optional provider; API key/billing required; never enabled implicitly" },
  { component: "Copernicus", status: "POWERED_OFF", note: "Provider wiring only" },
  { component: "NOAA", status: "POWERED_OFF", note: "Provider wiring only" },
  { component: "AIS", status: "POWERED_OFF", note: "Provider wiring only" },
  { component: "Logger", status: "READY", note: "Event contract ready; no satellite collector active" },
  { component: "Alert Center", status: "READY", note: "Alert contract ready; no satellite alert generation active" },
];
