import { checkCollectorHealth } from "./collector-health";
import { COLLECTOR_REGISTRY } from "./collector-registry";

async function run() {
  const report = await Promise.all(
    COLLECTOR_REGISTRY.map(
      (collector) => checkCollectorHealth(collector)
    )
  );

  console.log(
    "Collector Health Report:",
    report
  );
}

run();