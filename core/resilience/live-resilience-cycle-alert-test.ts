import {
  LiveResilienceCycle,
} from "./live-resilience-cycle";

import {
  IncidentMemory,
  type NetworkIncident,
  type IncidentSignal,
} from "./incident-memory";

import {
  IncidentPersistence,
} from "./incident-persistence";

import {
  ReachabilityMatrix,
  type ReachabilityTarget,
} from "./reachability-matrix";

import {
  NetworkBaselineTracker,
} from "./network-baseline";

import type {
  ResourceSnapshot,
} from "./resource-governor";

import {
  prisma,
} from "../database/prisma-client";

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

function createHistoricalIncident(): NetworkIncident {
  const now =
    new Date().toISOString();

  const signals: IncidentSignal[] = [
    {
      name: "GLOBAL_REACHABILITY",
      value: 100,
      source: "Live Cycle Alert Test",
      observedAt: now,
      confidence: 0.95,
    },

    {
      name: "DNS_FAILURE",
      value: 0,
      source: "Live Cycle Alert Test",
      observedAt: now,
      confidence: 0.95,
    },

    {
      name: "TLS_FAILURE",
      value: 0,
      source: "Live Cycle Alert Test",
      observedAt: now,
      confidence: 0.95,
    },

    {
      name: "TCP_FAILURE",
      value: 0,
      source: "Live Cycle Alert Test",
      observedAt: now,
      confidence: 0.95,
    },

    {
      name: "AVERAGE_LATENCY_CHANGE",
      value: 0,
      source: "Live Cycle Alert Test",
      observedAt: now,
      confidence: 0.9,
    },
  ];

  return {
    id:
      "INC-LIVE-CYCLE-ALERT-TEST-001",

    name:
      "Live Cycle Alert Integration Test",

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
      "Synthetic live cycle alert test",
    ],
  };
}

async function cleanupAlerts(): Promise<void> {
  const types = [
    "RESILIENCE_NORMAL",
    "RESILIENCE_WATCH",
    "RESILIENCE_PRE_SURVIVAL",
    "RESILIENCE_LOCAL_SURVIVAL",
    "RESILIENCE_EMERGENCY",
  ];

  for (const type of types) {
    const alerts =
      await prisma.alert.findMany({
        where: {
          source: "CORE",
          type,
        },
        select: {
          id: true,
        },
      });

    for (const alert of alerts) {
      await prisma.alertHistory.deleteMany({
        where: {
          alertId: alert.id,
        },
      });

      await prisma.alert.delete({
        where: {
          id: alert.id,
        },
      });
    }
  }
}

