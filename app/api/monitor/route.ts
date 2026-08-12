import { NextResponse } from "next/server";
import { getMonitorSnapshot } from "@/core/monitor/monitor-service";

export function GET() {
  return NextResponse.json(
    getMonitorSnapshot()
  );
}