import type { GnssObservation } from "../gnss/gnss-contracts";
import type { AstronomyObservation } from "../astronomy/astronomy-contracts";

export type PositionSourceKind = "GNSS" | "SATELLITE" | "MARITIME" | "ASTRONOMY" | "OTHER";
export type PositionFrame = "WGS84" | "ITRF" | "PZ90" | "GTRF" | "CGCS2000" | "TEME" | "GCRS";

export type CartesianPositionObservation = {
  id: string;
  targetId: string;
  source: string;
  sourceKind: PositionSourceKind;
  timestamp: string;
  referenceFrame: PositionFrame;
  ecefXKm: number;
  ecefYKm: number;
  ecefZKm: number;
  velocityXKmS?: number;
  velocityYKmS?: number;
  velocityZKmS?: number;
  accuracyM?: number;
};

export type HelmertTransform = {
  translationM: [number, number, number];
  rotationArcSec: [number, number, number];
  scalePpm: number;
  referenceEpochYear?: number;
  translationRateMmPerYear?: [number, number, number];
  rotationRateArcSecPerYear?: [number, number, number];
  scaleRatePpbPerYear?: number;
};

export type PrecisionPositionEngineConfig = {
  commonFrame?: "ITRF" | "WGS84";
  maxObservationAgeSeconds?: number;
  minimumWeight?: number;
  transforms?: Partial<Record<PositionFrame, HelmertTransform>>;
};

export type PrecisionPositionSolution = {
  status: "SOLVED" | "INSUFFICIENT_DATA" | "FRAME_BLOCKED" | "TARGET_MISMATCH";
  targetId?: string;
  timestamp: string;
  referenceFrame: "ITRF" | "WGS84";
  latitudeDeg?: number;
  longitudeDeg?: number;
  altitudeKm?: number;
  speedKmS?: number;
  speedKmH?: number;
  headingDeg?: number;
  elevationDeg?: number;
  ecefXKm?: number;
  ecefYKm?: number;
  ecefZKm?: number;
  velocityXKmS?: number;
  velocityYKmS?: number;
  velocityZKmS?: number;
  usedObservationIds: string[];
  rejectedObservationIds: string[];
  sourceKinds: PositionSourceKind[];
  sourceCount: number;
  rmsResidualM?: number;
  estimatedHorizontal1SigmaM?: number;
  estimatedVertical1SigmaM?: number;
  quality: "HIGH" | "MEDIUM" | "LOW" | "UNAVAILABLE";
  note: string;
};

const WGS84_A_M = 6378137;
const WGS84_F = 1 / 298.257223563;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const ARCSEC_TO_RAD = DEG_TO_RAD / 3600;
const KM_TO_M = 1000;

const DEFAULT_CONFIG: Required<Pick<PrecisionPositionEngineConfig, "commonFrame" | "maxObservationAgeSeconds" | "minimumWeight">> = {
  commonFrame: "ITRF",
  maxObservationAgeSeconds: 300,
  minimumWeight: 1e-6,
};

function isFiniteNumber(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value);
}

function toDecimalYear(timestamp: string): number {
  const time = Date.parse(timestamp);
  if (!Number.isFinite(time)) return Number.NaN;
  const date = new Date(time);
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const end = Date.UTC(date.getUTCFullYear() + 1, 0, 1);
  return date.getUTCFullYear() + (time - start) / (end - start);
}

function applyHelmert(
  pointKm: [number, number, number],
  transform: HelmertTransform,
  observationTimestamp: string,
): [number, number, number] {
  const pointM = pointKm.map((value) => value * KM_TO_M) as [number, number, number];
  const epoch = toDecimalYear(observationTimestamp);
  const dt = Number.isFinite(epoch) && isFiniteNumber(transform.referenceEpochYear)
    ? epoch - transform.referenceEpochYear
    : 0;

  const t = [
    transform.translationM[0] + (transform.translationRateMmPerYear?.[0] ?? 0) * dt / 1000,
    transform.translationM[1] + (transform.translationRateMmPerYear?.[1] ?? 0) * dt / 1000,
    transform.translationM[2] + (transform.translationRateMmPerYear?.[2] ?? 0) * dt / 1000,
  ];
  const r = [
    (transform.rotationArcSec[0] + (transform.rotationRateArcSecPerYear?.[0] ?? 0) * dt) * ARCSEC_TO_RAD,
    (transform.rotationArcSec[1] + (transform.rotationRateArcSecPerYear?.[1] ?? 0) * dt) * ARCSEC_TO_RAD,
    (transform.rotationArcSec[2] + (transform.rotationRateArcSecPerYear?.[2] ?? 0) * dt) * ARCSEC_TO_RAD,
  ];
  const scale = 1 + (transform.scalePpm + (transform.scaleRatePpbPerYear ?? 0) * dt / 1000) * 1e-6;

  const x = pointM[0];
  const y = pointM[1];
  const z = pointM[2];

  const outX = t[0] + scale * (x - r[2] * y + r[1] * z);
  const outY = t[1] + scale * (r[2] * x + y - r[0] * z);
  const outZ = t[2] + scale * (-r[1] * x + r[0] * y + z);

  return [outX / KM_TO_M, outY / KM_TO_M, outZ / KM_TO_M];
}

