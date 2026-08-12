import os from "os";
import type { CollectorResult } from "./collector-types";

export function collectCpuLoad(): CollectorResult {
  return {
    name: "CPU Load",
    status: "READY",
    value: os.loadavg()[0],
    timestamp: new Date().toISOString(),
  };
}