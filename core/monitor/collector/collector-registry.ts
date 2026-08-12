import { collectSystemStatus } from "./system-collector";
import { collectCpuLoad } from "./system-metrics-collector";
import { collectMemoryUsage } from "./memory-metrics-collector";
import { collectDiskUsage } from "./disk-metrics-collector";
import { collectNetworkInfo } from "./network-metrics-collector";
import type { CollectorResult } from "./collector-types";

export const COLLECTOR_REGISTRY: Array<
  () => CollectorResult
> = [
  collectSystemStatus,
  collectCpuLoad,
  collectMemoryUsage,
  collectDiskUsage,
  collectNetworkInfo,
];