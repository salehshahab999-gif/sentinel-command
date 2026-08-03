import { writeLog } from "./logger";

async function test() {
  await writeLog("TEST LOGGER MODULE OK");
}

test();