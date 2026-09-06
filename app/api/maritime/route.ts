import { NextResponse } from "next/server";
import { collectMaritimeSnapshot } from "../../../core/maritime/maritime-runtime";

function parseBbox(value: string | null): [number, number, number, number] | undefined {
  if (!value) return undefined;

  const parts = value.split(",").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return undefined;

  const [minLat, minLon, maxLat, maxLon] = parts;
  if (minLat < -90 || maxLat > 90 || minLon < -180 || maxLon > 180) return undefined;
  if (minLat > maxLat || minLon > maxLon) return undefined;

  return [minLat, minLon, maxLat, maxLon];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bbox = parseBbox(url.searchParams.get("bbox"));
  const snapshot = await collectMaritimeSnapshot(bbox);

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": snapshot.liveEnabled ? "no-store" : "private, max-age=15",
    },
  });
}
