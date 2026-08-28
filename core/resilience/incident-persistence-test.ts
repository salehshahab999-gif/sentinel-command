import {
  IncidentPersistence,
} from "./incident-persistence";

import {
  IncidentMemory,
  type NetworkIncident,
} from "./incident-memory";

function createTestIncident(): NetworkIncident {
  const now = new Date().toISOString();

  return {
    id: "INC-PERSISTENCE-TEST-001",
    name: "Persistence Integration Test",

    startedAt: now,
    endedAt: now,

    phase: "RESOLVED",
    severity: "HIGH",

    globalReachabilityPercent: 25,
    domesticReachabilityPercent: 90,

    affectedTargets: 3,
    criticalFailures: 1,

    signals: [
      {
        name: "GLOBAL_REACHABILITY",
        value: 25,
        source: "Persistence Test",
        observedAt: now,
        confidence: 0.95,
      },

      {
        name: "DNS_FAILURE",
        value: 75,
        source: "Persistence Test",
        observedAt: now,
        confidence: 0.9,
      },

      {
        name: "TLS_FAILURE",
        value: 70,
        source: "Persistence Test",
        observedAt: now,
        confidence: 0.9,
      },

      {
        name: "TCP_FAILURE",
        value: 65,
        source: "Persistence Test",
        observedAt: now,
        confidence: 0.9,
      },

      {
        name: "AVERAGE_LATENCY_CHANGE",
        value: 120,
        source: "Persistence Test",
        observedAt: now,
        confidence: 0.85,
      },
    ],

    notes: [
      "Local SQLite persistence test",
      "Safe synthetic test data",
    ],
  };
}

async function main(): Promise<void> {
  const persistence =
    new IncidentPersistence();

  const memory =
    new IncidentMemory();

  const incident =
    createTestIncident();

  console.log(
    "INCIDENT PERSISTENCE TEST STARTED 💾",
  );

  console.log(
    "STEP 1: SAVING INCIDENT",
  );

  const saved =
    await persistence.save(
      incident,
    );

  console.log(saved);

  if (
    saved.id !== incident.id ||
    saved.name !== incident.name ||
    saved.severity !== incident.severity
  ) {
    throw new Error(
      "Saved incident verification failed",
    );
  }

  if (
    saved.signals.length !==
    incident.signals.length
  ) {
    throw new Error(
      "Saved signal count mismatch",
    );
  }

  console.log(
    "INCIDENT SAVE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 2: LOADING FROM SQLITE",
  );

  const loaded =
    await persistence.loadAll();

  console.log(
    `LOADED INCIDENTS: ${loaded.length}`,
  );

  const loadedIncident =
    loaded.find(
      (item) =>
        item.id === incident.id,
    );

  if (!loadedIncident) {
    throw new Error(
      "Persisted incident was not found after loading",
    );
  }

  console.log(
    "LOADED INCIDENT:",
  );

  console.log(
    loadedIncident,
  );

  if (
    loadedIncident.id !== incident.id ||
    loadedIncident.name !== incident.name ||
    loadedIncident.phase !== incident.phase ||
    loadedIncident.severity !==
      incident.severity
  ) {
    throw new Error(
      "Loaded incident field verification failed",
    );
  }

  if (
    loadedIncident.signals.length !==
    incident.signals.length
  ) {
    throw new Error(
      "Loaded signal count mismatch",
    );
  }

  if (
    loadedIncident.notes.length !==
    incident.notes.length
  ) {
    throw new Error(
      "Loaded notes count mismatch",
    );
  }

  console.log(
    "SQLITE LOAD VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 3: RELOADING INCIDENT MEMORY",
  );

  memory.clear();

  const loadedCount =
    await persistence.loadIntoMemory(
      memory,
    );

  console.log(
    `MEMORY INCIDENTS LOADED: ${loadedCount}`,
  );

  if (
    loadedCount < 1
  ) {
    throw new Error(
      "No incidents loaded into memory",
    );
  }

  const memoryIncident =
    memory.getIncident(
      incident.id,
    );

  if (!memoryIncident) {
    throw new Error(
      "Incident was not restored into memory",
    );
  }

  console.log(
    "MEMORY INCIDENT RESTORED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 4: PATTERN MATCH AFTER RELOAD",
  );

  const currentSignals =
    incident.signals.map(
      (signal) => ({
        ...signal,
        source: "Current Runtime",
        observedAt:
          new Date().toISOString(),
      }),
    );

  const matches =
    memory.matchPattern(
      currentSignals,
    );

  console.log(
    "PATTERN MATCHES:",
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
      "Persisted incident did not participate in pattern matching",
    );
  }

  if (
    match.similarityScore < 90 ||
    match.confidence < 0.8
  ) {
    throw new Error(
      `Unexpected match quality: similarity=${match.similarityScore}, confidence=${match.confidence}`,
    );
  }

  console.log(
    "PERSISTED PATTERN MATCH VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 5: MEMORY SUMMARY",
  );

  const summary =
    memory.summarize();

  console.log(summary);

  if (
    summary.totalIncidents < 1
  ) {
    throw new Error(
      "Memory summary contains no incidents",
    );
  }

  console.log(
    "MEMORY SUMMARY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 6: UPDATE EXISTING INCIDENT",
  );

  const updatedIncident: NetworkIncident =
    {
      ...incident,
      name:
        "Persistence Integration Test Updated",
      severity: "CRITICAL",
      notes: [
        ...incident.notes,
        "Update verification",
      ],
    };

  const updated =
    await persistence.save(
      updatedIncident,
    );

  if (
    updated.name !==
      updatedIncident.name ||
    updated.severity !==
      updatedIncident.severity ||
    !updated.notes.includes(
      "Update verification",
    )
  ) {
    throw new Error(
      "Incident update verification failed",
    );
  }

  console.log(
    "INCIDENT UPDATE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP 7: DELETE TEST INCIDENT",
  );

  await persistence.delete(
    incident.id,
  );

  const afterDelete =
    await persistence.loadAll();

  const deleted =
    afterDelete.some(
      (item) =>
        item.id === incident.id,
    );

  if (deleted) {
    throw new Error(
      "Test incident was not deleted",
    );
  }

  console.log(
    "TEST INCIDENT DELETE VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "INCIDENT PERSISTENCE VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "INCIDENT PERSISTENCE TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);