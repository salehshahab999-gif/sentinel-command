import os from "os";
import type { CollectorResult } from "./collector-types";

export function collectMemoryUsage(): CollectorResult {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    name: "Memory Usage",
    status: "READY",
    value: {
      usedGB: Number((used / 1024 / 1024 / 1024).toFixed(2)),
      totalGB: Number((total / 1024 / 1024 / 1024).toFixed(2)),
    },
    timestamp: new Date().toISOString(),
  };
}