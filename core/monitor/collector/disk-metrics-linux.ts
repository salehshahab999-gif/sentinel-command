import { execSync } from "child_process";
import type { CollectorResult } from "./collector-types";

export function collectLinuxDisk(): CollectorResult {
  let freeGB = 0;
  let totalGB = 0;

  try {
    const output = execSync(
      "df -kP /",
      { encoding: "utf8" }
    );

    const lines = output.trim().split("\n");

    const dataLine = lines[1];

    const parts = dataLine.trim().split(/\s+/);

    const totalKB = Number(parts[1]);
    const availableKB = Number(parts[3]);

    totalGB = Number(
      (totalKB / 1024 / 1024).toFixed(2)
    );

    freeGB = Number(
      (availableKB / 1024 / 1024).toFixed(2)
    );

  } catch {
    totalGB = 0;
    freeGB = 0;
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