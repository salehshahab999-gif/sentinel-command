import {
  EarlyWarningCorrelator,
  type CorrelatedRiskLevel,
} from "./early-warning-correlator";

import type {
  EarlyWarningResult,
} from "./early-warning";

import type {
  IncidentPatternMatch,
} from "./incident-memory";

function createWarning(
  score: number,
  level: EarlyWarningResult["level"],
): EarlyWarningResult {
  return {
    level,
    score,
    affectedTargets: 3,
    criticalFailures: 1,
    reasons: [
      "Test network degradation",
    ],
    generatedAt:
      new Date().toISOString(),
  };
}

function createMatch(
  similarityScore: number,
  confidence: number,
): IncidentPatternMatch {
  return {
    incidentId: "INC-TEST-001",
    incidentName:
      "Historical Test Incident",
    similarityScore,
    confidence,
    matchingSignals: [
      "GLOBAL_REACHABILITY",
      "DNS_FAILURE",
      "TLS_FAILURE",
    ],
  };
}

function verifyLevel(
  actual: CorrelatedRiskLevel,
  expected: CorrelatedRiskLevel,
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
  const correlator =
    new EarlyWarningCorrelator();

  console.log(
    "SCENARIO 1: NORMAL NETWORK",
  );

  const normal =
    correlator.correlate(
      createWarning(5, "NORMAL"),
      [],
    );

  console.log(normal);

  verifyLevel(
    normal.level,
    "NORMAL",
    "NORMAL CORRELATION",
  );

  if (
    normal.patternMatched ||
    normal.riskScore !== 4
  ) {
    throw new Error(
      "Normal correlation verification failed",
    );
  }

  console.log(
    "NO HISTORICAL PATTERN VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 2: NETWORK + HISTORICAL MATCH",
  );

  const historicalMatch =
    createMatch(100, 0.94);

  const high =
    correlator.correlate(
      createWarning(70, "HIGH"),
      [historicalMatch],
    );

  console.log(high);

  verifyLevel(
    high.level,
    "CRITICAL",
    "HIGH NETWORK + STRONG HISTORY CORRELATION",
  );

  if (
    !high.patternMatched ||
    high.historicalSimilarity !== 100 ||
    high.historicalConfidence !== 0.94 ||
    high.riskScore !== 77
  ) {
    throw new Error(
      "Historical high-risk correlation verification failed",
    );
  }

  console.log(
    "HISTORICAL PATTERN CORRELATION VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 3: CRITICAL NETWORK + STRONG HISTORY",
  );

  const criticalMatch =
    createMatch(100, 0.98);

  const critical =
    correlator.correlate(
      createWarning(100, "CRITICAL"),
      [criticalMatch],
    );

  console.log(critical);

  verifyLevel(
    critical.level,
    "CRITICAL",
    "CRITICAL CORRELATION",
  );

  if (
    !critical.patternMatched ||
    critical.riskScore !== 99
  ) {
    throw new Error(
      "Critical historical correlation verification failed",
    );
  }

  console.log(
    "CRITICAL HISTORICAL CORRELATION VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 4: WEAK HISTORICAL MATCH",
  );

  const weakMatch =
    createMatch(50, 0.5);

  const weak =
    correlator.correlate(
      createWarning(30, "WATCH"),
      [weakMatch],
    );

  console.log(weak);

  if (weak.patternMatched) {
    throw new Error(
      "Weak historical match should not be considered strong",
    );
  }

  if (
    weak.historicalSimilarity !== 50 ||
    weak.historicalConfidence !== 0.5
  ) {
    throw new Error(
      "Weak historical match data verification failed",
    );
  }

  console.log(
    "WEAK HISTORICAL MATCH HANDLED ✅",
  );

  console.log(
    "EARLY WARNING CORRELATOR VERIFIED ✅",
  );
}

main();