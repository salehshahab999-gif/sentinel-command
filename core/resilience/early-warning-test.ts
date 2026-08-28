import {
  EarlyWarningEngine,
  type EarlyWarningResult,
} from "./early-warning";

import type {
  ReachabilityAssessment,
} from "./reachability-matrix";

function createAssessment(
  id: string,
  name: string,
  critical: boolean,
  status: "UP" | "DOWN" | "DEGRADED",
  degradationScore: number,
  tcpStatus: "UP" | "DOWN" | "DEGRADED",
  tlsStatus: "UP" | "DOWN" | "DEGRADED",
  dnsStatus: "UP" | "DOWN" | "DEGRADED",
  latencyChangeMs: number | null,
): ReachabilityAssessment {
  return {
    target: {
      id,
      name,
      host: `${id}.example.test`,
      port: 443,
      protocol: "TCP",
      critical,
    },

    current: {
      targetId: id,
      targetName: name,
      host: `${id}.example.test`,
      port: 443,
      protocol: "TCP",

      tcpStatus,
      tlsStatus,
      dnsStatus,
      httpStatus: status,

      latencyMs:
        latencyChangeMs !== null
          ? 200 + latencyChangeMs
          : 30,

      packetLossPercent:
        status === "UP"
          ? 0
          : status === "DEGRADED"
            ? 3
            : 100,

      overallStatus: status,
      measuredAt: new Date().toISOString(),
    },

    baseline: {
      target: id,
      host: `${id}.example.test`,
      port: 443,
      healthySamples: 100,
      totalSamples: 100,
      averageLatencyMs: 30,
      successRate: 100,
      baselineStatus: "UP",
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    },

    statusChanged: status !== "UP",

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

function printResult(
  name: string,
  result: EarlyWarningResult,
): void {
  console.log(`SCENARIO: ${name}`);
  console.log("RESULT:");
  console.log(result);
  console.log("--------------------------------");
}

function main() {
  const engine = new EarlyWarningEngine();

  const normalAssessments = [
    createAssessment(
      "SERVICE-A",
      "Service A",
      true,
      "UP",
      0,
      "UP",
      "UP",
      "UP",
      5,
    ),

    createAssessment(
      "SERVICE-B",
      "Service B",
      false,
      "UP",
      5,
      "UP",
      "UP",
      "UP",
      10,
    ),
  ];

  const normal = engine.evaluate(
    normalAssessments,
  );

  printResult(
    "NORMAL NETWORK",
    normal,
  );

  if (normal.level !== "NORMAL") {
    throw new Error(
      `Expected NORMAL, got ${normal.level}`,
    );
  }

  console.log("NORMAL WARNING LEVEL VERIFIED ✅");

  const watchAssessments = [
    createAssessment(
      "SERVICE-A",
      "Service A",
      true,
      "DEGRADED",
      35,
      "UP",
      "DEGRADED",
      "UP",
      120,
    ),

    createAssessment(
      "SERVICE-B",
      "Service B",
      false,
      "DEGRADED",
      30,
      "DEGRADED",
      "UP",
      "UP",
      90,
    ),
  ];

  const watch = engine.evaluate(
    watchAssessments,
  );

  printResult(
    "DEGRADED NETWORK",
    watch,
  );

  if (
    watch.level !== "WATCH" &&
    watch.level !== "HIGH" &&
    watch.level !== "CRITICAL"
  ) {
    throw new Error(
      `Expected elevated warning, got ${watch.level}`,
    );
  }

  console.log(
    "DEGRADED WARNING LEVEL VERIFIED ✅",
  );

  const criticalAssessments = [
    createAssessment(
      "SERVICE-A",
      "Service A",
      true,
      "DOWN",
      100,
      "DOWN",
      "DOWN",
      "DOWN",
      null,
    ),

    createAssessment(
      "SERVICE-B",
      "Service B",
      true,
      "DOWN",
      100,
      "DOWN",
      "DOWN",
      "DOWN",
      null,
    ),

    createAssessment(
      "SERVICE-C",
      "Service C",
      false,
      "DOWN",
      90,
      "DOWN",
      "DOWN",
      "DOWN",
      null,
    ),

    createAssessment(
      "SERVICE-D",
      "Service D",
      false,
      "DEGRADED",
      80,
      "DEGRADED",
      "DOWN",
      "DOWN",
      250,
    ),
  ];

  const critical = engine.evaluate(
    criticalAssessments,
  );

  printResult(
    "MAJOR NETWORK FAILURE",
    critical,
  );

  if (critical.level !== "CRITICAL") {
    throw new Error(
      `Expected CRITICAL, got ${critical.level}`,
    );
  }

  if (critical.score < 70) {
    throw new Error(
      `Expected score >= 70, got ${critical.score}`,
    );
  }

  console.log(
    "CRITICAL WARNING LEVEL VERIFIED ✅",
  );

  if (
    critical.affectedTargets < 3 ||
    critical.criticalFailures < 2
  ) {
    throw new Error(
      "Affected target correlation verification failed",
    );
  }

  console.log(
    "MULTI-TARGET CORRELATION VERIFIED ✅",
  );

  console.log(
    "EARLY WARNING ENGINE VERIFIED ✅",
  );
}

main();