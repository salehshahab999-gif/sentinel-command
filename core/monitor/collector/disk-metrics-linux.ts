import { execSync } from "child_process";
import type { CollectorResult } from "./collector-types";

export function collectLinuxDisk(): CollectorResult {
  let freeGB: number | null = null;
  let totalGB: number | null = null;

  try {
    const output = execSync(
      "df -kP /",
      { encoding: "utf8" }
    );

    const lines = output.trim().split("\n");
    const dataLine = lines[1];

    if (!dataLine) {
      throw new Error("Disk data unavailable");
    }

    const parts = dataLine.trim().split(/\s+/);

    const totalKB = Number(parts[1]);
    const availableKB = Number(parts[3]);

    if (
      Number.isNaN(totalKB) ||
      Number.isNaN(availableKB)
    ) {
      throw new Error("Invalid disk values");
    }

    totalGB = Number(
      (totalKB / 1024 / 1024).toFixed(2)
    );

    freeGB = Number(
      (availableKB / 1024 / 1024).toFixed(2)
    );

  } catch {
    return {
      name: "Disk Usage",
      status: "READY",
      value: {
        totalGB: null,
        freeGB: null,
        note: "Disk metrics unavailable on runtime",
      },
      timestamp: new Date().toISOString(),
    };
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