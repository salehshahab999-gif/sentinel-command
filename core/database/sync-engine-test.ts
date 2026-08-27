import "dotenv/config";

import { prisma } from "./prisma-client";
import { remotePrisma } from "./remote-prisma-client";
import { processSyncQueue } from "./sync-engine";

async function main() {
  const eventId = "IDEMPOTENCY-TEST-EVENT-001";
  const alertId = `ALERT-${eventId}`;
  const historyId = `HISTORY-${alertId}`;

  try {
    await remotePrisma.alertHistory.deleteMany({
      where: {
        alertId,
      },
    });

    await remotePrisma.alert.deleteMany({
      where: {
        id: alertId,
      },
    });

    await prisma.syncQueue.deleteMany({
      where: {
        OR: [
          {
            payload: {
              contains: alertId,
            },
          },
          {
            payload: {
              contains: historyId,
            },
          },
        ],
      },
    });

    const createdAt = new Date();

    const alertPayload = {
      id: alertId,
      eventId,
      createdAt: createdAt.toISOString(),
      severity: "WARNING",
      status: "NEW",
      source: "Idempotency Test",
      type: "IDEMPOTENCY_TEST",
      title: "IDEMPOTENCY_TEST",
      description: "Idempotency verification",
      resolvedAt: null,
    };

    const historyPayload = {
      id: historyId,
      alertId,
      action: "CREATED",
      timestamp: createdAt.toISOString(),
      severity: "WARNING",
      status: "NEW",
      source: "Idempotency Test",
      message: "Idempotency verification",
      data: {
        test: true,
      },
    };

    await prisma.syncQueue.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          entity: "Alert",
          operation: "CREATE",
          payload: JSON.stringify(alertPayload),
        },
        {
          id: crypto.randomUUID(),
          entity: "AlertHistory",
          operation: "CREATE",
          payload: JSON.stringify(historyPayload),
        },
      ],
    });

    console.log("FIRST SYNC QUEUE CREATED ✅");

    const firstSync = await processSyncQueue();

    console.log("FIRST SYNC RESULT ✅");
    console.log(firstSync);

    await prisma.syncQueue.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          entity: "Alert",
          operation: "CREATE",
          payload: JSON.stringify(alertPayload),
        },
        {
          id: crypto.randomUUID(),
          entity: "AlertHistory",
          operation: "CREATE",
          payload: JSON.stringify(historyPayload),
        },
      ],
    });

    console.log("DUPLICATE SYNC QUEUE CREATED ✅");

    const secondSync = await processSyncQueue();

    console.log("SECOND SYNC RESULT ✅");
    console.log(secondSync);

    const remoteAlerts = await remotePrisma.alert.count({
      where: {
        id: alertId,
      },
    });

    const remoteHistories = await remotePrisma.alertHistory.count({
      where: {
        id: historyId,
      },
    });

    console.log("REMOTE COUNTS AFTER SECOND SYNC ✅");
    console.log({
      alerts: remoteAlerts,
      histories: remoteHistories,
    });

    if (
      remoteAlerts !== 1 ||
      remoteHistories !== 1 ||
      firstSync.completed !== 2 ||
      secondSync.completed !== 2
    ) {
      throw new Error("Idempotency verification failed");
    }

    console.log("IDEMPOTENCY VERIFIED ✅");
  } finally {
    await prisma.syncQueue.deleteMany({
      where: {
        OR: [
          {
            payload: {
              contains: alertId,
            },
          },
          {
            payload: {
              contains: historyId,
            },
          },
        ],
      },
    });

    await remotePrisma.alertHistory.deleteMany({
      where: {
        alertId,
      },
    });

    await remotePrisma.alert.deleteMany({
      where: {
        id: alertId,
      },
    });

    await prisma.$disconnect();
    await remotePrisma.$disconnect();

    console.log("IDEMPOTENCY TEST DATA CLEANED ✅");
  }
}

main().catch((error) => {
  console.error("IDEMPOTENCY TEST FAILED ❌");
  console.error(error);
  process.exitCode = 1;
});