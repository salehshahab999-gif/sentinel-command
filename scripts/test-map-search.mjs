import assert from "node:assert/strict";
import { createCoordinateResult, filterMapResults, parseCoordinates, parseMapFilter } from "../core/map/map-search.ts";

assert.deepEqual(parseCoordinates("35.6892, 51.3890"), { latitude: 35.6892, longitude: 51.389 });
assert.deepEqual(parseCoordinates("35.6892،51.3890"), { latitude: 35.6892, longitude: 51.389 });
assert.equal(parseCoordinates("95, 200"), null);

const results = [
  { ...createCoordinateResult(35.6892, 51.389), type: "coordinate" },
  { ...createCoordinateResult(52.52, 13.405), type: "city", source: "CACHE" },
];

assert.equal(filterMapResults(results, { minLatitude: 50 }).length, 1);
assert.equal(filterMapResults(results, { type: "city" }).length, 1);
assert.equal(filterMapResults(results, { source: "CACHE" }).length, 1);
assert.equal(filterMapResults(results, { minLongitude: 40 }).length, 1);

const params = new URLSearchParams("type=city&source=CACHE&latMin=50&lonMax=20");
const filter = parseMapFilter(params);
assert.equal(filter.type, "city");
assert.equal(filter.source, "CACHE");
assert.equal(filter.minLatitude, 50);
assert.equal(filter.maxLongitude, 20);

console.log(JSON.stringify({
  ok: true,
  tests: ["coordinate-parser", "latitude-filter", "type-filter", "source-filter", "longitude-filter", "query-parser"],
}, null, 2));
