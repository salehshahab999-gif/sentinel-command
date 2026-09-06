import { NextResponse } from "next/server";
import { parseAircraftFilter, filterAircraft, searchAircraft, type AircraftTargetResult } from "../../../core/air/aircraft-target-engine";
import type { AircraftRecord } from "../../../core/air/aircraft-contracts";

const LIVE_ENV = "SENTINEL_AIRCRAFT_LIVE";

function skeletonAircraft(): AircraftRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: "skeleton-air-1",
      icaoHex: "TEST01",
      registration: "SENT-001",
      callsign: "SENTINEL1",
      typeCode: "B738",
      typeDescription: "Landplane 2 jet engines",
      operator: "Sentinel Demo",
      latitude: 35.6892,
      longitude: 51.389,
      altitudeFt: 32000,
      altitudeM: 9754,
      groundSpeedKnots: 450,
      trackDeg: 72,
      headingDeg: 71,
      verticalRateFpm: 0,
      squawk: "1000",
      source: "READSB",
      dataMode: "SKELETON",
      state: "AIRBORNE",
      seenAt: now,
      positionAccuracyM: 50,
    },
    {
      id: "skeleton-air-2",
      icaoHex: "TEST02",
      registration: "SENT-002",
      callsign: "SENTINEL2",
      typeCode: "A320",
      typeDescription: "Landplane 2 jet engines",
      operator: "Sentinel Demo",
      latitude: 52.52,
      longitude: 13.405,
      altitudeFt: 28000,
      altitudeM: 8534,
      groundSpeedKnots: 410,
      trackDeg: 140,
      headingDeg: 139,
      verticalRateFpm: -500,
      squawk: "2000",
      source: "READSB",
      dataMode: "SKELETON",
      state: "AIRBORNE",
      seenAt: now,
      positionAccuracyM: 50,
    },
  ];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const all = skeletonAircraft();
  const q = url.searchParams.get("q")?.trim() ?? "";
  const filter = parseAircraftFilter(url.searchParams);

  const searched: AircraftRecord[] | AircraftTargetResult[] = q
    ? searchAircraft(all, q)
    : filterAircraft(all, filter);
  const results = q
    ? (searched as AircraftTargetResult[]).map((item) => item.aircraft)
    : (searched as AircraftRecord[]);

  return NextResponse.json({
    ok: true,
    mode: process.env[LIVE_ENV] === "1" ? "LIVE_READY" : "SKELETON",
    liveEnabled: process.env[LIVE_ENV] === "1",
    provider: "READSB / ADS-B Exchange style target model",
    results,
    filter,
    note: "Live aircraft collection is disabled by default. The endpoint provides the local target/search/filter contract without scraping ADS-B Exchange.",
  }, {
    headers: {
      "Cache-Control": process.env[LIVE_ENV] === "1" ? "no-store" : "private, max-age=15",
    },
  });
}
