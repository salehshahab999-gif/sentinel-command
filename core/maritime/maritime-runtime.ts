import { MARITIME_PROVIDERS, MARITIME_WIRE_STATUS } from "./maritime-providers";
import type { MaritimeSnapshot, VesselRecord } from "./maritime-contracts";
import { fetchOpenWatersSnapshot } from "./openwaters-client";

const LIVE_ENV = "SENTINEL_MARITIME_LIVE";

export function isMaritimeLiveEnabled(): boolean {
  return process.env[LIVE_ENV] === "1";
}

export function getMaritimeSnapshot(): MaritimeSnapshot {
  return {
    mode: "SKELETON",
    liveEnabled: isMaritimeLiveEnabled(),
    timestamp: new Date().toISOString(),
    vesselCount: 0,
    providers: MARITIME_WIRE_STATUS,
    vessels: [],
  };
}

export async function collectMaritimeSnapshot(bbox?: [number, number, number, number]): Promise<MaritimeSnapshot> {
  if (!isMaritimeLiveEnabled()) {
    return getMaritimeSnapshot();
  }

  let openWaters: VesselRecord[] = [];
  try {
    openWaters = await fetchOpenWatersSnapshot(bbox);
  } catch {
    return {
      ...getMaritimeSnapshot(),
      mode: "DEGRADED",
    };
  }

  const providers = MARITIME_WIRE_STATUS.map((status) =>
    status.component === "Open Waters / aiscast"
      ? { ...status, status: "CONNECTED" as const, note: MARITIME_PROVIDERS[0].note }
      : status,
  );

  return {
    mode: "LIVE",
    liveEnabled: true,
    timestamp: new Date().toISOString(),
    vesselCount: openWaters.length,
    providers,
    vessels: openWaters,
  };
}
