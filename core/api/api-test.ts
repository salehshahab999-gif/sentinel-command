import { writeApiLog } from "./api-log";

async function testApiLog() {
  await writeApiLog(
    "GET",
    "/api/status",
    "200 OK"
  );

  console.log("API log test completed");
}

testApiLog();