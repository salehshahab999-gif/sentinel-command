import { execFileSync } from "child_process";
import type { CollectorResult } from "./collector-types";

export function collectCpuLoad(): CollectorResult {
  const output = execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      "(Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average",
    ],
    { encoding: "utf8", windowsHide: true }
  );

  const cpu = Number(output.trim());

  return {
    name: "CPU Load",
    status: "READY",
    value: Number(cpu.toFixed(1)),
    timestamp: new Date().toISOString(),
  };
}