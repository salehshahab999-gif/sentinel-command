export type UniversalTargetDomain = "MAP" | "SATELLITE" | "AIRCRAFT" | "MARITIME" | "EVENT" | "ALERT" | "WEATHER" | "OTHER";

export type UniversalMapFilter = {
  text?: string;
  domains?: UniversalTargetDomain[];
  sources?: string[];
  types?: string[];
  statuses?: string[];
  modes?: string[];
  minLatitude?: number;
  maxLatitude?: number;
  minLongitude?: number;
  maxLongitude?: number;
  minAltitudeKm?: number;
  maxAltitudeKm?: number;
  minSpeedKmH?: number;
  maxSpeedKmH?: number;
  minHeadingDeg?: number;
  maxHeadingDeg?: number;
  minElevationDeg?: number;
  maxElevationDeg?: number;
  startTime?: string;
  endTime?: string;
  referenceFrames?: string[];
  minAccuracyM?: number;
  maxAccuracyM?: number;
};

export type UniversalMapTarget = {
  id: string;
  domain: UniversalTargetDomain;
  name?: string;
  description?: string;
  source?: string;
  type?: string;
  status?: string;
  mode?: string;
  latitude?: number;
  longitude?: number;
  altitudeKm?: number;
  speedKmH?: number;
  headingDeg?: number;
  elevationDeg?: number;
  timestamp?: string;
  referenceFrame?: string;
  accuracyM?: number;
};

const normalize = (value: string | undefined) => value?.trim().toLocaleLowerCase() ?? "";
const matchesList = (value: string | undefined, list: string[] | undefined) => !list?.length || list.some((item) => normalize(item) === normalize(value));
const inRange = (value: number | undefined, min: number | undefined, max: number | undefined) => {
  if (min !== undefined && (value === undefined || value < min)) return false;
  if (max !== undefined && (value === undefined || value > max)) return false;
  return true;
};

export function matchesUniversalMapFilter(target: UniversalMapTarget, filter: UniversalMapFilter = {}): boolean {
  const text = normalize(filter.text);
  if (text) {
    const haystack = [target.id, target.name, target.description, target.source, target.type, target.status, target.mode]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    if (!haystack.includes(text)) return false;
  }

  if (filter.domains?.length && !filter.domains.includes(target.domain)) return false;
  if (!matchesList(target.source, filter.sources)) return false;
  if (!matchesList(target.type, filter.types)) return false;
  if (!matchesList(target.status, filter.statuses)) return false;
  if (!matchesList(target.mode, filter.modes)) return false;

  if (!inRange(target.latitude, filter.minLatitude, filter.maxLatitude)) return false;
  if (!inRange(target.longitude, filter.minLongitude, filter.maxLongitude)) return false;
  if (!inRange(target.altitudeKm, filter.minAltitudeKm, filter.maxAltitudeKm)) return false;
  if (!inRange(target.speedKmH, filter.minSpeedKmH, filter.maxSpeedKmH)) return false;
  if (!inRange(target.headingDeg, filter.minHeadingDeg, filter.maxHeadingDeg)) return false;
  if (!inRange(target.elevationDeg, filter.minElevationDeg, filter.maxElevationDeg)) return false;
  if (!inRange(target.accuracyM, filter.minAccuracyM, filter.maxAccuracyM)) return false;

  const time = target.timestamp ? Date.parse(target.timestamp) : Number.NaN;
  if (filter.startTime) {
    const start = Date.parse(filter.startTime);
    if (Number.isFinite(start) && (!Number.isFinite(time) || time < start)) return false;
  }
  if (filter.endTime) {
    const end = Date.parse(filter.endTime);
    if (Number.isFinite(end) && (!Number.isFinite(time) || time > end)) return false;
  }

  if (filter.referenceFrames?.length && !filter.referenceFrames.some((item) => normalize(item) === normalize(target.referenceFrame))) return false;
  return true;
}

export function filterUniversalMapTargets<T extends UniversalMapTarget>(targets: T[], filter: UniversalMapFilter = {}): T[] {
  return targets.filter((target) => matchesUniversalMapFilter(target, filter));
}

export function parseUniversalMapFilter(input: URLSearchParams): UniversalMapFilter {
  const number = (key: string): number | undefined => {
    const raw = input.get(key);
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };
  const list = (key: string): string[] | undefined => {
    const values = input.get(key)?.split(",").map((item) => item.trim()).filter(Boolean);
    return values?.length ? values : undefined;
  };

  return {
    text: input.get("filter") || undefined,
    domains: list("domain") as UniversalTargetDomain[] | undefined,
    sources: list("source"),
    types: list("type"),
    statuses: list("status"),
    modes: list("mode"),
    minLatitude: number("latMin"),
    maxLatitude: number("latMax"),
    minLongitude: number("lonMin"),
    maxLongitude: number("lonMax"),
    minAltitudeKm: number("altMinKm"),
    maxAltitudeKm: number("altMaxKm"),
    minSpeedKmH: number("speedMinKmh"),
    maxSpeedKmH: number("speedMaxKmh"),
    minHeadingDeg: number("headingMin"),
    maxHeadingDeg: number("headingMax"),
    minElevationDeg: number("elevationMin"),
    maxElevationDeg: number("elevationMax"),
    startTime: input.get("start") || undefined,
    endTime: input.get("end") || undefined,
    referenceFrames: list("frame"),
    minAccuracyM: number("accuracyMinM"),
    maxAccuracyM: number("accuracyMaxM"),
  };
}

export function createEmptyUniversalMapFilter(): UniversalMapFilter {
  return {};
}
