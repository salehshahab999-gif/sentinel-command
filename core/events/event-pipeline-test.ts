import { processEventPipeline } from "./event-pipeline";

const result = processEventPipeline([
  {
    id: "TEST-EVENT-001",
    timestamp: new Date().toISOString(),
    type: "SYSTEM_TEST",
    source: "Sentinel Test",
    severity: "WARNING",
    status: "NEW",
    description: "Pipeline test event",
    data: {
      test: true,
    },
  },
]);

console.log(JSON.stringify(result, null, 2));