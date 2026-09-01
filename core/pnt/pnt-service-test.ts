import { PntService } from "./pnt-service";

async function main() {
  const service = new PntService();
  const result = await service.runOnce();

  console.log("PNT SERVICE TEST:");
  console.log(JSON.stringify(result, null, 2));

  if (result.observations.length === 0) {
    throw new Error("PNT service returned no observations.");
  }

  if (result.decision.mode !== "LIVE" && result.decision.mode !== "LAST_KNOWN") {
    throw new Error("PNT service returned an unexpected decision mode.");
  }

  console.log("PNT SERVICE TEST: PASS");
}

main().catch((error) => {
  console.error("PNT SERVICE TEST: FAIL");
  console.error(error);
  process.exitCode = 1;
});
