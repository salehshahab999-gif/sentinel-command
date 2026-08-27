import { PrismaClient } from "../../app/generated/prisma-local/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./app/prisma/sentinel-local.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const testId = "SYNC-QUEUE-TEST-001";

  await prisma.syncQueue.create({
    data: {
      id: testId,
      entity: "SYSTEM",
      operation: "CREATE",
      payload: JSON.stringify({
        test: true,
        message: "SYNC QUEUE CLEANUP TEST",
      }),
    },
  });

  console.log("SYNC QUEUE TEST RECORD CREATED ✅");

  const pending = await prisma.syncQueue.findMany({
    where: {
      id: testId,
    },
  });

  console.log("SYNC QUEUE TEST RECORD VERIFIED ✅");
  console.log(pending);

  await prisma.syncQueue.delete({
    where: {
      id: testId,
    },
  });

  console.log("SYNC QUEUE TEST RECORD REMOVED ✅");
}

main()
  .catch((error) => {
    console.error("SYNC QUEUE CLEANUP TEST FAILED ❌");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });