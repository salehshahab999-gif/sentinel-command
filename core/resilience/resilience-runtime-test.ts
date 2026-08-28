import {
  ResilienceRuntime,
} from "./resilience-runtime";

import type {
  ReachabilityAssessment,
} from "./reachability-matrix";

function createAssessment(
  id: string,
  name: string,
  critical: boolean,
  status: "UP" | "DOWN" | "DEGRADED",
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
        status === "UP"
          ? "UP"
          : status,

      tlsStatus:
        status === "UP"
          ? "UP"
          : status,

      dnsStatus:
        status === "UP"
          ? "UP"
          : status,

      httpStatus:
        status === "UP"
          ? "UP"
          : status,

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

function normalAssessment(): ReachabilityAssessment[] {
  return [
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
      8,
    ),
  ];
}

function degradedAssessment(): ReachabilityAssessment[] {
  return [
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
}

function outageAssessment(): ReachabilityAssessment[] {
  return [
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
}

function printCycle(
  cycle: number,
  evaluation: ReturnType<
    ResilienceRuntime["evaluate"]
  >,
): void {
  console.log(
    `CYCLE ${cycle} ✅`,
  );

  console.log({
    mode:
      evaluation.transition.currentMode,

    warning:
      evaluation.warning.level,

    warningScore:
      evaluation.warning.score,

    riskScore:
      evaluation.warning.score,

    historicalMatch:
      evaluation.warning.reasons.some(
        (reason) =>
          reason.includes(
            "Historical pattern",
          ),
      ),

    localAI:
      evaluation.resources.enableLocalAI,

    heavyAnalysis:
      evaluation.resources
        .enableHeavyAnalysis,

    probeInterval:
      evaluation.resources
        .probeIntervalMs,
  });

  console.log(
    "--------------------------------",
  );
}

function main() {
  const runtime =
    new ResilienceRuntime();

  console.log(
    "STARTING RESILIENCE RUNTIME ✅",
  );

  runtime.start();

  let state = runtime.getState();

  if (
    !state.started ||
    state.cycleCount !== 0
  ) {
    throw new Error(
      "Runtime start verification failed",
    );
  }

  console.log(
    "RUNTIME STARTED ✅",
  );

  const normal = runtime.evaluate({
    resources: {
      cpuPercent: 15,
      memoryPercent: 40,
      queueDepth: 0,
      networkHealthy: true,
      remoteAvailable: true,
    },
    assessments:
      normalAssessment(),
  });

  printCycle(
    1,
    normal,
  );

  if (
    normal.transition.currentMode !==
      "NORMAL" ||
    normal.warning.level !==
      "NORMAL"
  ) {
    throw new Error(
      "Normal runtime cycle failed",
    );
  }

  console.log(
    "NORMAL CYCLE VERIFIED ✅",
  );

  const degraded = runtime.evaluate({
    resources: {
      cpuPercent: 45,
      memoryPercent: 65,
      queueDepth: 30,
      networkHealthy: true,
      remoteAvailable: true,
    },
    assessments:
      degradedAssessment(),
  });

  printCycle(
    2,
    degraded,
  );

  if (
    degraded.transition.currentMode !==
      "WATCH"
  ) {
    throw new Error(
      "Watch runtime cycle failed",
    );
  }

  console.log(
    "WATCH CYCLE VERIFIED ✅",
  );

  const preSurvival = runtime.evaluate({
    resources: {
      cpuPercent: 55,
      memoryPercent: 70,
      queueDepth: 60,
      networkHealthy: false,
      remoteAvailable: true,
    },
    assessments:
      degradedAssessment(),
  });

  printCycle(
    3,
    preSurvival,
  );

  if (
    preSurvival.transition.currentMode !==
      "PRE_SURVIVAL"
  ) {
    throw new Error(
      "Pre-survival runtime cycle failed",
    );
  }

  console.log(
    "PRE-SURVIVAL CYCLE VERIFIED ✅",
  );

  const localSurvival =
    runtime.evaluate({
      resources: {
        cpuPercent: 60,
        memoryPercent: 75,
        queueDepth: 150,
        networkHealthy: false,
        remoteAvailable: false,
      },

      assessments:
        outageAssessment(),
    });

  printCycle(
    4,
    localSurvival,
  );

  if (
    localSurvival.transition.currentMode !==
      "LOCAL_SURVIVAL"
  ) {
    throw new Error(
      "Local survival runtime cycle failed",
    );
  }

  if (
    !localSurvival.resources
      .enableLocalAI ||
    localSurvival.resources
      .enableHeavyAnalysis
  ) {
    throw new Error(
      "Local survival resource policy failed",
    );
  }

  console.log(
    "LOCAL SURVIVAL CYCLE VERIFIED ✅",
  );

  const emergency =
    runtime.evaluate({
      resources: {
        cpuPercent: 92,
        memoryPercent: 95,
        queueDepth: 200,
        networkHealthy: false,
        remoteAvailable: false,
      },

      assessments:
        outageAssessment(),
    });

  printCycle(
    5,
    emergency,
  );

  if (
    emergency.transition.currentMode !==
      "EMERGENCY"
  ) {
    throw new Error(
      "Emergency runtime cycle failed",
    );
  }

  if (
    emergency.resources.enableLocalAI ||
    emergency.resources
      .enableHeavyAnalysis ||
    emergency.resources
      .enableNetworkProbes ||
    emergency.resources
      .maxConcurrentJobs !== 1
  ) {
    throw new Error(
      "Emergency resource policy failed",
    );
  }

  console.log(
    "EMERGENCY CYCLE VERIFIED ✅",
  );

  state = runtime.getState();

  if (
    !state.started ||
    state.cycleCount !== 5 ||
    state.lastEvaluation === null
  ) {
    throw new Error(
      "Runtime state tracking failed",
    );
  }

  console.log(
    "RUNTIME STATE TRACKING VERIFIED ✅",
  );

  runtime.stop();

  state = runtime.getState();

  if (state.started) {
    throw new Error(
      "Runtime stop verification failed",
    );
  }

  console.log(
    "RUNTIME STOP VERIFIED ✅",
  );

  runtime.reset();

  state = runtime.getState();

  if (
    state.started ||
    state.cycleCount !== 0 ||
    state.lastEvaluation !== null ||
    state.updatedAt !== null
  ) {
    throw new Error(
      "Runtime reset verification failed",
    );
  }

  console.log(
    "RUNTIME RESET VERIFIED ✅",
  );

  console.log(
    "RESILIENCE RUNTIME VERIFIED ✅",
  );
}

main();