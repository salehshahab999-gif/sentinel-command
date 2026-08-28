import {
  ResilienceController,
} from "./resilience-controller";

import type {
  ReachabilityAssessment,
} from "./reachability-matrix";

function createAssessment(
  id: string,
  name: string,
  critical: boolean,
  overallStatus: "UP" | "DOWN" | "DEGRADED",
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
      tcpStatus:
        overallStatus === "UP"
          ? "UP"
          : overallStatus,
      tlsStatus:
        overallStatus === "UP"
          ? "UP"
          : overallStatus,
      dnsStatus:
        overallStatus === "UP"
          ? "UP"
          : overallStatus,
      httpStatus:
        overallStatus === "UP"
          ? "UP"
          : overallStatus,
      latencyMs:
        latencyChangeMs !== null
          ? 200 + latencyChangeMs
          : 30,
      packetLossPercent:
        overallStatus === "UP"
          ? 0
          : overallStatus === "DEGRADED"
            ? 5
            : 100,
      overallStatus,
      measuredAt: new Date().toISOString(),
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
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    },

    statusChanged: overallStatus !== "UP",
    latencyChangeMs,
    successRateChange:
      overallStatus === "UP"
        ? 0
        : overallStatus === "DEGRADED"
          ? -25
          : -100,
    degradationScore,
  };
}

function main() {
  const controller = new ResilienceController();

  console.log("SCENARIO 1: NORMAL ✅");

  const normalAssessments = [
    createAssessment(
      "SERVICE-A",
      "Service A",
      true,
      "UP",
      0,
      5,
    ),
    createAssessment(
      "SERVICE-B",
      "Service B",
      false,
      "UP",
      0,
      10,
    ),
  ];

  const normal = controller.evaluate(
    {
      cpuPercent: 15,
      memoryPercent: 40,
      queueDepth: 0,
      networkHealthy: true,
      remoteAvailable: true,
    },
    normalAssessments,
  );

  console.log(normal);

  if (
    normal.warning.level !== "NORMAL" ||
    normal.transition.currentMode !== "NORMAL"
  ) {
    throw new Error(
      "NORMAL controller verification failed",
    );
  }

  console.log("NORMAL CONTROLLER VERIFIED ✅");
  console.log("--------------------------------");

  console.log("SCENARIO 2: NETWORK DEGRADATION 🟡");

  const degradedAssessments = [
    createAssessment(
      "SERVICE-A",
      "Service A",
      true,
      "DEGRADED",
      35,
      120,
    ),
    createAssessment(
      "SERVICE-B",
      "Service B",
      false,
      "DEGRADED",
      30,
      100,
    ),
  ];

  const degraded = controller.evaluate(
    {
      cpuPercent: 45,
      memoryPercent: 68,
      queueDepth: 30,
      networkHealthy: true,
      remoteAvailable: true,
    },
    degradedAssessments,
  );

  console.log(degraded);

  if (
    degraded.warning.score < 20 ||
    degraded.transition.currentMode === "NORMAL"
  ) {
    throw new Error(
      "DEGRADED controller verification failed",
    );
  }

  console.log("DEGRADED CONTROLLER VERIFIED ✅");
  console.log("--------------------------------");

  console.log("SCENARIO 3: MAJOR OUTAGE 🔴");

  const outageAssessments = [
    createAssessment(
      "SERVICE-A",
      "Service A",
      true,
      "DOWN",
      100,
      null,
    ),
    createAssessment(
      "SERVICE-B",
      "Service B",
      true,
      "DOWN",
      100,
      null,
    ),
    createAssessment(
      "SERVICE-C",
      "Service C",
      false,
      "DOWN",
      95,
      null,
    ),
    createAssessment(
      "SERVICE-D",
      "Service D",
      false,
      "DEGRADED",
      80,
      250,
    ),
  ];

  const outage = controller.evaluate(
    {
      cpuPercent: 75,
      memoryPercent: 82,
      queueDepth: 120,
      networkHealthy: false,
      remoteAvailable: false,
    },
    outageAssessments,
  );

  console.log(outage);

  if (
    outage.warning.level !== "CRITICAL" ||
    outage.transition.currentMode !==
      "LOCAL_SURVIVAL"
  ) {
    throw new Error(
      "MAJOR OUTAGE controller verification failed",
    );
  }

  if (
    !outage.resources.enableLocalAI ||
    outage.resources.enableHeavyAnalysis
  ) {
    throw new Error(
      "LOCAL SURVIVAL resource policy verification failed",
    );
  }

  console.log("MAJOR OUTAGE CONTROLLER VERIFIED ✅");
  console.log("LOCAL SURVIVAL POLICY VERIFIED ✅");
  console.log("--------------------------------");

  console.log(
    "RESILIENCE CONTROLLER VERIFIED ✅",
  );
}

main();