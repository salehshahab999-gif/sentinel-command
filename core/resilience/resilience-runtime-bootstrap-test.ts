import {
  ResilienceRuntimeBootstrap,
} from "./resilience-runtime-bootstrap";

import type {
  NetworkIncident,
  IncidentSignal,
} from "./incident-memory";

import type {
  ReachabilityTarget,
} from "./reachability-matrix";

import type {
  ResourceSnapshot,
} from "./resource-governor";

function createHistoricalIncident(): NetworkIncident {
  const now = new Date().toISOString();

  const signals: IncidentSignal[] = [
    {
      name: "GLOBAL_REACHABILITY",
      value: 100,
      source: "Bootstrap Runtime Test",
      observedAt: now,
      confidence: 0.9,
    },

    {
      name: "DNS_FAILURE",
      value: 0,
      source: "Bootstrap Runtime Test",
      observedAt: now,
      confidence: 0.9,
    },

    {
      name: "TCP_FAILURE",
      value: 0,
      source: "Bootstrap Runtime Test",
      observedAt: now,
      confidence: 0.9,
    },

    {
      name: "AVERAGE_LATENCY_CHANGE",
      value: 0,
      source: "Bootstrap Runtime Test",
      observedAt: now,
      confidence: 0.85,
    },
  ];

  return {
    id: "INC-RUNTIME-BOOTSTRAP-001",
    name: "Runtime Bootstrap Historical Test",

    startedAt: now,
    endedAt: now,

    phase: "RESOLVED",
    severity: "HIGH",

    globalReachabilityPercent: 100,
    domesticReachabilityPercent: 100,

    affectedTargets: 0,
    criticalFailures: 0,

    signals,

    notes: [
      "Synthetic runtime bootstrap test",
    ],
  };
}

function createTargets(): ReachabilityTarget[] {
  return [
    {
      id: "CLOUDFLARE-443",
      name: "Cloudflare HTTPS",
      host: "1.1.1.1",
      port: 443,
      protocol: "TCP",
      critical: true,
    },

    {
      id: "GITHUB-443",
      name: "GitHub HTTPS",
      host: "github.com",
      port: 443,
      protocol: "TCP",
      critical: true,
    },
  ];
}

function createResources(): ResourceSnapshot {
  return {
    cpuPercent: 20,
    memoryPercent: 45,
    queueDepth: 0,
    networkHealthy: true,
    remoteAvailable: true,
  };
}

async function main(): Promise<void> {
  const runtime =
    new ResilienceRuntimeBootstrap();

  const historicalIncident =
    createHistoricalIncident();

  console.log(
    "RESILIENCE RUNTIME BOOTSTRAP TEST STARTED 🧠🌐",
  );

  console.log(
    "STEP 1: SEED HISTORICAL INCIDENT",
  );

  await runtime
    .getPersistence()
    .save(
      historicalIncident,
    );

  console.log(
    "HISTORICAL INCIDENT SEEDED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 2: START RUNTIME",
  );

  const result =
    await runtime.start(
      createTargets(),
      createResources(),
    );

  console.log(
    "BOOTSTRAP RESULT:",
  );

  console.log(
    result.bootstrap,
  );

  console.log(
    "LIVE CYCLE RESULT:",
  );

  console.log(
    result.cycle,
  );

  if (
    result.runtimeStarted !== true
  ) {
    throw new Error(
      "Runtime did not report started state",
    );
  }

  console.log(
    "RUNTIME START STATE VERIFIED ✅",
  );

  if (
    result.bootstrap.loadedIncidents <
    1
  ) {
    throw new Error(
      "Historical incident was not loaded during bootstrap",
    );
  }

  if (
    result.bootstrap.memoryReady !==
    true
  ) {
    throw new Error(
      "Bootstrap memory is not ready",
    );
  }

  console.log(
    "HISTORICAL MEMORY RESTORE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 3: VERIFY LIVE REACHABILITY",
  );

  if (
    result.cycle.assessmentsCount !==
    2
  ) {
    throw new Error(
      `Expected 2 live assessments, got ${result.cycle.assessmentsCount}`,
    );
  }

  if (
    result.cycle.criticalFailures !==
    0
  ) {
    throw new Error(
      "Unexpected critical failure during healthy runtime test",
    );
  }

  console.log(
    "LIVE REACHABILITY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 4: VERIFY HISTORICAL CORRELATION",
  );

  if (
    result.cycle.historicalMatches <
    1
  ) {
    throw new Error(
      "Expected at least one historical match",
    );
  }

  if (
    !result.cycle
      .historicalPatternMatched
  ) {
    throw new Error(
      "Historical pattern was not propagated into runtime",
    );
  }

  console.log(
    "HISTORICAL CORRELATION VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 5: VERIFY DECISION ENGINE",
  );

  if (
    result.cycle.warningLevel !==
    "NORMAL"
  ) {
    throw new Error(
      `Expected NORMAL warning, got ${result.cycle.warningLevel}`,
    );
  }

  if (
    result.cycle.decision.mode !==
    "WATCH"
  ) {
    throw new Error(
      `Expected WATCH mode with historical match, got ${result.cycle.decision.mode}`,
    );
  }

  if (
    result.cycle.decision.riskScore <
    25
  ) {
    throw new Error(
      `Expected historical correlation to raise risk, got ${result.cycle.decision.riskScore}`,
    );
  }

  if (
    result.cycle.decision
      .enableHeavyAnalysis
  ) {
    throw new Error(
      "Heavy analysis should be disabled in WATCH mode",
    );
  }

  if (
    result.cycle.decision
      .enableLocalAI
  ) {
    throw new Error(
      "Local AI should remain disabled in WATCH mode",
    );
  }

  if (
    !result.cycle.decision
      .enableNetworkProbes
  ) {
    throw new Error(
      "Network probes should remain enabled in WATCH mode",
    );
  }

  console.log(
    "HISTORICAL WATCH DECISION VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 6: VERIFY MEMORY INSTANCE",
  );

  const memory =
    runtime.getMemory();

  const restored =
    memory.getIncident(
      historicalIncident.id,
    );

  if (!restored) {
    throw new Error(
      "Historical incident is missing from runtime memory",
    );
  }

  if (
    restored.id !==
      historicalIncident.id ||
    restored.name !==
      historicalIncident.name
  ) {
    throw new Error(
      "Restored runtime memory does not match seeded incident",
    );
  }

  console.log(
    "RUNTIME MEMORY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 7: VERIFY MATRIX STATE",
  );

  const records =
    runtime
      .getMatrix()
      .getAllRecords();

  if (
    records.length !== 2
  ) {
    throw new Error(
      `Expected 2 matrix records, got ${records.length}`,
    );
  }

  console.log(
    "RUNTIME MATRIX VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 8: STOP RUNTIME",
  );

  runtime.stop();

  if (
    runtime.isStarted()
  ) {
    throw new Error(
      "Runtime did not stop",
    );
  }

  console.log(
    "RUNTIME STOP VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 9: CLEANUP TEST INCIDENT",
  );

  await runtime
    .getPersistence()
    .delete(
      historicalIncident.id,
    );

  const remaining =
    await runtime
      .getPersistence()
      .loadAll();

  if (
    remaining.some(
      (incident) =>
        incident.id ===
        historicalIncident.id,
    )
  ) {
    throw new Error(
      "Runtime bootstrap test incident was not deleted",
    );
  }

  console.log(
    "RUNTIME TEST CLEANUP VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "RESILIENCE RUNTIME BOOTSTRAP VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "RESILIENCE RUNTIME BOOTSTRAP TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);