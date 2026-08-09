import { SentinelEvent } from "./Event";
import { writeEventLog } from "./event-logger";

async function testEvent() {
  const event: SentinelEvent = {
    id: "test-001",
    timestamp: new Date().toISOString(),
    type: "TEST_EVENT",
    source: "event-test",
    severity: "INFO",
    status: "NEW",
    description: "Sentinel Event System Test",
  };

  await writeEventLog(event);

  console.log("Event test completed");
}

testEvent();
