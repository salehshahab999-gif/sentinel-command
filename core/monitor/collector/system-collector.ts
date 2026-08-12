import type { CollectorResult } from "./collector-types";

export function collectSystemStatus(): CollectorResult {
  return {
    name: "System Status",
    status: "READY",
    value: "System collector initialized",
    timestamp: new Date().toISOString(),
  };
}