import {
  EarlyWarningEngine,
} from "./early-warning";

import {
  EarlyWarningCorrelator,
} from "./early-warning-correlator";

import {
  ResilienceDecisionEngine,
} from "./resilience-decision-engine";

import {
  ResilienceStateMachine,
} from "./resilience-state";

import {
  decideResourceMode,
  type ResourceSnapshot,
} from "./resource-governor";

import {
  ReachabilityMatrix,
  type ReachabilityAssessment,
} from "./reachability-matrix";

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
      host: `${id}.test`,
      port: 443,
      protocol: "TCP",
      critical,
    },

    current: {
      targetId: id,
      targetName: name,
      host: `${id}.test`,
      port: 443,
      protocol: "TCP",

      tcpStatus: status,
      tlsStatus: status,
      dnsStatus: status,
      httpStatus: status,

      latencyMs:
        latencyChangeMs !== null
          ? 30 + latencyChangeMs
          : null,

      packetLossPercent:
        status === "UP"
          ? 0
          : status === "DEGRADED"
            ? 10
            : 100,

      overallStatus: status,

      measuredAt:
        new Date().toISOString(),
    },

    baseline: {
      target: id,
      host: `${id}.test`,
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

function createMatrix(
  assessments: ReachabilityAssessment[],
): ReachabilityMatrix {
  const matrix =
    new ReachabilityMatrix();

  for (const assessment of assessments) {
    matrix.registerTarget(
      assessment.target,
    );

    matrix.record(
      assessment.current,
    );
  }

  return matrix;
}

function createNormalAssessments(): ReachabilityAssessment[] {
  return [
    createAssessment(
      "TARGET-A",
      "Target A",
      true,
      "UP",
      0,
      5,
    ),

    createAssessment(
      "TARGET-B",
      "Target B",
      false,
      "UP",
      0,
      8,
    ),
  ];
}

function createWatchAssessments(): ReachabilityAssessment[] {
  return [
    createAssessment(
      "TARGET-A",
      "Target A",
      true,
      "DEGRADED",
      20,
      40,
    ),

    createAssessment(
      "TARGET-B",
      "Target B",
      false,
      "UP",
      0,
      10,
    ),
  ];
}

function createPreSurvivalAssessments(): ReachabilityAssessment[] {
  return [
    createAssessment(
      "TARGET-A",
      "Target A",
      true,
      "DEGRADED",
      60,
      150,
    ),

    createAssessment(
      "TARGET-B",
      "Target B",
      true,
      "DEGRADED",
      55,
      130,
    ),

    createAssessment(
      "TARGET-C",
      "Target C",
      false,
      "DEGRADED",
      50,
      120,
    ),
  ];
}

function createLocalSurvivalAssessments(): ReachabilityAssessment[] {
  return [
    createAssessment(
      "TARGET-A",
      "Target A",
      true,
      "DOWN",
      100,
      null,
    ),

    createAssessment(
      "TARGET-B",
      "Target B",
      true,
      "DOWN",
      100,
      null,
    ),

    createAssessment(
      "TARGET-C",
      "Target C",
      false,
      "DOWN",
      100,
      null,
    ),
  ];
}

function createResourceSnapshot(
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

function runDecision(
  assessments: ReachabilityAssessment[],
  resources: ResourceSnapshot,
) {
  const warningEngine =
    new EarlyWarningEngine();

  const correlator =
    new EarlyWarningCorrelator();

  const decisionEngine =
    new ResilienceDecisionEngine();

  const warning =
    warningEngine.evaluate(
      assessments,
    );

  const correlation =
    correlator.correlate(
      warning,
      [],
    );

  const baseResources =
    decideResourceMode(
      resources,
    );

  const decision =
    decisionEngine.decide(
      warning,
      correlation,
      baseResources,
      resources,
    );

  return {
    warning,
    correlation,
    decision,
  };
}

function verify(
  actual: string,
  expected: string,
  label: string,
): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${expected}, got ${actual}`,
    );
  }

  console.log(
    `${label} VERIFIED ✅`,
  );
}

function main(): void {
  console.log(
    "RESILIENCE FAULT INJECTION TEST STARTED 🧪🧠",
  );

  const stateMachine =
    new ResilienceStateMachine();

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 1: NORMAL",
  );

  const normalAssessments =
    createNormalAssessments();

  const normalResources =
    createResourceSnapshot();

  const normal =
    runDecision(
      normalAssessments,
      normalResources,
    );

  console.log({
    warning:
      normal.warning.level,

    warningScore:
      normal.warning.score,

    mode:
      normal.decision.mode,

    riskScore:
      normal.decision.riskScore,
  });

  verify(
    normal.decision.mode,
    "NORMAL",
    "NORMAL MODE",
  );

  stateMachine.transitionTo(
    normal.decision.mode,
    normal.decision.reasons.join("; "),
  );

  console.log(
    "NORMAL FAULT STATE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 2: WATCH",
  );

  const watchAssessments =
    createWatchAssessments();

  const watchResources =
    createResourceSnapshot({
      networkHealthy: true,
      remoteAvailable: true,
    });

  const watch =
    runDecision(
      watchAssessments,
      watchResources,
    );

  console.log({
    warning:
      watch.warning.level,

    warningScore:
      watch.warning.score,

    mode:
      watch.decision.mode,

    riskScore:
      watch.decision.riskScore,
  });

  verify(
    watch.decision.mode,
    "WATCH",
    "WATCH MODE",
  );

  stateMachine.transitionTo(
    watch.decision.mode,
    watch.decision.reasons.join("; "),
  );

  console.log(
    "WATCH FAULT STATE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 3: PRE-SURVIVAL",
  );

  const preSurvivalAssessments =
    createPreSurvivalAssessments();

  const preSurvivalResources =
    createResourceSnapshot({
      cpuPercent: 55,
      memoryPercent: 70,
      queueDepth: 50,
      networkHealthy: false,
      remoteAvailable: true,
    });

  const preSurvival =
    runDecision(
      preSurvivalAssessments,
      preSurvivalResources,
    );

  console.log({
    warning:
      preSurvival.warning.level,

    warningScore:
      preSurvival.warning.score,

    mode:
      preSurvival.decision.mode,

    riskScore:
      preSurvival.decision.riskScore,

    localAI:
      preSurvival.decision
        .enableLocalAI,
  });

  verify(
    preSurvival.decision.mode,
    "PRE_SURVIVAL",
    "PRE-SURVIVAL MODE",
  );

  if (
    !preSurvival.decision
      .enableLocalAI
  ) {
    throw new Error(
      "PRE_SURVIVAL should enable Local AI",
    );
  }

  if (
    preSurvival.decision
      .enableHeavyAnalysis
  ) {
    throw new Error(
      "PRE_SURVIVAL should disable heavy analysis",
    );
  }

  stateMachine.transitionTo(
    preSurvival.decision.mode,
    preSurvival.decision.reasons.join(
      "; ",
    ),
  );

  console.log(
    "PRE-SURVIVAL FAULT STATE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 4: LOCAL SURVIVAL",
  );

  const localSurvivalAssessments =
    createLocalSurvivalAssessments();

  const localSurvivalResources =
    createResourceSnapshot({
      cpuPercent: 60,
      memoryPercent: 75,
      queueDepth: 150,
      networkHealthy: false,
      remoteAvailable: false,
    });

  const localSurvival =
    runDecision(
      localSurvivalAssessments,
      localSurvivalResources,
    );

  console.log({
    warning:
      localSurvival.warning.level,

    warningScore:
      localSurvival.warning.score,

    mode:
      localSurvival.decision.mode,

    riskScore:
      localSurvival.decision.riskScore,

    localAI:
      localSurvival.decision
        .enableLocalAI,

    remoteAvailable:
      localSurvivalResources
        .remoteAvailable,
  });

  verify(
    localSurvival.decision.mode,
    "LOCAL_SURVIVAL",
    "LOCAL SURVIVAL MODE",
  );

  if (
    !localSurvival.decision
      .enableLocalAI
  ) {
    throw new Error(
      "LOCAL_SURVIVAL should enable Local AI",
    );
  }

  if (
    localSurvival.decision
      .enableHeavyAnalysis
  ) {
    throw new Error(
      "LOCAL_SURVIVAL should disable heavy analysis",
    );
  }

  stateMachine.transitionTo(
    localSurvival.decision.mode,
    localSurvival.decision.reasons.join(
      "; ",
    ),
  );

  console.log(
    "LOCAL SURVIVAL FAULT STATE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "SCENARIO 5: EMERGENCY",
  );

  const emergencyResources =
    createResourceSnapshot({
      cpuPercent: 95,
      memoryPercent: 96,
      queueDepth: 250,
      networkHealthy: false,
      remoteAvailable: false,
    });

  const emergency =
    runDecision(
      localSurvivalAssessments,
      emergencyResources,
    );

  console.log({
    warning:
      emergency.warning.level,

    warningScore:
      emergency.warning.score,

    mode:
      emergency.decision.mode,

    riskScore:
      emergency.decision.riskScore,

    localAI:
      emergency.decision
        .enableLocalAI,

    heavyAnalysis:
      emergency.decision
        .enableHeavyAnalysis,

    networkProbes:
      emergency.decision
        .enableNetworkProbes,

    maxConcurrentJobs:
      emergency.decision
        .maxConcurrentJobs,
  });

  verify(
    emergency.decision.mode,
    "EMERGENCY",
    "EMERGENCY MODE",
  );

  if (
    emergency.decision
      .enableLocalAI
  ) {
    throw new Error(
      "EMERGENCY should disable Local AI",
    );
  }

  if (
    emergency.decision
      .enableHeavyAnalysis
  ) {
    throw new Error(
      "EMERGENCY should disable heavy analysis",
    );
  }

  if (
    emergency.decision
      .enableNetworkProbes
  ) {
    throw new Error(
      "EMERGENCY should disable network probes",
    );
  }

  if (
    emergency.decision
      .maxConcurrentJobs !== 1
  ) {
    throw new Error(
      "EMERGENCY should limit concurrency to 1",
    );
  }

  stateMachine.transitionTo(
    emergency.decision.mode,
    emergency.decision.reasons.join(
      "; ",
    ),
  );

  console.log(
    "EMERGENCY FAULT STATE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STATE TRANSITION VERIFICATION",
  );

  const finalState =
    stateMachine.getState();

  console.log(finalState);

  verify(
    finalState.mode,
    "EMERGENCY",
    "FINAL STATE",
  );

  if (
    finalState.previousMode !==
    "LOCAL_SURVIVAL"
  ) {
    throw new Error(
      `Expected previous mode LOCAL_SURVIVAL, got ${finalState.previousMode}`,
    );
  }

  console.log(
    "STATE TRANSITION CHAIN VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "FAULT INJECTION SUMMARY",
  );

  console.log({
    normal:
      normal.decision.mode,

    watch:
      watch.decision.mode,

    preSurvival:
      preSurvival.decision.mode,

    localSurvival:
      localSurvival.decision.mode,

    emergency:
      emergency.decision.mode,
  });

  console.log(
    "RESILIENCE FAULT INJECTION VERIFIED ✅",
  );
}

main();