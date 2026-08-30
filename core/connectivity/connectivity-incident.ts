import type {
  ConnectivitySnapshot,
} from "./connectivity-types";

import type {
  NetworkIncident,
  IncidentSeverity,
} from "../resilience/incident-memory";

function getSeverity(
  state: ConnectivitySnapshot["state"],
): IncidentSeverity {
  switch (state) {
    case "OFFLINE":
      return "CRITICAL";

    case "DOMESTIC_ONLY":
      return "HIGH";

    case "GLOBAL_PARTIAL":
      return "MEDIUM";

    case "NORMAL":
      return "LOW";

    default:
      return "LOW";
  }
}

function getIncidentPhase(
  state: ConnectivitySnapshot["state"],
): NetworkIncident["phase"] {
  switch (state) {
    case "NORMAL":
      return "RESOLVED";

    case "GLOBAL_PARTIAL":
    case "DOMESTIC_ONLY":
    case "OFFLINE":
      return "DURING";

    default:
      return "BEFORE";
  }
}

function createSignals(
  snapshot: ConnectivitySnapshot,
) {
  return [
    {
      name: "GLOBAL_REACHABILITY",
      value:
        snapshot.globalReachabilityPercent,
      source: "LOCAL_CONNECTIVITY_PROBE",
      observedAt:
        snapshot.measuredAt,
      confidence: 0.9,
    },
    {
      name: "DOMESTIC_REACHABILITY",
      value:
        snapshot.domesticReachabilityPercent,
      source: "LOCAL_CONNECTIVITY_PROBE",
      observedAt:
        snapshot.measuredAt,
      confidence: 0.9,
    },
    {
      name: "REACHABLE_TARGETS",
      value:
        snapshot.reachableTargets,
      source: "LOCAL_CONNECTIVITY_PROBE",
      observedAt:
        snapshot.measuredAt,
      confidence: 0.85,
    },
  ];
}

export function snapshotToIncident(
  snapshot: ConnectivitySnapshot,
): NetworkIncident {
  const phase =
    getIncidentPhase(
      snapshot.state,
    );

  const severity =
    getSeverity(
      snapshot.state,
    );

  const incidentId =
    `CONNECTIVITY-${snapshot.state}-${Date.now()}`;

  return {
    id: incidentId,

    name:
      `Connectivity ${snapshot.state}`,

    startedAt:
      snapshot.measuredAt,

    endedAt:
      snapshot.state === "NORMAL"
        ? snapshot.measuredAt
        : null,

    phase,

    severity,

    globalReachabilityPercent:
      snapshot.globalReachabilityPercent,

    domesticReachabilityPercent:
      snapshot.domesticReachabilityPercent,

    affectedTargets:
      snapshot.totalTargets -
      snapshot.reachableTargets,

    criticalFailures:
      snapshot.state === "OFFLINE"
        ? snapshot.totalTargets
        : 0,

    signals:
      createSignals(
        snapshot,
      ),

    notes: [
      `Connectivity state: ${snapshot.state}`,
      `Global reachability: ${snapshot.globalReachabilityPercent}%`,
      `Domestic reachability: ${snapshot.domesticReachabilityPercent}%`,
      `Reachable targets: ${snapshot.reachableTargets}/${snapshot.totalTargets}`,
    ],
  };
}