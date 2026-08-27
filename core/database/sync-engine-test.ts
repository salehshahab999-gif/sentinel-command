import "dotenv/config";

import { prisma } from "./prisma-client";
import { recoverStaleSyncQueue } from "./sync-engine";

async function main() {
  const testId = "RECOVERY-TEST-001";

  try {
    await prisma.syncQueue.deleteMany({
      where: {
        id: testId,
      },
    });

    const staleTime = new Date(Date.now() - 10 * 60 * 1000);

    await prisma.syncQueue.create({
      data: {
        id: testId,
        entity: "RecoveryTest",
        operation: "CREATE",
        payload: JSON.stringify({
          test: true,
        }),
        status: "PROCESSING",
        attempts: 1,
        lastError: null,
        createdAt: staleTime,
        updatedAt: staleTime,
      },
    });

    console.log("STALE PROCESSING ITEM CREATED ✅");

    const before = await prisma.syncQueue.findUnique({
      where: {
        id: testId,
      },
    });

    console.log("BEFORE RECOVERY ✅");
    console.log(before);

    const recoveredCount = await recoverStaleSyncQueue();

    console.log("RECOVERY EXECUTED ✅");
    console.log("Recovered:", recoveredCount);

    const after = await prisma.syncQueue.findUnique({
      where: {
        id: testId,
      },
    });

    console.log("AFTER RECOVERY ✅");
    console.log(after);

    if (
      !after ||
      after.status !== "PENDING" ||
      after.lastError !== "Recovered stale PROCESSING item"
    ) {
      throw new Error("Stale PROCESSING recovery verification failed");
    }

    console.log("STALE PROCESSING RECOVERY VERIFIED ✅");
  } finally {
    await prisma.syncQueue.deleteMany({
      where: {
        id: testId,
      },
    });

    await prisma.$disconnect();

    console.log("RECOVERY TEST DATA CLEANED ✅");
  }
}

main().catch((error) => {
  console.error("RECOVERY TEST FAILED ❌");
  console.error(error);
  process.exitCode = 1;
});