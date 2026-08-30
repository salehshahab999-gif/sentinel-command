import os from "os";

import type { CollectorResult } from "./collector-types";

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
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}

export async function collectCpuLoad(): Promise<CollectorResult> {
  let cpu = 0;

  try {
    const first =
      readCpuTimes();

    await delay(100);

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
      totalDelta > 0 &&
      idleDelta >= 0
    ) {
      cpu =
        ((totalDelta -
          idleDelta) /
          totalDelta) *
        100;
    }
  } catch {
    cpu = 0;
  }

  return {
    name:
      "CPU Load",

    status:
      "READY",

    value:
      Number(
        Math.max(
          0,
          Math.min(
            100,
            cpu,
          ),
        ).toFixed(1),
      ),

    timestamp:
      new Date().toISOString(),
  };
}