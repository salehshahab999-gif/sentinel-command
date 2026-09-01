import { runPnt } from "./pnt-runner";

async function main() {
  const observations = await runPnt();
  const observation = observations[0];

  console.log("PNT RUNNER TEST:");
  console.log(JSON.stringify(observations, null, 2));

  if (
    !observation ||
    observation.sourceId !== "WINDOWS_LOCATION" ||
    observation.sourceKind !== "WINDOWS" ||
    observation.position === null
  ) {
    throw new Error("PNT runner test failed: unexpected Windows Location observation.");
  }

  console.log("PNT RUNNER TEST: PASS");
}

main().catch((error) => {
  console.error("PNT RUNNER TEST: FAIL");
  console.error(error);
  process.exitCode = 1;
});
