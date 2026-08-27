import "dotenv/config";

import { prisma } from "./prisma-client";
import { retryFailedSyncQueue } from "./sync-engine";

async function main() {
  const testId = "RETRY-TEST-001";

  try {
    await prisma.syncQueue.deleteMany({
      where: {
        id: testId,
      },
    });

    await prisma.syncQueue.create({
      data: {
        id: testId,
        entity: "RetryTest",
        operation: "CREATE",
        payload: JSON.stringify({
          test: true,
        }),
        status: "FAILED",
        attempts: 1,
        lastError: "Simulated sync failure",
      },
    });

    console.log("FAILED ITEM CREATED ✅");

    const before = await prisma.syncQueue.findUnique({
      where: {
        id: testId,
      },
    });

    console.log("BEFORE RETRY ✅");
    console.log(before);

    const retryResult = await retryFailedSyncQueue();

    console.log("RETRY EXECUTED ✅");
    console.log(retryResult);

    const after = await prisma.syncQueue.findUnique({
      where: {
        id: testId,
      },
    });

    console.log("AFTER RETRY ✅");
    console.log(after);

    if (
      !after ||
      after.status !== "PENDING" ||
      after.lastError !== "Retry scheduled"
    ) {
      throw new Error("FAILED → PENDING retry verification failed");
    }

    console.log("FAILED TO PENDING RETRY VERIFIED ✅");
  } finally {
    await prisma.syncQueue.deleteMany({
      where: {
        id: testId,
      },
    });

    await prisma.$disconnect();

    console.log("RETRY TEST DATA CLEANED ✅");
  }
}

main().catch((error) => {
  console.error("RETRY TEST FAILED ❌");
  console.error(error);
  process.exitCode = 1;
});