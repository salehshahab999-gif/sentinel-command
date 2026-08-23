import os from "os";
import { execSync } from "child_process";
import { getMetricsCache, setMetricsCache } from "../../../core/metrics/cache";

function getCpuUsage(): string {
  try {
    if (process.platform === "win32") {
      const output = execSync(
        "wmic cpu get loadpercentage",
        {
          encoding: "utf8",
          windowsHide: true,
        }
      );

      const value = output
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean)[1];

      return value ? `${value}%` : "N/A";
    }

    const load = os.loadavg()[0];
    const cores = os.cpus().length;

    const cpu = Math.round((load / cores) * 100);

    return `${cpu}%`;

  } catch {
    return "N/A";
  }
}

function getGpuUsage(): string {
  try {
    if (process.platform !== "win32") {
      return "N/A";
    }

    const output = execSync(
      "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits",
      { encoding: "utf8" },
    );

    const value = output.trim().split("\n")[0]?.trim();

    return value ? `${value}%` : "N/A";
  } catch {
    return "N/A";
  }
}

function getDiskC(): string {
  try {
    if (process.platform !== "win32") {
      return "N/A";
    }

    const output = execSync(
      'powershell -NoProfile -Command "(Get-Volume -DriveLetter C).SizeRemaining"',
      { encoding: "utf8" },
    );

    const bytes = Number(output.trim());

    if (!Number.isFinite(bytes)) {
      return "N/A";
    }

    const freeGB = bytes / 1024 / 1024 / 1024;

    return `${freeGB.toFixed(1)} GB Free`;
  } catch {
    return "N/A";
  }
}

export async function GET() {
  const cached = getMetricsCache();

  if (cached) {
    return Response.json(cached);
  }

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const usedMemoryGB = usedMemory / 1024 / 1024 / 1024;
  const totalMemoryGB = totalMemory / 1024 / 1024 / 1024;

  const ramPercent = Math.round((usedMemory / totalMemory) * 100);

  const uptimeSeconds = Math.floor(os.uptime());

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const metrics = {
    cpu: getCpuUsage(),
    memory: `${usedMemoryGB.toFixed(1)} GB / ${totalMemoryGB.toFixed(0)} GB`,
    ram: `${ramPercent}%`,
    gpu: getGpuUsage(),
    diskC: getDiskC(),
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    timestamp: new Date().toISOString(),
  };

  setMetricsCache(metrics);

  return Response.json(metrics);
}