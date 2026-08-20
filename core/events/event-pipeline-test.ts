import "dotenv/config";

import { processEventPipeline } from "./event-pipeline";

async function runPipelineTest() {
  const result = await processEventPipeline([
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
}

runPipelineTest().catch((error) => {
  console.error("Pipeline test failed:", error);
  process.exit(1);
});