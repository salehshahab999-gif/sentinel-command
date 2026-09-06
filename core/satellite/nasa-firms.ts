import type { SatelliteRecord } from "./satellite-contracts";

export type NasaFirmsMode = "POWERED_OFF" | "LIVE" | "DEGRADED";

export type NasaFirmsHotspot = {
  id: string;
  latitude: number;
  longitude: number;
  brightnessK?: number;
  frpMw?: number;
  confidence?: number | string;
  acquisitionTime?: string;
  satellite?: string;
  instrument?: "VIIRS" | "MODIS" | "OTHER";
  dayNight?: "D" | "N" | "UNKNOWN";
  source: "NASA_FIRMS";
};

export type NasaFirmsSnapshot = {
  source: "NASA_FIRMS";
  mode: NasaFirmsMode;
  liveEnabled: boolean;
  timestamp: string;
  hotspotCount: number;
  hotspots: NasaFirmsHotspot[];
};

export const NASA_FIRMS_WIRE = {
  component: "NASA FIRMS",
  status: "POWERED_OFF" as const,
  role: "EARLY_THERMAL_SIGNAL",
  note: "Dormant provider wiring. Live hotspot collection remains disabled.",
};

export const isNasaFirmsLiveEnabled = (): boolean =>
  process.env.SENTINEL_NASA_FIRMS_LIVE === "1";

export function getNasaFirmsSnapshot(): NasaFirmsSnapshot {
  return {
    source: "NASA_FIRMS",
    mode: "POWERED_OFF",
    liveEnabled: isNasaFirmsLiveEnabled(),
    timestamp: new Date().toISOString(),
    hotspotCount: 0,
    hotspots: [],
  };
}

export function correlateFirmsHotspotWithSatellite(
  hotspot: NasaFirmsHotspot,
  satellites: SatelliteRecord[],
): SatelliteRecord | null {
  if (satellites.length === 0) return null;

  let closest: SatelliteRecord | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const satellite of satellites) {
    const dLat = satellite.latitude - hotspot.latitude;
    const dLon = satellite.longitude - hotspot.longitude;
    const distanceSquared = dLat * dLat + dLon * dLon;

    if (distanceSquared < closestDistance) {
      closestDistance = distanceSquared;
      closest = satellite;
    }
  }

  return closest;
}
