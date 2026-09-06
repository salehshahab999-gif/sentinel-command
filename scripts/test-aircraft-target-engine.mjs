import assert from "node:assert/strict";
import { filterAircraft, normalizeAircraftSpeed, parseAircraftFilter, queryAircraftHistory, searchAircraft } from "../core/air/aircraft-target-engine.ts";

const now = new Date().toISOString();
const records = [
  {
    id: "air-1",
    icaoHex: "ABC123",
    registration: "EP-SENT",
    callsign: "SENT01",
    typeCode: "B738",
    typeDescription: "Landplane 2 jet engines",
    operator: "Sentinel Demo",
    latitude: 35.7,
    longitude: 51.4,
    altitudeFt: 32000,
    groundSpeedKnots: 450,
    trackDeg: 90,
    headingDeg: 90,
    source: "READSB",
    dataMode: "SKELETON",
    state: "AIRBORNE",
    seenAt: now,
  },
  {
    id: "air-2",
    icaoHex: "DEF456",
    registration: "DEMO2",
    callsign: "TEST02",
    typeCode: "A320",
    typeDescription: "Landplane 2 jet engines",
    operator: "Other Demo",
    latitude: 52.5,
    longitude: 13.4,
    altitudeFt: 10000,
    groundSpeedKnots: 220,
    source: "READSB",
    dataMode: "SKELETON",
    state: "AIRBORNE",
    seenAt: now,
  },
];

const normalized = normalizeAircraftSpeed(records[0]);
assert.equal(Number(normalized.groundSpeedKmh.toFixed(3)), 833.4);
assert.equal(Number(normalized.groundSpeedKmS.toFixed(6)), 0.2315);

assert.equal(searchAircraft(records, "EP-SENT")[0].aircraft.id, "air-1");
assert.equal(searchAircraft(records, "B738")[0].aircraft.id, "air-1");
assert.equal(filterAircraft(records, { minAltitudeFt: 20000 }).length, 1);

const params = new URLSearchParams("icao=ABC123&altMin=30000&speedMin=400");
const filter = parseAircraftFilter(params);
assert.equal(filter.icaoHex, "ABC123");
assert.equal(filter.minAltitudeFt, 30000);
assert.equal(filter.minSpeedKnots, 400);

const history = queryAircraftHistory([
  { aircraftId: "air-1", timestamp: "2026-09-06T18:00:00Z", latitude: 35.0, longitude: 51.0 },
  { aircraftId: "air-1", timestamp: "2026-09-06T18:05:00Z", latitude: 35.1, longitude: 51.1 },
  { aircraftId: "air-2", timestamp: "2026-09-06T18:05:00Z", latitude: 52.5, longitude: 13.4 },
], { aircraftId: "air-1", limit: 2 });
assert.equal(history.length, 2);
assert.equal(history[0].aircraftId, "air-1");
assert.equal(history[1].longitude, 51.1);

console.log(JSON.stringify({
  ok: true,
  tests: ["speed-normalization", "universal-search", "filters", "filter-parser", "history-query"],
}, null, 2));
