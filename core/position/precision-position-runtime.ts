import {
  solvePrecisionPosition,
  type CartesianPositionObservation,
  type PrecisionPositionEngineConfig,
  type PrecisionPositionSolution,
} from "./precision-position-engine";

export type PrecisionPositionRuntime = {
  liveEnabled: boolean;
  engine: "WEIGHTED_ECEF_FUSION";
  config: PrecisionPositionEngineConfig;
};

const LIVE_ENV = "SENTINEL_PRECISION_POSITION_LIVE";

export const PRECISION_POSITION_RUNTIME: PrecisionPositionRuntime = {
  liveEnabled: process.env[LIVE_ENV] === "1",
  engine: "WEIGHTED_ECEF_FUSION",
  config: {
    commonFrame: "WGS84",
    maxObservationAgeSeconds: 300,
  },
};

export function runPrecisionPosition(
  observations: CartesianPositionObservation[],
  config: PrecisionPositionEngineConfig = PRECISION_POSITION_RUNTIME.config,
): PrecisionPositionSolution {
  if (!PRECISION_POSITION_RUNTIME.liveEnabled) {
    const result = solvePrecisionPosition(observations, config);
    return {
      ...result,
      note: `${result.note} Runtime collection gate ${LIVE_ENV}=0; only supplied observations are processed.`,
    };
  }

  return solvePrecisionPosition(observations, config);
}
