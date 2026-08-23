import os from "os";
import type { CollectorResult } from "./collector-types";

export function collectDiskUsage(): CollectorResult {
  let freeGB = 0;
  let totalGB = 0;

  try {
    if (process.platform === "win32") {
      const { execSync } = require("child_process");

      const output = execSync(
        'powershell -Command "Get-PSDrive C | Select-Object Used,Free | ConvertTo-Json"',
        { encoding: "utf8", windowsHide: true }
      );

      const disk = JSON.parse(output);

      freeGB = Number(
        (disk.Free / 1024 / 1024 / 1024).toFixed(2)
      );

      const usedGB = Number(
        (disk.Used / 1024 / 1024 / 1024).toFixed(2)
      );

      totalGB = Number((usedGB + freeGB).toFixed(2));
    } else {
      // Vercel / Linux fallback
      freeGB = 0;
      totalGB = 0;
    }
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