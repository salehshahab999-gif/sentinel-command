import { writeSecurityLog } from "./security-log";

async function test() {
  await writeSecurityLog(
    "LOGIN",
    "sentinel-test",
    "SUCCESS",
    {
      level: "TEST",
      event: "SECURITY_LOGGER_TEST",
      details: {
        test: true,
        message: "Sentinel Security Logger Test OK",
      },
    },
  );
}

test();