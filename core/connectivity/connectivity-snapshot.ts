import {
  ConnectivityRunner,
} from "./connectivity-runner";

import {
  classifyConnectivity,
} from "./connectivity-classifier";

import type {
  ConnectivitySnapshot,
} from "./connectivity-types";

const runner =
  new ConnectivityRunner();

export async function collectConnectivitySnapshot():
  Promise<ConnectivitySnapshot> {
  const result =
    await runner.run();

  return classifyConnectivity(
    result.observations,
  );
}