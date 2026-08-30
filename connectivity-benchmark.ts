import {
  collectConnectivitySnapshot,
} from "./core/connectivity/connectivity-snapshot";

async function main() {
  const startedAt = Date.now();

  const snapshot =
    await collectConnectivitySnapshot();

  console.log(
    JSON.stringify(
      snapshot,
      null,
      2,
    ),
  );

  console.log(
    "Connectivity benchmark:",
    Date.now() - startedAt,
    "ms",
  );
}

main().catch((error) => {
  console.error(
    "Connectivity benchmark failed:",
    error,
  );

  process.exitCode = 1;
});