async function main(): Promise<void> {
  const cycle =
    new LiveResilienceCycle();

  const memory =
    new IncidentMemory();

  const persistence =
    new IncidentPersistence();

  const matrix =
    new ReachabilityMatrix();

  const baselineTracker =
    new NetworkBaselineTracker();

  const incident =
    createHistoricalIncident();

  const targets =
    createTargets();

  const resources =
    createResources();

  console.log(
    "LIVE RESILIENCE CYCLE ALERT TEST STARTED 🚨🧠",
  );

  console.log(
    "STEP 0: CLEAN PREVIOUS RESILIENCE ALERTS",
  );

  await cleanupAlerts();

  console.log(
    "PREVIOUS RESILIENCE ALERTS CLEANED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 1: SEED HISTORICAL INCIDENT",
  );

  await persistence.save(
    incident,
  );

  const loaded =
    await persistence.loadIntoMemory(
      memory,
    );

  if (
    loaded < 1
  ) {
    throw new Error(
      "Historical incident was not loaded",
    );
  }

  console.log(
    "HISTORICAL INCIDENT READY ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 2: RUN LIVE CYCLE WITH HISTORICAL MEMORY",
  );

  const watchResult =
    await cycle.run(
      targets,
      resources,
      memory,
      baselineTracker,
      matrix,
    );

  console.log(
    "WATCH CYCLE RESULT:",
  );

  console.log(
    watchResult,
  );

  if (
    watchResult.historicalPatternMatched !==
    true
  ) {
    throw new Error(
      "Expected historical pattern match",
    );
  }

  console.log(
    "HISTORICAL MATCH VERIFIED ✅",
  );

  if (
    watchResult.decision.mode !==
    "WATCH"
  ) {
    throw new Error(
      `Expected WATCH mode, got ${watchResult.decision.mode}`,
    );
  }

  console.log(
    "WATCH DECISION VERIFIED ✅",
  );

  if (
    watchResult.alertPublished !==
    true
  ) {
    throw new Error(
      "Expected Resilience alert to be published",
    );
  }

  if (
    !watchResult.alertId
  ) {
    throw new Error(
      "Expected alert ID from live cycle",
    );
  }

  console.log(
    "LIVE CYCLE ALERT PUBLICATION VERIFIED ✅",
  );

  const watchAlert =
    await prisma.alert.findUnique({
      where: {
        id:
          watchResult.alertId,
      },
      include: {
        history: true,
      },
    });

  if (!watchAlert) {
    throw new Error(
      "WATCH alert was not persisted",
    );
  }

  if (
    watchAlert.source !==
    "CORE"
  ) {
    throw new Error(
      "WATCH alert source mismatch",
    );
  }

  if (
    watchAlert.type !==
    "RESILIENCE_WATCH"
  ) {
    throw new Error(
      "WATCH alert type mismatch",
    );
  }

  if (
    watchAlert.severity !==
    "WARNING"
  ) {
    throw new Error(
      `Expected WARNING severity, got ${watchAlert.severity}`,
    );
  }

  if (
    watchAlert.status !==
    "NEW"
  ) {
    throw new Error(
      `Expected NEW alert status, got ${watchAlert.status}`,
    );
  }

  if (
    watchAlert.history.length <
    1
  ) {
    throw new Error(
      "WATCH alert history was not created",
    );
  }

  console.log(
    "WATCH ALERT PERSISTENCE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 3: CLEAR HISTORICAL MEMORY",
  );

  memory.clear();

  if (
    memory.summarize()
      .totalIncidents !== 0
  ) {
    throw new Error(
      "Historical memory did not clear",
    );
  }

  console.log(
    "HISTORICAL MEMORY CLEARED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 4: RUN LIVE CYCLE WITHOUT HISTORICAL MATCH",
  );

  const normalResult =
    await cycle.run(
      targets,
      resources,
      memory,
      baselineTracker,
      matrix,
    );

  console.log(
    "NORMAL CYCLE RESULT:",
  );

  console.log(
    normalResult,
  );

  if (
    normalResult.historicalPatternMatched
  ) {
    throw new Error(
      "Historical pattern should not match after memory clear",
    );
  }

  if (
    normalResult.historicalMatches !==
    0
  ) {
    throw new Error(
      `Expected 0 historical matches, got ${normalResult.historicalMatches}`,
    );
  }

  console.log(
    "NO HISTORICAL MATCH VERIFIED ✅",
  );

  if (
    normalResult.decision.mode !==
    "NORMAL"
  ) {
    throw new Error(
      `Expected NORMAL mode, got ${normalResult.decision.mode}`,
    );
  }

  console.log(
    "NORMAL DECISION VERIFIED ✅",
  );

  if (
    normalResult.alertPublished
  ) {
    throw new Error(
      "NORMAL cycle should not publish a new alert",
    );
  }

  if (
    normalResult.alertId !==
    null
  ) {
    throw new Error(
      "NORMAL cycle should not return an alert ID",
    );
  }

  console.log(
    "NORMAL ALERT SUPPRESSION VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 5: VERIFY WATCH ALERT RESOLUTION",
  );

  const resolvedWatchAlert =
    await prisma.alert.findUnique({
      where: {
        id:
          watchResult.alertId!,
      },
      include: {
        history: true,
      },
    });

  if (!resolvedWatchAlert) {
    throw new Error(
      "WATCH alert disappeared unexpectedly",
    );
  }

  if (
    resolvedWatchAlert.status !==
    "RESOLVED"
  ) {
    throw new Error(
      `Expected WATCH alert to be RESOLVED, got ${resolvedWatchAlert.status}`,
    );
  }

  if (
    resolvedWatchAlert.resolvedAt ===
    null
  ) {
    throw new Error(
      "WATCH alert resolvedAt was not populated",
    );
  }

  const resolutionHistory =
    resolvedWatchAlert.history.find(
      (item) =>
        item.action ===
        "RESOLVED",
    );

  if (!resolutionHistory) {
    throw new Error(
      "WATCH alert resolution history was not created",
    );
  }

  console.log(
    "WATCH ALERT RESOLUTION VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 6: CLEANUP TEST INCIDENT",
  );

  await persistence.delete(
    incident.id,
  );

  const remainingIncidents =
    await persistence.loadAll();

  if (
    remainingIncidents.some(
      (item) =>
        item.id ===
        incident.id,
    )
  ) {
    throw new Error(
      "Test incident cleanup failed",
    );
  }

  console.log(
    "TEST INCIDENT CLEANUP VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 7: FINAL ALERT CLEANUP",
  );

  await cleanupAlerts();

  console.log(
    "FINAL ALERT CLEANUP VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "LIVE RESILIENCE CYCLE ALERT INTEGRATION VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "LIVE RESILIENCE CYCLE ALERT TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);