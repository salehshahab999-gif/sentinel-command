import { execSync } from "child_process";
import type { CollectorResult } from "./collector-types";

export function collectDiskUsage(): CollectorResult {
  const output = execSync(
    'powershell -Command "Get-PSDrive C | Select-Object Used,Free | ConvertTo-Json"',
    { encoding: "utf8" }
  );

  const disk = JSON.parse(output);

  return {
    name: "Disk Usage",
    status: "READY",
    value: {
      usedGB: Number((disk.Used / 1024 / 1024 / 1024).toFixed(2)),
      freeGB: Number((disk.Free / 1024 / 1024 / 1024).toFixed(2)),
    },
    timestamp: new Date().toISOString(),
  };
}