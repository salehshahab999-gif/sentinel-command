import {
  ResilienceDecisionEngine,
  type OperationalMode,
} from "./resilience-decision-engine";

import type {
  EarlyWarningResult,
} from "./early-warning";

import type {
  CorrelatedWarning,
} from "./early-warning-correlator";

import type {
  ResourceDecision,
  ResourceSnapshot,
} from "./resource-governor";

function createWarning(
  level: EarlyWarningResult["level"],
  score: number,
): EarlyWarningResult {
  return {
    level,
    score,
    affectedTargets: 0,
    criticalFailures: 0,
    reasons: [
      `Test warning level: ${level}`,
    ],
    generatedAt:
      new Date().toISOString(),
  };
}

function createCorrelation(
  level: CorrelatedWarning["level"],
  riskScore: number,
  patternMatched: boolean,
): CorrelatedWarning {
  return {
    level,
    riskScore,
    networkScore: riskScore,
    historicalSimilarity:
      patternMatched ? 100 : 0,
    historicalConfidence:
      patternMatched ? 0.95 : 0,
    patternMatched,
    matchingIncidentId:
      patternMatched
        ? "INC-TEST-001"
        : null,
    matchingIncidentName:
      patternMatched
        ? "Historical Test Incident"
        : null,
    reasons: [
      "Test correlation",
    ],
    generatedAt:
      new Date().toISOString(),
  };
}

function createResources(
  mode: ResourceDecision["mode"],
): ResourceDecision {
  return {
    mode,
    enableNetworkProbes:
      mode !== "EMERGENCY",
    probeIntervalMs:
      mode === "LOCAL_SURVIVAL"
        ? 5_000
        : mode === "PRE_SURVIVAL"
          ? 10_000
          : mode === "WATCH"
            ? 15_000
            : 30_000,
    enableLocalAI:
      mode === "LOCAL_SURVIVAL" ||
      mode === "PRE_SURVIVAL",
    enableHeavyAnalysis:
      mode === "NORMAL",
    enableSourceRefresh:
      mode === "NORMAL" ||
      mode === "WATCH",
    maxConcurrentJobs:
      mode === "EMERGENCY"
        ? 1
        : mode === "LOCAL_SURVIVAL"
          ? 2
          : mode === "PRE_SURVIVAL"
            ? 2
            : mode === "WATCH"
              ? 3
              : 4,
    reason:
      `Test resource mode: ${mode}`,
  };
}

function createSnapshot(
  overrides: Partial<ResourceSnapshot> = {},
): ResourceSnapshot {
  return {
    cpuPercent: 20,
    memoryPercent: 40,
    queueDepth: 0,
    networkHealthy: true,
    remoteAvailable: true,
    ...overrides,
  };
}

function verifyMode(
  actual: OperationalMode,
  expected: OperationalMode,
  name: string,
): void {
  if (actual !== expected) {
    throw new Error(
      `${name}: expected ${expected}, got ${actual}`,
    );
  }

  console.log(
    `${name} VERIFIED ✅`,
  );
}

function main() {
  const engine =
    new ResilienceDecisionEngine();

  console.log(
    "SCENARIO 1: NORMAL OPERATION 🟢",
  );

  const normal = engine.decide(
    createWarning("NORMAL", 5),
    createCorrelation(
      "NORMAL",
      4,
      false,
    ),
    createResources("NORMAL"),
    createSnapshot(),
  );

  console.log(normal);

  verifyMode(
    normal.mode,
    "NORMAL",
    "NORMAL OPERATION",
  );

  if (
    normal.enableHeavyAnalysis !== true ||
    normal.enableLocalAI !== false ||
    normal.maxConcurrentJobs !== 4
  ) {
    throw new Error(
      "Normal resource policy verification failed",
    );
  }

  console.log(
    "NORMAL RESOURCE POLICY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 2: EARLY NETWORK WARNING 🟡",
  );

  const watch = engine.decide(
    createWarning("WATCH", 30),
    createCorrelation(
      "WATCH",
      29,
      false,
    ),
    createResources("WATCH"),
    createSnapshot({
      cpuPercent: 45,
      memoryPercent: 65,
      queueDepth: 30,
    }),
  );

  console.log(watch);

  verifyMode(
    watch.mode,
    "WATCH",
    "EARLY NETWORK WARNING",
  );

  if (
    watch.enableHeavyAnalysis ||
    watch.enableLocalAI ||
    watch.probeIntervalMs !== 15_000
  ) {
    throw new Error(
      "Watch resource policy verification failed",
    );
  }

  console.log(
    "WATCH RESOURCE POLICY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 3: HIGH RISK + HISTORICAL MATCH 🟠",
  );

  const preSurvival = engine.decide(
    createWarning("HIGH", 70),
    createCorrelation(
      "CRITICAL",
      77,
      true,
    ),
    createResources("PRE_SURVIVAL"),
    createSnapshot({
      cpuPercent: 55,
      memoryPercent: 70,
      queueDepth: 60,
      networkHealthy: false,
      remoteAvailable: true,
    }),
  );

  console.log(preSurvival);

  verifyMode(
    preSurvival.mode,
    "PRE_SURVIVAL",
    "HIGH RISK PRE-SURVIVAL",
  );

  if (
    !preSurvival.enableLocalAI ||
    preSurvival.enableHeavyAnalysis ||
    !preSurvival.historicalPatternMatched
  ) {
    throw new Error(
      "Pre-survival policy verification failed",
    );
  }

  console.log(
    "PRE-SURVIVAL POLICY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 4: MAJOR NETWORK OUTAGE 🔴",
  );

  const localSurvival = engine.decide(
    createWarning("CRITICAL", 100),
    createCorrelation(
      "CRITICAL",
      99,
      true,
    ),
    createResources("LOCAL_SURVIVAL"),
    createSnapshot({
      cpuPercent: 60,
      memoryPercent: 75,
      queueDepth: 150,
      networkHealthy: false,
      remoteAvailable: false,
    }),
  );

  console.log(localSurvival);

  verifyMode(
    localSurvival.mode,
    "LOCAL_SURVIVAL",
    "MAJOR NETWORK OUTAGE",
  );

  if (
    !localSurvival.enableLocalAI ||
    localSurvival.enableHeavyAnalysis ||
    localSurvival.enableSourceRefresh ||
    localSurvival.maxConcurrentJobs !== 2 ||
    localSurvival.probeIntervalMs !== 5_000
  ) {
    throw new Error(
      "Local survival policy verification failed",
    );
  }

  console.log(
    "LOCAL SURVIVAL POLICY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 5: SYSTEM RESOURCE EMERGENCY 🚨",
  );

  const emergency = engine.decide(
    createWarning("CRITICAL", 100),
    createCorrelation(
      "CRITICAL",
      100,
      true,
    ),
    createResources("EMERGENCY"),
    createSnapshot({
      cpuPercent: 92,
      memoryPercent: 95,
      queueDepth: 200,
      networkHealthy: false,
      remoteAvailable: false,
    }),
  );

  console.log(emergency);

  verifyMode(
    emergency.mode,
    "EMERGENCY",
    "SYSTEM RESOURCE EMERGENCY",
  );

  if (
    emergency.enableLocalAI ||
    emergency.enableHeavyAnalysis ||
    emergency.enableSourceRefresh ||
    emergency.enableNetworkProbes ||
    emergency.maxConcurrentJobs !== 1
  ) {
    throw new Error(
      "Emergency resource policy verification failed",
    );
  }

  console.log(
    "EMERGENCY RESOURCE POLICY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "RESILIENCE DECISION ENGINE VERIFIED ✅",
  );
}

main();