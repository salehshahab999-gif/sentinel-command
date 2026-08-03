import { writeSecurityLog } from "./security-log";

async function testSecurityLog() {
  await writeSecurityLog(
    "LOGIN_ATTEMPT",
    "test-user",
    "SUCCESS"
  );

  console.log("Security log test completed");
}

testSecurityLog();