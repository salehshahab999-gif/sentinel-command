import { collectSystemStatus } from "./system-collector";
import { collectCpuLoad } from "./system-metrics-collector";
import { collectMemoryUsage } from "./memory-metrics-collector";
import type { CollectorResult } from "./collector-types";

export function runCollectors(): CollectorResult[] {
  return [
    collectSystemStatus(),
    collectCpuLoad(),
    collectMemoryUsage(),
  ];
}