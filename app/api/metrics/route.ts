import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

import {
  getMetricsCache,
  setMetricsCache,
} from "../../../core/metrics/cache";

const execFileAsync =
  promisify(execFile);

interface CpuTimes {
  user: number;
  nice: number;
  sys: number;
  idle: number;
  irq: number;
}

function readCpuTimes(): CpuTimes {
  return os.cpus().reduce(
    (total, cpu) => ({
      user:
        total.user +
        cpu.times.user,

      nice:
        total.nice +
        cpu.times.nice,

      sys:
        total.sys +
        cpu.times.sys,

      idle:
        total.idle +
        cpu.times.idle,

      irq:
        total.irq +
        cpu.times.irq,
    }),
    {
      user: 0,
      nice: 0,
      sys: 0,
      idle: 0,
      irq: 0,
    },
  );
}

function delay(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds,
      ),
  );
}

async function getWindowsCpuUsage(): Promise<string> {
  try {
    const {
      stdout,
    } =
      await execFileAsync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "(Get-Counter '\\Processor(_Total)\\% Processor Time').CounterSamples.CookedValue",
        ],
        {
          windowsHide:
            true,
        },
      );

    const value =
      Number(
        stdout.trim(),
      );

    if (
      !Number.isFinite(
        value,
      )
    ) {
      return "N/A";
    }

    return `${Math.max(
      0,
      Math.min(
        100,
        value,
      ),
    ).toFixed(1)}%`;
  } catch {
    return "N/A";
  }
}

async function getCpuUsage(): Promise<string> {
  try {
    if (
      process.platform ===
      "win32"
    ) {
      const windowsCpu =
        await getWindowsCpuUsage();

      if (
        windowsCpu !==
        "N/A"
      ) {
        return windowsCpu;
      }
    }

    const first =
      readCpuTimes();

    await delay(250);

    const second =
      readCpuTimes();

    const firstTotal =
      first.user +
      first.nice +
      first.sys +
      first.idle +
      first.irq;

    const secondTotal =
      second.user +
      second.nice +
      second.sys +
      second.idle +
      second.irq;

    const totalDelta =
      secondTotal -
      firstTotal;

    const idleDelta =
      second.idle -
      first.idle;

    if (
      totalDelta <= 0 ||
      idleDelta < 0
    ) {
      return "N/A";
    }

    const cpu =
      ((totalDelta -
        idleDelta) /
        totalDelta) *
      100;

    return `${Math.max(
      0,
      Math.min(
        100,
        cpu,
      ),
    ).toFixed(1)}%`;
  } catch {
    return "N/A";
  }
}

async function getGpuUsage(): Promise<string> {
  try {
    if (
      process.platform !==
      "win32"
    ) {
      return "N/A";
    }

    const {
      stdout,
    } =
      await execFileAsync(
        "nvidia-smi",
        [
          "--query-gpu=utilization.gpu",
          "--format=csv,noheader,nounits",
        ],
        {
          windowsHide:
            true,
        },
      );

    const value =
      stdout
        .trim()
        .split("\n")[0]
        ?.trim();

    return value
      ? `${value}%`
      : "N/A";
  } catch {
    return "N/A";
  }
}

async function getDiskC(): Promise<string> {
  try {
    if (
      process.platform !==
      "win32"
    ) {
      return "N/A";
    }

    const {
      stdout,
    } =
      await execFileAsync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "(Get-Volume -DriveLetter C).SizeRemaining",
        ],
        {
          windowsHide:
            true,
        },
      );

    const bytes =
      Number(
        stdout.trim(),
      );

    if (
      !Number.isFinite(
        bytes,
      )
    ) {
      return "N/A";
    }

    const freeGB =
      bytes /
      1024 /
      1024 /
      1024;

    return `${freeGB.toFixed(
      1,
    )} GB Free`;
  } catch {
    return "N/A";
  }
}

export async function GET() {
  const cached =
    getMetricsCache();

  if (cached) {
    return Response.json(
      cached,
    );
  }

  const totalMemory =
    os.totalmem();

  const freeMemory =
    os.freemem();

  const usedMemory =
    totalMemory -
    freeMemory;

  const usedMemoryGB =
    usedMemory /
    1024 /
    1024 /
    1024;

  const totalMemoryGB =
    totalMemory /
    1024 /
    1024 /
    1024;

  const ramPercent =
    Math.round(
      (usedMemory /
        totalMemory) *
        100,
    );

  const uptimeSeconds =
    Math.floor(
      os.uptime(),
    );

  const hours =
    Math.floor(
      uptimeSeconds /
        3600,
    );

  const minutes =
    Math.floor(
      (uptimeSeconds %
        3600) /
        60,
    );

  const seconds =
    uptimeSeconds %
    60;

  const [
    cpu,
    gpu,
    diskC,
  ] =
    await Promise.all([
      getCpuUsage(),
      getGpuUsage(),
      getDiskC(),
    ]);

  const metrics = {
    cpu,

    memory: `${usedMemoryGB.toFixed(
      1,
    )} GB / ${totalMemoryGB.toFixed(
      0,
    )} GB`,

    ram:
      `${ramPercent}%`,

    gpu,

    diskC,

    uptime:
      `${hours}h ${minutes}m ${seconds}s`,

    timestamp:
      new Date().toISOString(),
  };

  setMetricsCache(
    metrics,
  );

  return Response.json(
    metrics,
  );
}