import { NextResponse } from "next/server";
import { writeLog } from "@/core/logger";

export async function GET() {
  try {
    await writeLog("TEST LOGGER CORE CONNECTED");

    return NextResponse.json({
      status: "OK",
      message: "Logger Core used",
      time: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: "Logger failed",
        error: String(error),
      },
      {
        status: 500,
      },
    );
  }
}
