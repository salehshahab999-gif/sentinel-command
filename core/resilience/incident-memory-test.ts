import {
  IncidentMemory,
  type IncidentSignal,
  type NetworkIncident,
} from "./incident-memory";

function createSignal(
  name: string,
  value: number,
  source: string,
  confidence = 0.9,
): IncidentSignal {
  return {
    name,
    value,
    source,
    confidence,
    observedAt: new Date().toISOString(),
  };
}

function createIncident(
  id: string,
  name: string,
  severity: NetworkIncident["severity"],
  signals: IncidentSignal[],
): NetworkIncident {
  return {
    id,
    name,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    phase: "RESOLVED",
    severity,

    globalReachabilityPercent: 25,
    domesticReachabilityPercent: 80,

    affectedTargets: 5,
    criticalFailures: 2,

    signals,

    notes: [
      "Historical test incident",
    ],
  };
}

function main() {
  const memory = new IncidentMemory();

  const june2025 = createIncident(
    "INC-2025-06",
    "June 2025 connectivity restriction",
    "CRITICAL",
    [
      createSignal(
        "GLOBAL_REACHABILITY",
        20,
        "Historical",
        0.95,
      ),
      createSignal(
        "DNS_FAILURE",
        80,
        "Historical",
        0.9,
      ),
      createSignal(
        "TLS_FAILURE",
        75,
        "Historical",
        0.9,
      ),
      createSignal(
        "IPV6_VISIBILITY",
        15,
        "Historical",
        0.95,
      ),
    ],
  );

  const january2026 = createIncident(
    "INC-2026-01",
    "January 2026 connectivity restriction",
    "CRITICAL",
    [
      createSignal(
        "GLOBAL_REACHABILITY",
        8,
        "Historical",
        0.95,
      ),
      createSignal(
        "DNS_FAILURE",
        90,
        "Historical",
        0.92,
      ),
      createSignal(
        "TLS_FAILURE",
        85,
        "Historical",
        0.92,
      ),
      createSignal(
        "IPV6_VISIBILITY",
        5,
        "Historical",
        0.98,
      ),
    ],
  );

  const february2026 = createIncident(
    "INC-2026-02",
    "February 2026 connectivity disruption",
    "HIGH",
    [
      createSignal(
        "GLOBAL_REACHABILITY",
        35,
        "Historical",
        0.88,
      ),
      createSignal(
        "DNS_FAILURE",
        60,
        "Historical",
        0.85,
      ),
      createSignal(
        "TLS_FAILURE",
        70,
        "Historical",
        0.9,
      ),
      createSignal(
        "IPV6_VISIBILITY",
        30,
        "Historical",
        0.9,
      ),
    ],
  );

  memory.recordIncident(june2025);
  memory.recordIncident(january2026);
  memory.recordIncident(february2026);

  console.log("HISTORICAL INCIDENTS LOADED ✅");

  const summary = memory.summarize();

  console.log("MEMORY SUMMARY ✅");
  console.log(summary);

  if (
    summary.totalIncidents !== 3 ||
    summary.criticalIncidents !== 2
  ) {
    throw new Error(
      "Incident memory summary verification failed",
    );
  }

  console.log(
    "INCIDENT MEMORY SUMMARY VERIFIED ✅",
  );

  const currentSignals: IncidentSignal[] = [
    createSignal(
      "GLOBAL_REACHABILITY",
      7,
      "Current",
      0.95,
    ),
    createSignal(
      "DNS_FAILURE",
      88,
      "Current",
      0.9,
    ),
    createSignal(
      "TLS_FAILURE",
      82,
      "Current",
      0.92,
    ),
    createSignal(
      "IPV6_VISIBILITY",
      6,
      "Current",
      0.97,
    ),
  ];

  const matches =
    memory.matchPattern(
      currentSignals,
    );

  console.log("PATTERN MATCHES ✅");
  console.log(matches);

  if (matches.length === 0) {
    throw new Error(
      "No historical pattern match detected",
    );
  }

  const topMatch = matches[0];

  console.log("TOP MATCH ✅");
  console.log(topMatch);

  if (
    !topMatch ||
    topMatch.incidentId !==
      "INC-2026-01"
  ) {
    throw new Error(
      "Expected January 2026 incident to be the strongest match",
    );
  }

  if (
    topMatch.similarityScore < 70 ||
    topMatch.confidence < 0.8
  ) {
    throw new Error(
      "Historical pattern similarity/confidence too low",
    );
  }

  console.log(
    "HISTORICAL PATTERN MATCH VERIFIED ✅",
  );

  console.log(
    "INCIDENT MEMORY ENGINE VERIFIED ✅",
  );
}

main();