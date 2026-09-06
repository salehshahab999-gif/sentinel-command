import type {
  AircraftFilter,
  AircraftHistoryPoint,
  AircraftHistoryQuery,
  AircraftRecord,
} from "./aircraft-contracts";

export type AircraftTargetResult = {
  aircraft: AircraftRecord;
  score: number;
  reasons: string[];
};

const KNOT_TO_KMH = 1.852;
const HISTORY_LIMIT = 5000;

export function normalizeAircraftSpeed(record: AircraftRecord): AircraftRecord {
  const knots = record.groundSpeedKnots;
  if (knots === undefined || !Number.isFinite(knots)) return record;
  return {
    ...record,
    groundSpeedKmh: knots * KNOT_TO_KMH,
    groundSpeedKmS: (knots * KNOT_TO_KMH) / 3600,
  };
}

function contains(value: string | undefined, query: string | undefined): boolean {
  if (!query) return true;
  return (value ?? "").toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

export function matchesAircraftFilter(record: AircraftRecord, filter: AircraftFilter = {}): boolean {
  const aircraft = normalizeAircraftSpeed(record);
  if (!contains(aircraft.icaoHex, filter.icaoHex)) return false;
  if (!contains(aircraft.registration, filter.registration)) return false;
  if (!contains(aircraft.callsign, filter.callsign)) return false;
  if (!contains(aircraft.typeCode, filter.typeCode)) return false;
  if (!contains(aircraft.typeDescription, filter.typeDescription)) return false;
  if (filter.minAltitudeFt !== undefined && (aircraft.altitudeFt ?? -Infinity) < filter.minAltitudeFt) return false;
  if (filter.maxAltitudeFt !== undefined && (aircraft.altitudeFt ?? Infinity) > filter.maxAltitudeFt) return false;
  if (filter.minSpeedKnots !== undefined && (aircraft.groundSpeedKnots ?? -Infinity) < filter.minSpeedKnots) return false;
  if (filter.maxSpeedKnots !== undefined && (aircraft.groundSpeedKnots ?? Infinity) > filter.maxSpeedKnots) return false;
  if (filter.squawk !== undefined && aircraft.squawk !== filter.squawk) return false;
  if (filter.state !== undefined && aircraft.state !== filter.state) return false;
  if (filter.source !== undefined && aircraft.source !== filter.source) return false;
  if (filter.military === true && aircraft.operator?.toLocaleLowerCase().includes("military") !== true) return false;
  return true;
}

export function searchAircraft(records: AircraftRecord[], query: string): AircraftTargetResult[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];

  return records
    .map(normalizeAircraftSpeed)
    .flatMap((aircraft) => {
      const fields: Array<[string, string | undefined, number]> = [
        ["icao", aircraft.icaoHex, 100],
        ["registration", aircraft.registration, 95],
        ["callsign", aircraft.callsign, 90],
        ["type", aircraft.typeCode, 75],
        ["typeDescription", aircraft.typeDescription, 65],
        ["operator", aircraft.operator, 50],
      ];

      const matched = fields
        .filter(([, value]) => value?.toLocaleLowerCase().includes(q))
        .sort((a, b) => b[2] - a[2]);

      if (matched.length === 0) return [];
      return [{
        aircraft,
        score: matched[0][2],
        reasons: matched.map(([field]) => field),
      }];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
}

export function filterAircraft(records: AircraftRecord[], filter: AircraftFilter): AircraftRecord[] {
  return records.map(normalizeAircraftSpeed).filter((record) => matchesAircraftFilter(record, filter));
}

export function queryAircraftHistory(
  points: AircraftHistoryPoint[],
  query: AircraftHistoryQuery,
): AircraftHistoryPoint[] {
  const limit = Math.min(Math.max(query.limit ?? 500, 1), HISTORY_LIMIT);
  const start = query.startTime ? Date.parse(query.startTime) : -Infinity;
  const end = query.endTime ? Date.parse(query.endTime) : Infinity;

  return points
    .filter((point) => {
      if (query.aircraftId && point.aircraftId !== query.aircraftId) return false;
      const time = Date.parse(point.timestamp);
      if (!Number.isFinite(time)) return false;
      if (time < start || time > end) return false;
      return true;
    })
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    .slice(-limit);
}

export function parseAircraftFilter(input: URLSearchParams): AircraftFilter {
  const number = (key: string): number | undefined => {
    const value = Number(input.get(key));
    return Number.isFinite(value) ? value : undefined;
  };

  const bool = input.get("military");

  return {
    icaoHex: input.get("icao") || undefined,
    registration: input.get("registration") || input.get("reg") || undefined,
    callsign: input.get("callsign") || undefined,
    typeCode: input.get("type") || undefined,
    typeDescription: input.get("description") || undefined,
    minAltitudeFt: number("altMin"),
    maxAltitudeFt: number("altMax"),
    minSpeedKnots: number("speedMin"),
    maxSpeedKnots: number("speedMax"),
    squawk: input.get("squawk") || undefined,
    state: (input.get("state") as AircraftFilter["state"]) || undefined,
    military: bool === "1" || bool === "true" ? true : undefined,
  };
}
