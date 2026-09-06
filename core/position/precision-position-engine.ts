import type { AstronomyObservation } from "../astronomy/astronomy-contracts";
import type { GnssObservation } from "../gnss/gnss-contracts";

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

const DEFAULT_CONFIG: Required<Pick<PrecisionPositionEngineConfig, "commonFrame" | "maxObservationAgeSeconds">> = {
  commonFrame: "WGS84",
  maxObservationAgeSeconds: 300,
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

function applyHelmert(pointKm: [number, number, number], transform: HelmertTransform, timestamp: string): [number, number, number] {
  const [x, y, z] = pointKm.map((value) => value * KM_TO_M);
  const epoch = toDecimalYear(timestamp);
  const dt = Number.isFinite(epoch) && isFiniteNumber(transform.referenceEpochYear) ? epoch - transform.referenceEpochYear : 0;

  const tx = transform.translationM[0] + (transform.translationRateMmPerYear?.[0] ?? 0) * dt / 1000;
  const ty = transform.translationM[1] + (transform.translationRateMmPerYear?.[1] ?? 0) * dt / 1000;
  const tz = transform.translationM[2] + (transform.translationRateMmPerYear?.[2] ?? 0) * dt / 1000;
  const rx = (transform.rotationArcSec[0] + (transform.rotationRateArcSecPerYear?.[0] ?? 0) * dt) * ARCSEC_TO_RAD;
  const ry = (transform.rotationArcSec[1] + (transform.rotationRateArcSecPerYear?.[1] ?? 0) * dt) * ARCSEC_TO_RAD;
  const rz = (transform.rotationArcSec[2] + (transform.rotationRateArcSecPerYear?.[2] ?? 0) * dt) * ARCSEC_TO_RAD;
  const scale = 1 + (transform.scalePpm + (transform.scaleRatePpbPerYear ?? 0) * dt / 1000) * 1e-6;

  return [
    (tx + scale * (x - rz * y + ry * z)) / KM_TO_M,
    (ty + scale * (rz * x + y - rx * z)) / KM_TO_M,
    (tz + scale * (-ry * x + rx * y + z)) / KM_TO_M,
  ];
}

function normalizeObservation(
  observation: CartesianPositionObservation,
  commonFrame: "ITRF" | "WGS84",
  transforms: Partial<Record<PositionFrame, HelmertTransform>>,
): CartesianPositionObservation | null {
  if (observation.referenceFrame === commonFrame) return observation;
  const transform = transforms[observation.referenceFrame];
  if (!transform) return null;
  const ecef = applyHelmert([observation.ecefXKm, observation.ecefYKm, observation.ecefZKm], transform, observation.timestamp);
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

function distanceM(observation: CartesianPositionObservation, center: [number, number, number]): number {
  return Math.hypot(
    (observation.ecefXKm - center[0]) * KM_TO_M,
    (observation.ecefYKm - center[1]) * KM_TO_M,
    (observation.ecefZKm - center[2]) * KM_TO_M,
  );
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
  const height = Math.abs(cosLat) < 1e-12 ? Math.abs(z) - n * (1 - e2) : p / cosLat - n;

  return {
    latitudeDeg: latitude * RAD_TO_DEG,
    longitudeDeg: Math.atan2(y, x) * RAD_TO_DEG,
    altitudeKm: height / KM_TO_M,
  };
}

function deriveVelocity(observations: CartesianPositionObservation[]) {
  const withVelocity = observations.filter((item) => isFiniteNumber(item.velocityXKmS) && isFiniteNumber(item.velocityYKmS) && isFiniteNumber(item.velocityZKmS));
  if (withVelocity.length === 0) return null;

  let sumW = 0;
  let vx = 0;
  let vy = 0;
  let vz = 0;
  for (const item of withVelocity) {
    const w = observationWeight(item);
    sumW += w;
    vx += (item.velocityXKmS ?? 0) * w;
    vy += (item.velocityYKmS ?? 0) * w;
    vz += (item.velocityZKmS ?? 0) * w;
  }
  return { vx: vx / sumW, vy: vy / sumW, vz: vz / sumW };
}

function motionInLocalFrame(ecefKm: [number, number, number], velocity: { vx: number; vy: number; vz: number } | null) {
  if (!velocity) return {};
  const [x, y, z] = ecefKm;
  const lon = Math.atan2(y, x);
  const lat = Math.atan2(z, Math.hypot(x, y));
  const east = -Math.sin(lon) * velocity.vx + Math.cos(lon) * velocity.vy;
  const north = -Math.sin(lat) * Math.cos(lon) * velocity.vx - Math.sin(lat) * Math.sin(lon) * velocity.vy + Math.cos(lat) * velocity.vz;
  const up = Math.cos(lat) * Math.cos(lon) * velocity.vx + Math.cos(lat) * Math.sin(lon) * velocity.vy + Math.sin(lat) * velocity.vz;
  const speedKmS = Math.hypot(east, north, up);
  return {
    headingDeg: (Math.atan2(east, north) * RAD_TO_DEG + 360) % 360,
    elevationDeg: Math.atan2(up, Math.hypot(east, north)) * RAD_TO_DEG,
    speedKmS,
    speedKmH: speedKmS * 3600,
  };
}

export function buildPositionObservation(input: CartesianPositionObservation): CartesianPositionObservation {
  return input;
}

export function gnssToPositionObservation(observation: GnssObservation): CartesianPositionObservation {
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

export function astronomyToPositionObservation(observation: AstronomyObservation): CartesianPositionObservation | null {
  if (!isFiniteNumber(observation.ecefXKm) || !isFiniteNumber(observation.ecefYKm) || !isFiniteNumber(observation.ecefZKm)) return null;
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
  };
}

export function solvePrecisionPosition(
  observations: CartesianPositionObservation[],
  config: PrecisionPositionEngineConfig = {},
): PrecisionPositionSolution {
  const merged = { ...DEFAULT_CONFIG, ...config };
  const timestamp = new Date().toISOString();

  if (observations.length === 0) {
    return { status: "INSUFFICIENT_DATA", timestamp, referenceFrame: merged.commonFrame, usedObservationIds: [], rejectedObservationIds: [], sourceKinds: [], sourceCount: 0, quality: "UNAVAILABLE", note: "No position observations were supplied." };
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
  const blocked: string[] = [];
  for (const observation of validTime) {
    const normalizedObservation = normalizeObservation(observation, merged.commonFrame, merged.transforms ?? {});
    if (normalizedObservation) normalized.push(normalizedObservation);
    else blocked.push(observation.id);
  }

  const staleIds = observations.filter((item) => !validTime.includes(item)).map((item) => item.id);
  if (normalized.length === 0) {
    return {
      status: "FRAME_BLOCKED",
      targetId: [...targetIds][0],
      timestamp,
      referenceFrame: merged.commonFrame,
      usedObservationIds: [],
      rejectedObservationIds: [...new Set([...blocked, ...staleIds])],
      sourceKinds: [...new Set(observations.map((item) => item.sourceKind))],
      sourceCount: 0,
      quality: "UNAVAILABLE",
      note: "No time-valid observation could be normalized into the common frame. Explicit frame transforms are required for PZ90/GTRF/CGCS2000/TEME/GCRS inputs.",
    };
  }

  if (normalized.length === 1) {
    const single = normalized[0];
    const ecef: [number, number, number] = [single.ecefXKm, single.ecefYKm, single.ecefZKm];
    const geo = ecefToGeodetic(ecef);
    const velocity = deriveVelocity(normalized);
    const motion = motionInLocalFrame(ecef, velocity);
    return {
      status: "SOLVED",
      targetId: single.targetId,
      timestamp: single.timestamp,
      referenceFrame: merged.commonFrame,
      ...geo,
      ...motion,
      ecefXKm: single.ecefXKm,
      ecefYKm: single.ecefYKm,
      ecefZKm: single.ecefZKm,
      velocityXKmS: velocity?.vx,
      velocityYKmS: velocity?.vy,
      velocityZKmS: velocity?.vz,
      usedObservationIds: [single.id],
      rejectedObservationIds: [...blocked, ...staleIds],
      sourceKinds: [single.sourceKind],
      sourceCount: 1,
      rmsResidualM: 0,
      estimatedHorizontal1SigmaM: single.accuracyM,
      estimatedVertical1SigmaM: single.accuracyM,
      quality: (single.accuracyM ?? Infinity) <= 0.2 ? "HIGH" : (single.accuracyM ?? Infinity) <= 5 ? "MEDIUM" : "LOW",
      note: "Single-source solution. Cross-source fusion confidence requires at least two independent, time-aligned observations.",
    };
  }

  const initialCenter = weightedCenter(normalized);
  const residuals = normalized.map((item) => distanceM(item, initialCenter));
  const centerResidual = median(residuals);
  const mad = median(residuals.map((value) => Math.abs(value - centerResidual)));
  const robustThreshold = Math.max(0.25, centerResidual + 4 * Math.max(mad, 0.01));

  const kept = normalized.filter((_, index) => residuals[index] <= robustThreshold);
  const rejected = normalized.filter((_, index) => residuals[index] > robustThreshold);
  const finalSet = kept.length >= 2 ? kept : normalized;
  const center = weightedCenter(finalSet);
  const finalResiduals = finalSet.map((item) => distanceM(item, center));
  const rmsResidualM = Math.sqrt(finalResiduals.reduce((sum, value) => sum + value * value, 0) / finalResiduals.length);
  const sumWeights = finalSet.reduce((sum, item) => sum + observationWeight(item), 0);
  const sigma = sumWeights > 0 ? Math.sqrt(1 / sumWeights) : undefined;
  const geo = ecefToGeodetic(center);
  const velocity = deriveVelocity(finalSet);
  const motion = motionInLocalFrame(center, velocity);
  const quality: PrecisionPositionSolution["quality"] = rmsResidualM <= 0.05 && (sigma === undefined || sigma <= 0.05) ? "HIGH" : rmsResidualM <= 2 && (sigma === undefined || sigma <= 2) ? "MEDIUM" : "LOW";

  return {
    status: "SOLVED",
    targetId: finalSet[0].targetId,
    timestamp: new Date(Math.max(...finalSet.map((item) => Date.parse(item.timestamp)))).toISOString(),
    referenceFrame: merged.commonFrame,
    ...geo,
    ...motion,
    ecefXKm: center[0],
    ecefYKm: center[1],
    ecefZKm: center[2],
    velocityXKmS: velocity?.vx,
    velocityYKmS: velocity?.vy,
    velocityZKmS: velocity?.vz,
    usedObservationIds: finalSet.map((item) => item.id),
    rejectedObservationIds: [...rejected.map((item) => item.id), ...blocked, ...staleIds],
    sourceKinds: [...new Set(finalSet.map((item) => item.sourceKind))],
    sourceCount: finalSet.length,
    rmsResidualM,
    estimatedHorizontal1SigmaM: sigma,
    estimatedVertical1SigmaM: sigma,
    quality,
    note: "Weighted ECEF fusion with target matching, time gating, explicit frame transforms, and robust residual rejection. It does not claim RTK/PPP precision without carrier-phase observations and precise products.",
  };
}
