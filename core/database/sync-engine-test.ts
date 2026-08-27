import "dotenv/config";

import { prisma } from "./prisma-client";
import { remotePrisma } from "./remote-prisma-client";
import { processSyncQueue } from "./sync-engine";

async function cleanupTestData(
  alertId: string,
  historyId: string,
): Promise<void> {
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

  await prisma.alertHistory.deleteMany({
    where: {
      id: historyId,
    },
  });

  await prisma.alert.deleteMany({
    where: {
      id: alertId,
    },
  });
}

async function main() {
  const eventId = "SYNC-TEST-EVENT-001";
  const alertId = `ALERT-${eventId}`;
  const historyId = `HISTORY-${alertId}`;

  try {
    await cleanupTestData(alertId, historyId);

    console.log("OLD TEST DATA CLEANED ✅");

    const createdAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.alert.create({
        data: {
          id: alertId,
          eventId,
          severity: "WARNING",
          status: "NEW",
          source: "Sync Test",
          type: "SYNC_TEST",
          title: "SYNC_TEST",
          description: "Real remote sync test",
          createdAt,
          resolvedAt: null,
        },
      });

      await tx.alertHistory.create({
        data: {
          id: historyId,
          alertId,
          action: "CREATED",
          severity: "WARNING",
          status: "NEW",
          source: "Sync Test",
          message: "Real remote sync test",
          data: {
            test: true,
          },
        },
      });

      await tx.syncQueue.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            entity: "Alert",
            operation: "CREATE",
            payload: JSON.stringify({
              id: alertId,
              eventId,
              createdAt: createdAt.toISOString(),
              severity: "WARNING",
              status: "NEW",
              source: "Sync Test",
              type: "SYNC_TEST",
              title: "SYNC_TEST",
              description: "Real remote sync test",
              resolvedAt: null,
            }),
          },
          {
            id: crypto.randomUUID(),
            entity: "AlertHistory",
            operation: "CREATE",
            payload: JSON.stringify({
              id: historyId,
              alertId,
              action: "CREATED",
              timestamp: createdAt.toISOString(),
              severity: "WARNING",
              status: "NEW",
              source: "Sync Test",
              message: "Real remote sync test",
              data: {
                test: true,
              },
            }),
          },
        ],
      });
    });

    console.log("LOCAL SYNC TEST DATA CREATED ✅");

    const before = await prisma.syncQueue.findMany({
      where: {
        status: "PENDING",
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
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log("PENDING BEFORE SYNC ✅");
    console.log(before);

    const result = await processSyncQueue();

    console.log("SYNC PROCESS RESULT ✅");
    console.log(result);

    const remoteAlert = await remotePrisma.alert.findUnique({
      where: {
        id: alertId,
      },
    });

    const remoteHistory = await remotePrisma.alertHistory.findUnique({
      where: {
        id: historyId,
      },
    });

    console.log("REMOTE ALERT ✅");
    console.log(remoteAlert);

    console.log("REMOTE HISTORY ✅");
    console.log(remoteHistory);

    const after = await prisma.syncQueue.findMany({
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
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log("QUEUE AFTER SYNC ✅");
    console.log(after);

    if (
      result.completed !== 2 ||
      result.failed !== 0 ||
      result.skipped ||
      !remoteAlert ||
      !remoteHistory
    ) {
      throw new Error(
        "Real remote sync verification failed",
      );
    }

    console.log("REAL REMOTE SYNC VERIFIED ✅");
  } finally {
    await cleanupTestData(alertId, historyId);
    console.log("SYNC TEST DATA CLEANED ✅");

    await remotePrisma.$disconnect();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("SYNC ENGINE TEST FAILED ❌");
  console.error(error);
  process.exitCode = 1;
});