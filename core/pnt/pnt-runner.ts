import {
  probeWindowsLocation,
  type WindowsLocationBridgeResult,
} from "./windows-location-bridge";

import type {
  PntObservation,
  PntPosition,
} from "./pnt-types";

function mapBridgeToPosition(
  result: WindowsLocationBridgeResult,
): PntPosition | null {
  if (!result.ok || !result.position) {
    return null;
  }

  return result.position;
}

function calculateHealth(
  result: WindowsLocationBridgeResult,
): number {
  if (!result.ok || !result.position) {
    return 0;
  }

  const accuracy = result.position.accuracyMeters;

  if (accuracy == null) {
    return 55;
  }

  if (accuracy <= 5) return 100;
  if (accuracy <= 20) return 90;
  if (accuracy <= 100) return 75;
  if (accuracy <= 1000) return 60;
  if (accuracy <= 5000) return 50;
  return 35;
}

function calculateConfidence(
  result: WindowsLocationBridgeResult,
): number {
  if (!result.ok || !result.position) {
    return 0;
  }

  const accuracy = result.position.accuracyMeters;

  if (accuracy == null) return 0.55;
  if (accuracy <= 5) return 0.98;
  if (accuracy <= 20) return 0.9;
  if (accuracy <= 100) return 0.75;
  if (accuracy <= 1000) return 0.6;
  if (accuracy <= 5000) return 0.5;
  return 0.3;
}

export function buildWindowsLocationObservation(
  result: WindowsLocationBridgeResult,
): PntObservation {
  const position = mapBridgeToPosition(result);

  return {
    sourceId: "WINDOWS_LOCATION",
    sourceKind: "WINDOWS",
    status: result.ok && position ? "AVAILABLE" : "FAILED",
    position,
    provider: result.provider ?? null,
    satelliteCount: null,
    confidence: calculateConfidence(result),
    healthScore: calculateHealth(result),
    lastSeenAt: result.ok && position ? position.observedAt : null,
    error: result.ok ? null : result.error ?? result.message ?? "UNKNOWN_ERROR",
  };
}

export async function runPnt(): Promise<PntObservation[]> {
  const windowsLocation = await probeWindowsLocation();
  return [buildWindowsLocationObservation(windowsLocation)];
}