function normalizeObservation(
  observation: CartesianPositionObservation,
  commonFrame: "ITRF" | "WGS84",
  transforms: Partial<Record<PositionFrame, HelmertTransform>>,
): CartesianPositionObservation | null {
  if (observation.referenceFrame === commonFrame) return observation;
  if (observation.referenceFrame === "ITRF" || observation.referenceFrame === "WGS84") {
    return { ...observation, referenceFrame: commonFrame };
  }

  const transform = transforms[observation.referenceFrame];
  if (!transform) return null;

  const ecef = applyHelmert(
    [observation.ecefXKm, observation.ecefYKm, observation.ecefZKm],
    transform,
    observation.timestamp,
  );

  return { ...observation, referenceFrame: commonFrame, ecefXKm: ecef[0], ecefYKm: ecef[1], ecefZKm: ecef[2] };
}

function observationWeight(observation: CartesianPositionObservation): number {
  if (!isFiniteNumber(observation.accuracyM) || observation.accuracyM <= 0) return 1;
  return 1 / Math.max(observation.accuracyM * observation.accuracyM, 0.0001);
}

function weightedCenter(observations: CartesianPositionObservation[]): [number, number, number] {
  let sumW = 0;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const observation of observations) {
    const w = observationWeight(observation);
    sumW += w;
    x += observation.ecefXKm * w;
    y += observation.ecefYKm * w;
    z += observation.ecefZKm * w;
  }
  return [x / sumW, y / sumW, z / sumW];
}

