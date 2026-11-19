import type { SatelliteLayer } from "./satellite-contracts";

/**
 * Display-only layer catalogue. Live data collectors remain disabled until
 * their individual providers are configured and verified.
 */
export const SATELLITE_LAYERS: readonly SatelliteLayer[] = [
  { id: "baseMap", label: "Base map" },
  { id: "satellites", label: "Satellites" },
  { id: "orbits", label: "Orbits" },
  { id: "fires", label: "Fire context" },
  { id: "weather", label: "Weather" },
  { id: "clouds", label: "Clouds" },
  { id: "ocean", label: "Ocean" },
  { id: "ais", label: "AIS" },
  { id: "geography", label: "Geography" },
  { id: "events", label: "Events" },
  { id: "alerts", label: "Alerts" },
];
