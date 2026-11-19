/**
 * Typed identifiers for the Sentinel Command satellite/intelligence layer UI.
 * These are presentation-layer categories, not live sensor feeds.
 */
export const SATELLITE_LAYER_IDS = [
  "baseMap",
  "satellites",
  "orbits",
  "fires",
  "weather",
  "clouds",
  "ocean",
  "ais",
  "geography",
  "events",
  "alerts",
] as const;

export type SatelliteLayerId = (typeof SATELLITE_LAYER_IDS)[number];

export type SatelliteLayer = {
  id: SatelliteLayerId;
  label: string;
};
