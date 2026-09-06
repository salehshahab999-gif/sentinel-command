import assert from "node:assert/strict";
import { filterUniversalMapTargets, matchesUniversalMapFilter, parseUniversalMapFilter } from "../core/map/universal-filter.ts";

const now = new Date().toISOString();
const targets = [
  { id: "sat-1", domain: "SATELLITE", name: "Sentinel-1", source: "COPERNICUS", type: "satellite", status: "ONLINE", mode: "SKELETON", latitude: 35, longitude: 51, altitudeKm: 700, speedKmH: 27000, headingDeg: 90, elevationDeg: 20, timestamp: now, referenceFrame: "WGS84", accuracyM: 10 },
  { id: "air-1", domain: "AIRCRAFT", name: "SENT01", source: "READSB", type: "aircraft", status: "AIRBORNE", mode: "SKELETON", latitude: 40, longitude: 50, altitudeKm: 9, speedKmH: 800, headingDeg: 85, elevationDeg: 0, timestamp: now, referenceFrame: "WGS84", accuracyM: 50 },
  { id: "ship-1", domain: "MARITIME", name: "SENTINEL SHIP", source: "OPENWATERS", type: "ship", status: "MOVING", mode: "SKELETON", latitude: 25, longitude: 55, altitudeKm: 0, speedKmH: 30, headingDeg: 180, timestamp: now, referenceFrame: "WGS84", accuracyM: 100 },
];

assert.equal(filterUniversalMapTargets(targets, { domains: ["SATELLITE"] }).length, 1);
assert.equal(filterUniversalMapTargets(targets, { minAltitudeKm: 100 }).length, 1);
assert.equal(filterUniversalMapTargets(targets, { minSpeedKmH: 700 }).length, 2);
assert.equal(filterUniversalMapTargets(targets, { sources: ["READSB"] })[0].id, "air-1");
assert.equal(filterUniversalMapTargets(targets, { maxLongitude: 52 }).length, 2);
assert.equal(matchesUniversalMapFilter(targets[0], { referenceFrames: ["WGS84"], minAccuracyM: 1, maxAccuracyM: 20 }), true);

const params = new URLSearchParams("domain=SATELLITE&type=satellite&altMinKm=500&speedMinKmh=20000&frame=WGS84");
const filter = parseUniversalMapFilter(params);
assert.deepEqual(filter.domains, ["SATELLITE"]);
assert.deepEqual(filter.types, ["satellite"]);
assert.equal(filter.minAltitudeKm, 500);
assert.equal(filter.minSpeedKmH, 20000);
assert.deepEqual(filter.referenceFrames, ["WGS84"]);

console.log(JSON.stringify({
  ok: true,
  tests: ["domain", "altitude", "speed", "source", "bounding", "accuracy", "query-parser"],
}, null, 2));
