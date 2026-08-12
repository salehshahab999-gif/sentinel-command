import os from "os";

export function collectCpuLoad() {
  return {
    name: "CPU Load",
    value: os.loadavg()[0],
    timestamp: new Date().toISOString(),
  };
}