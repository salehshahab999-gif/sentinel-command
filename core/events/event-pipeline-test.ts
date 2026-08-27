import "dotenv/config";

import { prisma } from "../database/prisma-client";
import { processEventPipeline } from "./event-pipeline";

async function runPipelineTest() {
  const eventId = "TEST-EVENT-001";
  const alertId = `ALERT-${eventId}`;

  try {
    const result = await processEventPipeline([
      {
        id: eventId,
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

    console.log("PIPELINE TEST ✅");
    console.log(JSON.stringify(result, null, 2));

    const alert = await prisma.alert.findUnique({
      where: {
        id: alertId,
      },
    });

    const history = await prisma.alertHistory.findUnique({
      where: {
        id: `HISTORY-${alertId}`,
      },
    });

    const queue = await prisma.syncQueue.findMany({
      where: {
        entity: "Alert",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    console.log("LOCAL ALERT ✅");
    console.log(alert);

    console.log("ALERT HISTORY ✅");
    console.log(history);

    console.log("SYNC QUEUE ✅");
    console.log(queue);

    await prisma.syncQueue.deleteMany({
      where: {
        entity: "Alert",
        payload: {
          contains: eventId,
        },
      },
    });

    await prisma.alertHistory.deleteMany({
      where: {
        alertId,
      },
    });

    await prisma.alert.deleteMany({
      where: {
        id: alertId,
      },
    });

    console.log("PIPELINE TEST DATA CLEANED ✅");
  } catch (error) {
    console.error("Pipeline test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPipelineTest();