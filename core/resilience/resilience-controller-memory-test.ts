import {
  ResilienceController,
} from "./resilience-controller";

import type {
  ReachabilityAssessment,
} from "./reachability-matrix";

import {
  IncidentMemory,
  type NetworkIncident,
} from "./incident-memory";

function createAssessment(
  id: string,
  name: string,
  critical: boolean,
  status: "UP" | "DEGRADED" | "DOWN",
  degradationScore: number,
  latencyChangeMs: number | null,
): ReachabilityAssessment {
  return {
    target: {
      id,
      name,
      host: `${id}.local`,
      port: 443,
      protocol: "TCP",
      critical,
    },

    current: {
      targetId: id,
      targetName: name,
      host: `${id}.local`,
      port: 443,
      protocol: "TCP",

      tcpStatus: status,
      tlsStatus: status,
      dnsStatus: status,
      httpStatus: status,

      latencyMs:
        latencyChangeMs !== null
          ? 30 + latencyChangeMs
          : 30,

      packetLossPercent:
        status === "UP"
          ? 0
          : status === "DEGRADED"
            ? 5
            : 100,

      overallStatus: status,

      measuredAt:
        new Date().toISOString(),
    },

    baseline: {
      target: id,
      host: `${id}.local`,
      port: 443,
      healthySamples: 100,
      totalSamples: 100,
      averageLatencyMs: 30,
      successRate: 100,
      baselineStatus: "UP",
      firstSeenAt:
        new Date().toISOString(),
      lastSeenAt:
        new Date().toISOString(),
    },

    statusChanged:
      status !== "UP",

    latencyChangeMs,

    successRateChange:
      status === "UP"
        ? 0
        : status === "DEGRADED"
          ? -25
          : -100,

    degradationScore,
  };
}

function createHistoricalIncident(): NetworkIncident {
  const now = new Date().toISOString();

  return {
    id: "INC-HISTORICAL-001",
    name: "Historical Network Restriction Test",

    startedAt: now,
    endedAt: now,

    phase: "RESOLVED",
    severity: "HIGH",

    globalReachabilityPercent: 0,
    domesticReachabilityPercent: 100,

    affectedTargets: 2,
    criticalFailures: 1,

    signals: [
      {
        name: "GLOBAL_REACHABILITY",
        value: 0,
        source: "Historical Test",
        observedAt: now,
        confidence: 0.95,
      },

      {
        name: "DNS_FAILURE",
        value: 0,
        source: "Historical Test",
        observedAt: now,
        confidence: 0.9,
      },

      {
        name: "TLS_FAILURE",
        value: 0,
        source: "Historical Test",
        observedAt: now,
        confidence: 0.9,
      },

      {
        name: "TCP_FAILURE",
        value: 0,
        source: "Historical Test",
        observedAt: now,
        confidence: 0.9,
      },

      {
        name: "AVERAGE_LATENCY_CHANGE",
        value: 110,
        source: "Historical Test",
        observedAt: now,
        confidence: 0.85,
      },
    ],

    notes: [
      "Controller memory integration test",
    ],
  };
}

function main() {
  console.log(
    "SCENARIO 1: CONTROLLER WITHOUT HISTORY",
  );

  const emptyMemory =
    new IncidentMemory();

  const controllerWithoutHistory =
    new ResilienceController(
      emptyMemory,
    );

  const assessments = [
    createAssessment(
      "SERVICE-A",
      "Service A",
      true,
      "DEGRADED",
      35,
      110,
    ),

    createAssessment(
      "SERVICE-B",
      "Service B",
      false,
      "DEGRADED",
      30,
      110,
    ),
  ];

  const withoutHistory =
    controllerWithoutHistory.evaluate(
      {
        cpuPercent: 45,
        memoryPercent: 65,
        queueDepth: 30,
        networkHealthy: false,
        remoteAvailable: true,
      },
      assessments,
    );

  console.log(withoutHistory);

  if (
    withoutHistory.correlationMatches
      .length !== 0
  ) {
    throw new Error(
      "Controller should have no historical matches",
    );
  }

  console.log(
    "EMPTY HISTORY CONTROLLER VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 2: CONTROLLER WITH HISTORY",
  );

  const memory =
    new IncidentMemory();

  memory.recordIncident(
    createHistoricalIncident(),
  );

  const controller =
    new ResilienceController(
      memory,
    );

  const evaluation =
    controller.evaluate(
      {
        cpuPercent: 45,
        memoryPercent: 65,
        queueDepth: 30,
        networkHealthy: false,
        remoteAvailable: true,
      },
      assessments,
    );

  console.log(evaluation);

  if (
    evaluation.correlationMatches
      .length === 0
  ) {
    throw new Error(
      "Historical controller match was not detected",
    );
  }

  const topMatch =
    evaluation.correlationMatches[0];

  if (!topMatch) {
    throw new Error(
      "Top historical match is missing",
    );
  }

  console.log("TOP HISTORICAL MATCH ✅");
  console.log(topMatch);

  if (
    topMatch.incidentId !==
      "INC-HISTORICAL-001" ||
    topMatch.similarityScore < 70 ||
    topMatch.confidence < 0.8
  ) {
    throw new Error(
      "Historical controller correlation verification failed",
    );
  }

  console.log(
    "HISTORICAL CONTROLLER CORRELATION VERIFIED ✅",
  );

  if (
    !evaluation.decision
      .historicalPatternMatched
  ) {
    throw new Error(
      "Decision engine did not receive historical match",
    );
  }

  if (
    evaluation.transition
      .currentMode !==
    "PRE_SURVIVAL"
  ) {
    throw new Error(
      `Expected PRE_SURVIVAL, got ${evaluation.transition.currentMode}`,
    );
  }

  console.log(
    "HISTORICAL DECISION PROPAGATION VERIFIED ✅",
  );

  if (
    !evaluation.resources
      .enableLocalAI ||
    evaluation.resources
      .enableHeavyAnalysis
  ) {
    throw new Error(
      "Historical pre-survival resource policy failed",
    );
  }

  console.log(
    "PRE-SURVIVAL RESOURCE POLICY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 3: MEMORY SUMMARY",
  );

  const summary =
    memory.summarize();

  console.log(summary);

  if (
    summary.totalIncidents !== 1 ||
    summary.criticalIncidents !== 0
  ) {
    throw new Error(
      "Memory summary verification failed",
    );
  }

  console.log(
    "MEMORY SUMMARY VERIFIED ✅",
  );

  console.log(
    "RESILIENCE CONTROLLER MEMORY INTEGRATION VERIFIED ✅",
  );
}

main();