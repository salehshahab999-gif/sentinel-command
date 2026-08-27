import "dotenv/config";

import { checkRemoteConnectivity } from "./remote-connectivity";
import { remotePrisma } from "./remote-prisma-client";

async function main() {
  const result = await checkRemoteConnectivity();

  console.log("REMOTE CONNECTIVITY TEST ✅");
  console.log(result);
}

main()
  .catch((error) => {
    console.error("REMOTE CONNECTIVITY TEST FAILED ❌");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await remotePrisma.$disconnect();
  });