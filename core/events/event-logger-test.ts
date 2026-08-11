import { writeEventLog } from "./event-logger";

async function test() {
  await writeEventLog({
    id: "event-test-001",
    timestamp: new Date().toISOString(),
    type: "LOGGER_TEST",
    source: "event-logger-test",
    severity: "INFO",
    status: "NEW",
    description: "Sentinel Event Logger Test OK",
  });
}

test();