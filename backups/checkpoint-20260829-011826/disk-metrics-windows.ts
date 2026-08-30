import { execFile } from "child_process";
import { promisify } from "util";

import type { CollectorResult } from "./collector-types";

const execFileAsync =
  promisify(execFile);

export async function collectWindowsDisk(): Promise<CollectorResult> {
  try {
    const {
      stdout,
    } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "(Get-PSDrive C).Used; (Get-PSDrive C).Free",
      ],
      {
        encoding: "utf8",
        windowsHide: true,
      },
    );

    const values =
      stdout
        .trim()
        .split(/\r?\n/)
        .map((value) =>
          Number(value.trim()),
        )
        .filter((value) =>
          Number.isFinite(value),
        );

    const used =
      values[0];

    const free =
      values[1];

    if (
      !Number.isFinite(used) ||
      !Number.isFinite(free)
    ) {
      return unavailableDisk();
    }

    const freeGB =
      Number(
        (
          free /
          1024 /
          1024 /
          1024
        ).toFixed(2),
      );

    const usedGB =
      Number(
        (
          used /
          1024 /
          1024 /
          1024
        ).toFixed(2),
      );

    return {
      name:
        "Disk Usage",

      status:
        "READY",

      value: {
        totalGB:
          Number(
            (
              usedGB +
              freeGB
            ).toFixed(2),
          ),

        freeGB,
      },

      timestamp:
        new Date().toISOString(),
    };
  } catch {
    return unavailableDisk();
  }
}

function unavailableDisk(): CollectorResult {
  return {
    name:
      "Disk Usage",

    status:
      "READY",

    value: {
      totalGB:
        null,

      freeGB:
        null,

      note:
        "Disk metrics unavailable on current runtime",
    },

    timestamp:
      new Date().toISOString(),
  };
}