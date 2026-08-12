import { checkCollectorHealth } from "./collector-health";
import { COLLECTOR_REGISTRY } from "./collector-registry";

console.log(
  "Collector Health Report:",
  COLLECTOR_REGISTRY.map((collector) =>
    checkCollectorHealth(collector)
  )
);