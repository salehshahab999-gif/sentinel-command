import "dotenv/config";

import { checkRemoteConnectivity } from "./remote-connectivity";
import { getRemotePrisma } from "./remote-prisma-client";

async function main() {
  const remotePrisma = getRemotePrisma();
  const result = await checkRemoteConnectivity();

  console.log("REMOTE CONNECTIVITY TEST ✅");
  console.log(result);

  await remotePrisma.$disconnect();
}

main().catch((error) => {
  console.error("REMOTE CONNECTIVITY TEST FAILED ❌");
  console.error(error);
  process.exitCode = 1;
});