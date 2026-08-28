import {
  ResilienceBootstrap,
} from "./resilience-bootstrap";

import {
  IncidentMemory,
} from "./incident-memory";

import {
  IncidentPersistence,
} from "./incident-persistence";

import type {
  NetworkIncident,
} from "./incident-memory";

function createTestIncident(): NetworkIncident {
  const now = new Date().toISOString();

  return {
    id: "INC-BOOTSTRAP-TEST-001",
    name: "Bootstrap Persistence Test",

    startedAt: now,
    endedAt: now,

    phase: "RESOLVED",
    severity: "HIGH",

    globalReachabilityPercent: 40,
    domesticReachabilityPercent: 85,

    affectedTargets: 2,
    criticalFailures: 1,

    signals: [
      {
        name: "GLOBAL_REACHABILITY",
        value: 40,
        source: "Bootstrap Test",
        observedAt: now,
        confidence: 0.9,
      },

      {
        name: "DNS_FAILURE",
        value: 60,
        source: "Bootstrap Test",
        observedAt: now,
        confidence: 0.9,
      },

      {
        name: "TCP_FAILURE",
        value: 50,
        source: "Bootstrap Test",
        observedAt: now,
        confidence: 0.9,
      },
    ],

    notes: [
      "Synthetic bootstrap test",
    ],
  };
}

async function main(): Promise<void> {
  const persistence =
    new IncidentPersistence();

  const seedMemory =
    new IncidentMemory();

  const incident =
    createTestIncident();

  console.log(
    "RESILIENCE BOOTSTRAP TEST STARTED 🧠💾",
  );

  console.log(
    "STEP 1: SEED INCIDENT INTO SQLITE",
  );

  await persistence.save(
    incident,
  );

  console.log(
    "INCIDENT SEEDED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 2: CREATE EMPTY MEMORY",
  );

  if (
    seedMemory.getAllIncidents()
      .length !== 0
  ) {
    throw new Error(
      "Expected empty seed memory",
    );
  }

  console.log(
    "EMPTY MEMORY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 3: BOOTSTRAP INITIALIZATION",
  );

  const bootstrap =
    new ResilienceBootstrap(
      seedMemory,
      persistence,
    );

  const result =
    await bootstrap.initialize();

  console.log(result);

  if (
    result.memoryReady !== true
  ) {
    throw new Error(
      "Bootstrap memory is not ready",
    );
  }

  if (
    result.loadedIncidents < 1
  ) {
    throw new Error(
      "Bootstrap did not load persisted incidents",
    );
  }

  console.log(
    "BOOTSTRAP INITIALIZATION VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 4: VERIFY RESTORED MEMORY",
  );

  const restoredMemory =
    bootstrap.getMemory();

  const restoredIncident =
    restoredMemory.getIncident(
      incident.id,
    );

  if (!restoredIncident) {
    throw new Error(
      "Persisted incident was not restored into memory",
    );
  }

  if (
    restoredIncident.name !==
      incident.name ||
    restoredIncident.severity !==
      incident.severity
  ) {
    throw new Error(
      "Restored incident fields do not match",
    );
  }

  console.log(
    "RESTORED INCIDENT VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 5: VERIFY HISTORICAL MATCH",
  );

  const matches =
    restoredMemory.matchPattern(
      incident.signals.map(
        (signal) => ({
          ...signal,
          source: "Current Runtime",
          observedAt:
            new Date().toISOString(),
        }),
      ),
    );

  console.log(
    matches,
  );

  const match =
    matches.find(
      (item) =>
        item.incidentId ===
        incident.id,
    );

  if (!match) {
    throw new Error(
      "Restored incident did not match current signals",
    );
  }

  if (
    match.similarityScore < 90
  ) {
    throw new Error(
      `Unexpected historical similarity: ${match.similarityScore}`,
    );
  }

  console.log(
    "BOOTSTRAP HISTORICAL MATCH VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 6: VERIFY ACCESSORS",
  );

  const exposedMemory =
    bootstrap.getMemory();

  const exposedPersistence =
    bootstrap.getPersistence();

  if (
    exposedMemory !==
    restoredMemory
  ) {
    throw new Error(
      "Bootstrap memory accessor returned wrong instance",
    );
  }

  if (
    exposedPersistence !==
    persistence
  ) {
    throw new Error(
      "Bootstrap persistence accessor returned wrong instance",
    );
  }

  console.log(
    "BOOTSTRAP ACCESSORS VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 7: CLEANUP TEST INCIDENT",
  );

  await persistence.delete(
    incident.id,
  );

  const remaining =
    await persistence.loadAll();

  if (
    remaining.some(
      (item) =>
        item.id === incident.id,
    )
  ) {
    throw new Error(
      "Bootstrap test incident was not deleted",
    );
  }

  console.log(
    "BOOTSTRAP TEST CLEANUP VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "RESILIENCE BOOTSTRAP VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "RESILIENCE BOOTSTRAP TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);