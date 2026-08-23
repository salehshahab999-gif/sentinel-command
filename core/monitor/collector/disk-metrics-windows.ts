import { execSync } from "child_process";
import type { CollectorResult } from "./collector-types";

export function collectWindowsDisk(): CollectorResult {
  let freeGB = 0;
  let totalGB = 0;

  try {
    const output = execSync(
      'powershell -Command "Get-PSDrive C | Select-Object Used,Free | ConvertTo-Json"',
      {
        encoding: "utf8",
        windowsHide: true,
      },
    );

    const disk = JSON.parse(output);

    const free = Number(disk.Free || 0);
    const used = Number(disk.Used || 0);

    freeGB = Number((free / 1024 / 1024 / 1024).toFixed(2));

    const usedGB = Number(
      (used / 1024 / 1024 / 1024).toFixed(2),
    );

    totalGB = Number((usedGB + freeGB).toFixed(2));
  } catch {
    freeGB = 0;
    totalGB = 0;
  }

  return {
    name: "Disk Usage",
    status: "READY",
    value: {
      totalGB,
      freeGB,
    },
    timestamp: new Date().toISOString(),
  };
}