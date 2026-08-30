import type {
  ConnectivityObservation,
  ConnectivitySnapshot,
  ConnectivityState,
} from "./connectivity-types";

function calculateReachability(
  observations: ConnectivityObservation[],
  scope: "GLOBAL" | "DOMESTIC",
): number {
  const scoped = observations.filter(
    (observation) =>
      observation.scope === scope,
  );

  if (scoped.length === 0) {
    return 0;
  }

  const reachable = scoped.filter(
    (observation) =>
      observation.status === "UP" ||
      observation.status === "DEGRADED",
  ).length;

  return Number(
    (
      (reachable / scoped.length) *
      100
    ).toFixed(2),
  );
}

function classifyState(
  globalReachabilityPercent: number,
  domesticReachabilityPercent: number,
): ConnectivityState {
  if (
    globalReachabilityPercent === 0 &&
    domesticReachabilityPercent === 0
  ) {
    return "OFFLINE";
  }

  if (
    globalReachabilityPercent === 0 &&
    domesticReachabilityPercent > 0
  ) {
    return "DOMESTIC_ONLY";
  }

  if (
    globalReachabilityPercent > 0 &&
    globalReachabilityPercent < 50
  ) {
    return "GLOBAL_PARTIAL";
  }

  if (
    globalReachabilityPercent >= 50 &&
    domesticReachabilityPercent >= 50
  ) {
    return "NORMAL";
  }

  return "UNKNOWN";
}

export function classifyConnectivity(
  observations: ConnectivityObservation[],
): ConnectivitySnapshot {
  const globalReachabilityPercent =
    calculateReachability(
      observations,
      "GLOBAL",
    );

  const domesticReachabilityPercent =
    calculateReachability(
      observations,
      "DOMESTIC",
    );

  const reachableTargets =
    observations.filter(
      (observation) =>
        observation.status === "UP" ||
        observation.status === "DEGRADED",
    ).length;

  return {
    state: classifyState(
      globalReachabilityPercent,
      domesticReachabilityPercent,
    ),

    globalReachabilityPercent,

    domesticReachabilityPercent,

    totalTargets:
      observations.length,

    reachableTargets,

    observations,

    measuredAt:
      new Date().toISOString(),
  };
}