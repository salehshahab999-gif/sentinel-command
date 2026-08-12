import { checkCollectorHealth } from "./collector-health";
import { collectCpuLoad } from "./system-metrics-collector";

console.log(
  "Health Check:",
  checkCollectorHealth(collectCpuLoad)
);