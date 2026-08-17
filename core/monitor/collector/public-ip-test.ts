import { collectPublicIP } from "./public-ip-collector";

async function test() {
  const result = await collectPublicIP();

  console.log(
    JSON.stringify(result, null, 2)
  );
}

test();