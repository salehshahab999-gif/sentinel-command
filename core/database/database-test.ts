import { writeDatabaseLog } from "./database-log";

async function testDatabaseLog() {
  await writeDatabaseLog("DATABASE CONNECTION TEST OK");

  console.log("Database log test completed");
}

testDatabaseLog();