import { NextResponse } from "next/server";
import { getMonitorSnapshot } from "@/core/monitor/monitor-service";

export async function GET() {
  const snapshot = await getMonitorSnapshot();

  return NextResponse.json(snapshot);
}