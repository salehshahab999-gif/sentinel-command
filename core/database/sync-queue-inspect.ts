import "dotenv/config";

import { prisma } from "./prisma-client";

async function main() {
  const items = await prisma.syncQueue.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log("CURRENT SYNC QUEUE ✅");
  console.log(items);

  console.log("PENDING COUNT:", items.filter(
    (item) => item.status === "PENDING"
  ).length);
}

main()
  .catch((error) => {
    console.error("SYNC QUEUE INSPECTION FAILED ❌");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });