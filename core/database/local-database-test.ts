import { PrismaClient } from "../../app/generated/prisma-local/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./app/prisma/sentinel-local.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.target.deleteMany({
    where: {
      id: "LOCAL-TEST-001",
    },
  });

  console.log("LOCAL TEST RECORD REMOVED ✅");
}

main()
  .catch((error) => {
    console.error("LOCAL TEST CLEANUP FAILED ❌");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });