import { execFileSync } from "child_process";
import type { CollectorResult } from "./collector-types";

export function collectCpuLoad(): CollectorResult {
  let cpu = 0;

  try {
    if (process.platform === "win32") {
      const output = execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "(Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average",
        ],
        { encoding: "utf8", windowsHide: true }
      );

      cpu = Number(output.trim()) || 0;
    } else {
      const load = require("os").loadavg()[0];
      const cores = require("os").cpus().length;

      cpu = (load / cores) * 100;
    }
  } catch {
    cpu = 0;
  }

  return {
    name: "CPU Load",
    status: "READY",
    value: Number(cpu.toFixed(1)),
    timestamp: new Date().toISOString(),
  };
}