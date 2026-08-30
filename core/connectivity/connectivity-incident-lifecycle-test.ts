import {
  ConnectivityIncidentLifecycle,
} from "./connectivity-incident-lifecycle";

import type {
  ConnectivitySnapshot,
} from "./connectivity-types";

function createSnapshot(
  state: ConnectivitySnapshot["state"],
  measuredAt: string,
): ConnectivitySnapshot {
  const values = {
    NORMAL: {
      global: 100,
      domestic: 100,
      reachable: 4,
    },

    GLOBAL_PARTIAL: {
      global: 25,
      domestic: 100,
      reachable: 3,
    },

    DOMESTIC_ONLY: {
      global: 0,
      domestic: 100,
      reachable: 2,
    },

    OFFLINE: {
      global: 0,
      domestic: 0,
      reachable: 0,
    },

    UNKNOWN: {
      global: 0,
      domestic: 0,
      reachable: 0,
    },
  }[state];

  return {
    state,

    globalReachabilityPercent:
      values.global,

    domesticReachabilityPercent:
      values.domestic,

    totalTargets: 4,

    reachableTargets:
      values.reachable,

    observations: [],

    measuredAt,
  };
}

async function main() {
  const lifecycle =
    new ConnectivityIncidentLifecycle();

  const states:
    ConnectivitySnapshot["state"][] = [
      "NORMAL",
      "GLOBAL_PARTIAL",
      "DOMESTIC_ONLY",
      "OFFLINE",
      "NORMAL",
    ];

  let index = 0;

  for (const state of states) {
    index += 1;

    const snapshot =
      createSnapshot(
        state,
        new Date(
          Date.now() + index * 1000,
        ).toISOString(),
      );

    const result =
      await lifecycle.applySnapshot(
        snapshot,
      );

    console.log(
      `STATE ${index}: ${state}`,
    );

    console.log(
      JSON.stringify(
        result,
        null,
        2,
      ),
    );
  }

  console.log(
    "FINAL ACTIVE INCIDENT:",
  );

  console.log(
    JSON.stringify(
      lifecycle.getActiveIncident(),
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    "Lifecycle test failed:",
    error,
  );

  process.exitCode = 1;
});