import { NextResponse } from "next/server";
import { readFile } from "fs/promises";

export async function GET() {
  try {
    const log = await readFile("logs/core/system.log", "utf-8");

    return NextResponse.json({
      status: "OK",
      logs: log,
    });
  } catch (error) {
    return NextResponse.json({
      status: "ERROR",
      message: String(error),
    });
  }
}
