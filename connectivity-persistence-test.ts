import {
  collectConnectivitySnapshot,
} from "./core/connectivity/connectivity-snapshot";

import {
  ConnectivityPersistence,
} from "./core/connectivity/connectivity-persistence";

async function main() {
  const startedAt = Date.now();

  const snapshot =
    await collectConnectivitySnapshot();

  console.log("SNAPSHOT:");
  console.log(
    JSON.stringify(
      snapshot,
      null,
      2,
    ),
  );

  const persistence =
    new ConnectivityPersistence();

  const saved =
    await persistence.saveSnapshot(
      snapshot,
    );

  console.log("SAVED INCIDENT:");
  console.log(
    JSON.stringify(
      saved,
      null,
      2,
    ),
  );

  console.log(
    "Persistence test:",
    Date.now() - startedAt,
    "ms",
  );
}

main().catch((error) => {
  console.error(
    "Connectivity persistence test failed:",
    error,
  );

  process.exitCode = 1;
});