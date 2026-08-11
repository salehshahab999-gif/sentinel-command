import { writeDatabaseLog } from "./database-log";

async function test() {
  await writeDatabaseLog("DATABASE LOGGER TEST OK");
}

test();