function distanceM(a: CartesianPositionObservation, center: [number, number, number]): number {
  const dx = (a.ecefXKm - center[0]) * KM_TO_M;
  const dy = (a.ecefYKm - center[1]) * KM_TO_M;
  const dz = (a.ecefZKm - center[2]) * KM_TO_M;
  return Math.hypot(dx, dy, dz);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function ecefToGeodetic([xKm, yKm, zKm]: [number, number, number]) {
  const x = xKm * KM_TO_M;
  const y = yKm * KM_TO_M;
  const z = zKm * KM_TO_M;
  const e2 = WGS84_F * (2 - WGS84_F);
  const p = Math.hypot(x, y);
  let latitude = Math.atan2(z, p * (1 - e2));

  for (let i = 0; i < 8; i += 1) {
    const sinLat = Math.sin(latitude);
    const n = WGS84_A_M / Math.sqrt(1 - e2 * sinLat * sinLat);
    latitude = Math.atan2(z + e2 * n * sinLat, p);
  }

  const sinLat = Math.sin(latitude);
  const cosLat = Math.cos(latitude);
  const n = WGS84_A_M / Math.sqrt(1 - e2 * sinLat * sinLat);
  const height = p / Math.max(cosLat, 1e-15) - n;
  const longitude = Math.atan2(y, x);

  return {
    latitudeDeg: latitude * RAD_TO_DEG,
    longitudeDeg: longitude * RAD_TO_DEG,
    altitudeKm: height / KM_TO_M,
  };
}

function deriveMotion(
  observations: CartesianPositionObservation[],
): { vx: number; vy: number; vz: number } | null {
  const withVelocity = observations.filter(
    (item) => isFiniteNumber(item.velocityXKmS) && isFiniteNumber(item.velocityYKmS) && isFiniteNumber(item.velocityZKmS),
  );
  if (withVelocity.length === 0) return null;
  const center = weightedCenter(withVelocity);
  let sumW = 0;
  let vx = 0;
  let vy = 0;
  let vz = 0;
  for (const observation of withVelocity) {
    const w = observationWeight(observation);
    sumW += w;
    vx += (observation.velocityXKmS ?? 0) * w;
    vy += (observation.velocityYKmS ?? 0) * w;
    vz += (observation.velocityZKmS ?? 0) * w;
  }
  void center;
  return { vx: vx / sumW, vy: vy / sumW, vz: vz / sumW };
}

function calculateHeadingElevation(
  ecef: [number, number, number],
  velocity: { vx: number; vy: number; vz: number } | null,
): { headingDeg?: number; elevationDeg?: number; speedKmS?: number; speedKmH?: number } {
  if (!velocity) return {};

  const [x, y, z] = ecef.map((value) => value * KM_TO_M);
  const lon = Math.atan2(y, x);
  const lat = Math.atan2(z, Math.hypot(x, y));

  const east = -Math.sin(lon) * velocity.vx + Math.cos(lon) * velocity.vy;
  const north = -Math.sin(lat) * Math.cos(lon) * velocity.vx
    - Math.sin(lat) * Math.sin(lon) * velocity.vy
    + Math.cos(lat) * velocity.vz;
  const up = Math.cos(lat) * Math.cos(lon) * velocity.vx
    + Math.cos(lat) * Math.sin(lon) * velocity.vy
    + Math.sin(lat) * velocity.vz;
  const speed = Math.hypot(east, north, up);

  return {
    headingDeg: (Math.atan2(east, north) * RAD_TO_DEG + 360) % 360,
    elevationDeg: Math.atan2(up, Math.hypot(east, north)) * RAD_TO_DEG,
    speedKmS: speed,
    speedKmH: speed * 3600,
  };
}

export function buildPositionObservation(input: {
  id: string;
  targetId: string;
  source: string;
  sourceKind: PositionSourceKind;
  timestamp: string;
  referenceFrame: PositionFrame;
  ecefXKm: number;
  ecefYKm: number;
  ecefZKm: number;
  velocityXKmS?: number;
  velocityYKmS?: number;
  velocityZKmS?: number;
  accuracyM?: number;
}): CartesianPositionObservation {
  return input;
}

export function gnssToPositionObservation(
  observation: GnssObservation,
): CartesianPositionObservation {
  return {
    id: observation.id,
    targetId: observation.targetId,
    source: observation.source,
    sourceKind: "GNSS",
    timestamp: observation.timestamp,
    referenceFrame: observation.referenceFrame,
    ecefXKm: observation.ecefXKm,
    ecefYKm: observation.ecefYKm,
    ecefZKm: observation.ecefZKm,
    velocityXKmS: observation.velocityXKmS,
    velocityYKmS: observation.velocityYKmS,
    velocityZKmS: observation.velocityZKmS,
    accuracyM: observation.rmsAccuracyM,
  };
}

export function astronomyToPositionObservation(
  observation: AstronomyObservation,
): CartesianPositionObservation | null {
  if (!isFiniteNumber(observation.ecefXKm) || !isFiniteNumber(observation.ecefYKm) || !isFiniteNumber(observation.ecefZKm)) {
    return null;
  }
  return {
    id: observation.id,
    targetId: observation.targetId,
    source: observation.source,
    sourceKind: "ASTRONOMY",
    timestamp: observation.timestamp,
    referenceFrame: observation.frame,
    ecefXKm: observation.ecefXKm,
    ecefYKm: observation.ecefYKm,
    ecefZKm: observation.ecefZKm,
    accuracyM: isFiniteNumber(observation.uncertaintyArcSec) ? Math.max(observation.uncertaintyArcSec, 0.01) * 0.03 : undefined,
  };
}

export function solvePrecisionPosition(
  observations: CartesianPositionObservation[],
  config: PrecisionPositionEngineConfig = {},
): PrecisionPositionSolution {
  const merged = { ...DEFAULT_CONFIG, ...config };
  const timestamp = new Date().toISOString();

  if (observations.length === 0) {
    return {
      status: "INSUFFICIENT_DATA",
      timestamp,
      referenceFrame: merged.commonFrame,
      usedObservationIds: [],
      rejectedObservationIds: [],
      sourceKinds: [],
      sourceCount: 0,
      quality: "UNAVAILABLE",
      note: "No position observations were supplied.",
    };
  }

  const targetIds = new Set(observations.map((item) => item.targetId));
  if (targetIds.size !== 1) {
    return {
      status: "TARGET_MISMATCH",
      timestamp,
      referenceFrame: merged.commonFrame,
      usedObservationIds: [],
      rejectedObservationIds: observations.map((item) => item.id),
      sourceKinds: [...new Set(observations.map((item) => item.sourceKind))],
      sourceCount: 0,
      quality: "UNAVAILABLE",
      note: "Observations from different physical targets must never be fused into one coordinate solution.",
    };
  }

  const validTime = observations.filter((item) => {
    const t = Date.parse(item.timestamp);
    return Number.isFinite(t) && Math.abs(Date.now() - t) <= merged.maxObservationAgeSeconds * 1000;
  });

  const normalized: CartesianPositionObservation[] = [];
  const frameBlocked: string[] = [];
  for (const observation of validTime) {
    const normalizedObservation = normalizeObservation(observation, merged.commonFrame, merged.transforms ?? {});
    if (normalizedObservation) normalized.push(normalizedObservation);
    else frameBlocked.push(observation.id);
  }

  if (normalized.length === 0) {
    return {
      status: "FRAME_BLOCKED",
      targetId: [...targetIds][0],
      timestamp,
      referenceFrame: merged.commonFrame,
      usedObservationIds: [],
      rejectedObservationIds: [...new Set([...frameBlocked, ...observations.filter((item) => !validTime.includes(item)).map((item) => item.id)])],
      sourceKinds: [...new Set(observations.map((item) => item.sourceKind))],
      sourceCount: 0,
      quality: "UNAVAILABLE",
      note: "No time-valid observations could be normalized into the common terrestrial frame. Supply explicit frame transforms for PZ90/GTRF/CGCS2000/TEME/GCRS as required.",
    };
  }

  if (normalized.length < 2) {
    const single = normalized[0];
    const ecef: [number, number, number] = [single.ecefXKm, single.ecefYKm, single.ecefZKm];
    const geo = ecefToGeodetic(ecef);
    const velocity = deriveMotion(normalized);
    const motion = calculateHeadingElevation(ecef, velocity);
    return {
      status: "SOLVED",
      targetId: single.targetId,
      timestamp: single.timestamp,
      referenceFrame: merged.commonFrame,
      ...geo,
      ecefXKm: single.ecefXKm,
      ecefYKm: single.ecefYKm,
      ecefZKm: single.ecefZKm,
      velocityXKmS: velocity?.vx,
      velocityYKmS: velocity?.vy,
      velocityZKmS: velocity?.vz,
      ...motion,
      usedObservationIds: [single.id],
      rejectedObservationIds: frameBlocked,
      sourceKinds: [single.sourceKind],
      sourceCount: 1,
      rmsResidualM: 0,
      estimatedHorizontal1SigmaM: single.accuracyM,
      estimatedVertical1SigmaM: single.accuracyM,
      quality: (single.accuracyM ?? Infinity) <= 0.2 ? "HIGH" : (single.accuracyM ?? Infinity) <= 5 ? "MEDIUM" : "LOW",
      note: "Single-source fallback. Fusion confidence requires at least two independent observations.",
    };
  }

  const initialCenter = weightedCenter(normalized);
  const residuals = normalized.map((item) => distanceM(item, initialCenter));
  const centerResidual = median(residuals);
  const deviations = residuals.map((value) => Math.abs(value - centerResidual));
  const mad = median(deviations);
  const robustThreshold = Math.max(0.25, centerResidual + 4.0 * Math.max(mad, 0.01));

  const used = normalized.filter((item, index) => residuals[index] <= robustThreshold);
  const rejected = normalized.filter((item, index) => residuals[index] > robustThreshold);
  const finalSet = used.length >= 2 ? used : normalized;

  const center = weightedCenter(finalSet);
  const finalResiduals = finalSet.map((item) => distanceM(item, center));
  const rmsResidualM = Math.sqrt(finalResiduals.reduce((sum, value) => sum + value * value, 0) / finalResiduals.length);
  const accuracyWeights = finalSet.map(observationWeight);
  const sumWeights = accuracyWeights.reduce((sum, value) => sum + value, 0);
  const sigma = sumWeights > 0 ? Math.sqrt(1 / sumWeights) : undefined;
  const geo = ecefToGeodetic(center);
  const velocity = deriveMotion(finalSet);
  const motion = calculateHeadingElevation(center, velocity);

  const quality: PrecisionPositionSolution["quality"] =
    rmsResidualM <= 0.05 && (sigma === undefined || sigma <= 0.05)
      ? "HIGH"
      : rmsResidualM <= 2 && (sigma === undefined || sigma <= 2)
        ? "MEDIUM"
        : "LOW";

  return {
    status: "SOLVED",
    targetId: finalSet[0].targetId,
    timestamp: new Date(Math.max(...finalSet.map((item) => Date.parse(item.timestamp)))).toISOString(),
    referenceFrame: merged.commonFrame,
    ...geo,
    ecefXKm: center[0],
    ecefYKm: center[1],
    ecefZKm: center[2],
    velocityXKmS: velocity?.vx,
    velocityYKmS: velocity?.vy,
    velocityZKmS: velocity?.vz,
    ...motion,
    usedObservationIds: finalSet.map((item) => item.id),
    rejectedObservationIds: [...rejected.map((item) => item.id), ...frameBlocked],
    sourceKinds: [...new Set(finalSet.map((item) => item.sourceKind))],
    sourceCount: finalSet.length,
    rmsResidualM,
    estimatedHorizontal1SigmaM: sigma,
    estimatedVertical1SigmaM: sigma,
    quality,
    note: "Weighted ECEF fusion with target matching, time gating, explicit frame normalization, and robust residual rejection. This is a fusion layer, not a substitute for carrier-phase RTK/PPP estimation.",
  };
}
