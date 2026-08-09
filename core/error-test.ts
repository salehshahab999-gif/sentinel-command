import { writeErrorLog } from "./errors";

async function testErrorLog() {
  await writeErrorLog("Test error message", "error-test");

  console.log("Error log test completed");
}

testErrorLog();
