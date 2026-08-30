import {
  ConnectivityStateMachine,
} from "./connectivity-state-machine";

import type {
  ConnectivitySnapshot,
} from "./connectivity-types";

function snapshot(
  state: ConnectivitySnapshot["state"],
): ConnectivitySnapshot {
  return {
    state,
    globalReachabilityPercent:
      state === "NORMAL"
        ? 100
        : state === "GLOBAL_PARTIAL"
          ? 30
          : state === "DOMESTIC_ONLY"
            ? 0
            : 0,

    domesticReachabilityPercent:
      state === "OFFLINE"
        ? 0
        : state === "DOMESTIC_ONLY"
          ? 100
          : 100,

    totalTargets: 4,

    reachableTargets:
      state === "NORMAL"
        ? 4
        : state === "GLOBAL_PARTIAL"
          ? 3
          : state === "DOMESTIC_ONLY"
            ? 2
            : 0,

    observations: [],

    measuredAt:
      new Date().toISOString(),
  };
}

async function main() {
  const machine =
    new ConnectivityStateMachine();

  const states:
    ConnectivitySnapshot["state"][] = [
      "NORMAL",
      "NORMAL",
      "GLOBAL_PARTIAL",
      "DOMESTIC_ONLY",
      "OFFLINE",
      "NORMAL",
    ];

  for (const state of states) {
    const result =
      machine.evaluate(
        snapshot(state),
      );

    console.log(
      JSON.stringify(
        result,
        null,
        2,
      ),
    );
  }
}

main().catch((error) => {
  console.error(
    error,
  );

  process.exitCode = 1;
});