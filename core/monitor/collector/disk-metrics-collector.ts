import type { CollectorResult } from "./collector-types";
import { collectWindowsDisk } from "./disk-metrics-windows";
import { collectLinuxDisk } from "./disk-metrics-linux";

export function collectDiskUsage(): CollectorResult {
  if (process.platform === "win32") {
    return collectWindowsDisk();
  }

  return collectLinuxDisk();
}