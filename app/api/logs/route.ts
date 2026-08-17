import { NextResponse } from "next/server";
import { readFile } from "fs/promises";

export async function GET() {
  try {
    const log = await readFile("logs/core/system.log", "utf-8");

    const lines = log
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const lastEntry = lines[lines.length - 1] || "No logs";

    return NextResponse.json({
      status: "OK",
      totalLogs: lines.length,
      lastEntry,
      logs: log,
    });
  } catch (error) {
    return NextResponse.json({
      status: "ERROR",
      message: String(error),
    });
  }
}