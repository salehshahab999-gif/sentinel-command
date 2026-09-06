import assert from "node:assert/strict";
import { solvePrecisionPosition } from "../core/position/precision-position-engine.ts";

const now = new Date().toISOString();

const observations = [
  {
    id: "gps-1",
    targetId: "TEST-TARGET",
    source: "GPS",
    sourceKind: "GNSS",
    timestamp: now,
    referenceFrame: "WGS84",
    ecefXKm: 6378.137,
    ecefYKm: 0.002,
    ecefZKm: -0.001,
    velocityXKmS: 0,
    velocityYKmS: 7.5,
    velocityZKmS: 0,
    accuracyM: 0.5,
  },
  {
    id: "galileo-1",
    targetId: "TEST-TARGET",
    source: "GALILEO",
    sourceKind: "GNSS",
    timestamp: now,
    referenceFrame: "WGS84",
    ecefXKm: 6378.1375,
    ecefYKm: 0.0022,
    ecefZKm: -0.0011,
    velocityXKmS: 0.0001,
    velocityYKmS: 7.4999,
    velocityZKmS: 0,
    accuracyM: 1,
  },
  {
    id: "astronomy-check",
    targetId: "TEST-TARGET",
    source: "JPL",
    sourceKind: "ASTRONOMY",
    timestamp: now,
    referenceFrame: "WGS84",
    ecefXKm: 6378.1369,
    ecefYKm: 0.0018,
    ecefZKm: -0.0008,
    accuracyM: 2,
  },
];

const solution = solvePrecisionPosition(observations, { commonFrame: "WGS84" });
assert.equal(solution.status, "SOLVED");
assert.equal(solution.targetId, "TEST-TARGET");
assert.ok(Number.isFinite(solution.latitudeDeg));
assert.ok(Number.isFinite(solution.longitudeDeg));
assert.ok(Number.isFinite(solution.altitudeKm));
assert.equal(solution.sourceCount, 3);
assert.ok(solution.usedObservationIds.length >= 2);

const mismatch = solvePrecisionPosition([
  { ...observations[0], id: "a", targetId: "A" },
  { ...observations[1], id: "b", targetId: "B" },
]);
assert.equal(mismatch.status, "TARGET_MISMATCH");

const empty = solvePrecisionPosition([]);
assert.equal(empty.status, "INSUFFICIENT_DATA");

const blocked = solvePrecisionPosition([
  { ...observations[0], id: "p90", referenceFrame: "PZ90" },
], { commonFrame: "WGS84" });
assert.equal(blocked.status, "FRAME_BLOCKED");

console.log(JSON.stringify({
  ok: true,
  solution: {
    latitudeDeg: solution.latitudeDeg,
    longitudeDeg: solution.longitudeDeg,
    altitudeKm: solution.altitudeKm,
    speedKmS: solution.speedKmS,
    speedKmH: solution.speedKmH,
    headingDeg: solution.headingDeg,
    quality: solution.quality,
  },
  tests: ["multi-source", "target-isolation", "empty-input", "frame-gating"],
}, null, 2));
