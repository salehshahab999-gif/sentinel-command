import { selectPntSource } from "./pnt-source-switch";
import type { PntObservation } from "./pnt-types";

const now = new Date("2026-09-01T17:30:00.000Z");

const observations: PntObservation[] = [
  {
    sourceId: "GNSS_RECEIVER_1",
    sourceKind: "GNSS",
    status: "ACTIVE",
    position: {
      latitude: 35.6892,
      longitude: 51.389,
      accuracyMeters: 4,
      altitudeMeters: 1200,
      speedMetersPerSecond: 0,
      headingDegrees: null,
      observedAt: now.toISOString(),
    },
    provider: "SIMULATED_NMEA",
    satelliteCount: 18,
    confidence: 0.98,
    healthScore: 96,
    lastSeenAt: now.toISOString(),
    error: null,
  },
  {
    sourceId: "WINDOWS_LOCATION",
    sourceKind: "WINDOWS",
    status: "AVAILABLE",
    position: {
      latitude: 35.6894,
      longitude: 51.3892,
      accuracyMeters: 35,
      altitudeMeters: null,
      speedMetersPerSecond: null,
      headingDegrees: null,
      observedAt: now.toISOString(),
    },
    provider: "WiFi",
    satelliteCount: null,
    confidence: 0.7,
    healthScore: 75,
    lastSeenAt: now.toISOString(),
    error: null,
  },
];

const first = selectPntSource(observations, null, now);
if (first.activeSourceId !== "GNSS_RECEIVER_1" || first.mode !== "LIVE") {
  throw new Error(`Initial selection failed: ${JSON.stringify(first)}`);
}

const receiver1Failed = observations.map((item) =>
  item.sourceId === "GNSS_RECEIVER_1"
    ? { ...item, status: "FAILED" as const, healthScore: 0, position: null }
    : item,
);

const failover = selectPntSource(
  receiver1Failed,
  "GNSS_RECEIVER_1",
  now,
  observations[0].position,
);

if (failover.activeSourceId !== "WINDOWS_LOCATION" || failover.mode !== "FAILOVER") {
  throw new Error(`Failover selection failed: ${JSON.stringify(failover)}`);
}

const noSources = selectPntSource(
  receiver1Failed.map((item) => ({ ...item, position: null, healthScore: 0 })),
  "WINDOWS_LOCATION",
  now,
  observations[0].position,
);

if (noSources.mode !== "LAST_KNOWN" || noSources.position === null) {
  throw new Error(`Last-known fallback failed: ${JSON.stringify(noSources)}`);
}

console.log("PNT SWITCH TEST: PASS");
console.log(JSON.stringify({ first, failover, noSources }, null, 2));
