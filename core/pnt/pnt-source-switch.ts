import {
  PNT_SOURCE_PRIORITY,
  type PntObservation,
  type PntPosition,
  type PntSourceId,
  type PntSwitchDecision,
} from "./pnt-types";

const LIVE_MAX_AGE_MS = 30_000;
const STALE_MAX_AGE_MS = 5 * 60_000;
const MIN_LIVE_HEALTH = 45;

function ageMs(lastSeenAt: string | null, nowMs: number): number {
  if (!lastSeenAt) return Number.POSITIVE_INFINITY;
  const value = Date.parse(lastSeenAt);
  if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;
  return Math.max(0, nowMs - value);
}

function scoreObservation(
  observation: PntObservation,
  nowMs: number,
): number {
  const age = ageMs(observation.lastSeenAt, nowMs);
  const freshness = age <= LIVE_MAX_AGE_MS ? 100 : age <= STALE_MAX_AGE_MS ? 45 : 0;
  const accuracy = observation.position?.accuracyMeters;
  const accuracyScore =
    accuracy == null
      ? 30
      : accuracy <= 5
        ? 100
        : accuracy <= 20
          ? 85
          : accuracy <= 100
            ? 60
            : 25;

  const sourcePriority = PNT_SOURCE_PRIORITY[observation.sourceId];
  return Math.round(
    observation.healthScore * 0.35 +
      observation.confidence * 100 * 0.2 +
      freshness * 0.25 +
      accuracyScore * 0.1 +
      sourcePriority * 0.1,
  );
}

export function selectPntSource(
  observations: PntObservation[],
  previousSourceId: PntSourceId | null = null,
  now = new Date(),
  lastKnownPosition: PntPosition | null = null,
): PntSwitchDecision {
  const nowMs = now.getTime();

  const ranked = observations
    .map((observation) => ({
      observation,
      score: scoreObservation(observation, nowMs),
      age: ageMs(observation.lastSeenAt, nowMs),
    }))
    .filter(({ observation, age }) => {
      return (
        observation.position !== null &&
        age <= STALE_MAX_AGE_MS &&
        observation.healthScore >= MIN_LIVE_HEALTH
      );
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        PNT_SOURCE_PRIORITY[b.observation.sourceId] -
        PNT_SOURCE_PRIORITY[a.observation.sourceId]
      );
    });

  const winner = ranked[0];

  if (!winner) {
    return {
      activeSourceId: null,
      mode: lastKnownPosition ? "LAST_KNOWN" : "NO_POSITION",
      confidence: lastKnownPosition ? 0.2 : 0,
      position: lastKnownPosition,
      reason: lastKnownPosition
        ? "No fresh PNT source is healthy; retaining last known position."
        : "No usable PNT source is available.",
      decidedAt: now.toISOString(),
    };
  }

  const switched = previousSourceId !== winner.observation.sourceId;

  return {
    activeSourceId: winner.observation.sourceId,
    mode: switched && previousSourceId ? "FAILOVER" : "LIVE",
    confidence: Math.max(0, Math.min(1, winner.observation.confidence)),
    position: winner.observation.position,
    reason: switched
      ? `PNT failover selected ${winner.observation.sourceId}.`
      : `PNT source ${winner.observation.sourceId} remains healthy.`,
    decidedAt: now.toISOString(),
  };
}
