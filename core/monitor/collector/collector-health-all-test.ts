import { checkCollectorHealth } from "./collector-health";
import { collectSystemStatus } from "./system-collector";
import { collectCpuLoad } from "./system-metrics-collector";
import { collectMemoryUsage } from "./memory-metrics-collector";
import { collectDiskUsage } from "./disk-metrics-collector";
import { collectNetworkInfo } from "./network-metrics-collector";

const collectors = [
  collectSystemStatus,
  collectCpuLoad,
  collectMemoryUsage,
  collectDiskUsage,
  collectNetworkInfo,
];

console.log(
  "Collector Health Report:",
  collectors.map((collector) =>
    checkCollectorHealth(collector)
  )
);