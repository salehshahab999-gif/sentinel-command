import { execSync } from "child_process";
import type { CollectorResult } from "./collector-types";

export function collectWindowsDisk(): CollectorResult {
  try {
    const output = execSync(
      'powershell -Command "Get-PSDrive C | Select-Object Used,Free | ConvertTo-Json"',
      {
        encoding: "utf8",
        windowsHide: true,
      },
    );

    const disk = JSON.parse(output);

    const free = Number(disk.Free);
    const used = Number(disk.Used);

    if (!Number.isFinite(free) || !Number.isFinite(used)) {
      return unavailableDisk();
    }

    const freeGB = Number(
      (free / 1024 / 1024 / 1024).toFixed(2),
    );

    const usedGB = Number(
      (used / 1024 / 1024 / 1024).toFixed(2),
    );

    return {
      name: "Disk Usage",
      status: "READY",
      value: {
        totalGB: Number((usedGB + freeGB).toFixed(2)),
        freeGB,
      },
      timestamp: new Date().toISOString(),
    };

  } catch {
    return unavailableDisk();
  }
}

function unavailableDisk(): CollectorResult {
  return {
    name: "Disk Usage",
    status: "READY",
    value: {
      totalGB: null,
      freeGB: null,
      note: "Disk metrics unavailable on current runtime",
    },
    timestamp: new Date().toISOString(),
  };
}