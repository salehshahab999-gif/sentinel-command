import type {
  EarlyWarningResult,
} from "./early-warning";

import type {
  CorrelatedWarning,
} from "./early-warning-correlator";

import type {
  ResourceDecision,
  ResourceSnapshot,
} from "./resource-governor";

export type OperationalMode =
  | "NORMAL"
  | "WATCH"
  | "PRE_SURVIVAL"
  | "LOCAL_SURVIVAL"
  | "EMERGENCY";

export interface ResilienceDecision {
  mode: OperationalMode;

  riskScore: number;

  warningLevel: EarlyWarningResult["level"];

  historicalPatternMatched: boolean;

  enableLocalAI: boolean;
  enableHeavyAnalysis: boolean;
  enableSourceRefresh: boolean;
  enableNetworkProbes: boolean;

  probeIntervalMs: number;
  maxConcurrentJobs: number;

  reasons: string[];

  generatedAt: string;
}

export class ResilienceDecisionEngine {
  public decide(
    warning: EarlyWarningResult,
    correlation: CorrelatedWarning,
    resources: ResourceDecision,
    snapshot: ResourceSnapshot,
  ): ResilienceDecision {
    const reasons: string[] = [];

    let mode: OperationalMode;

    if (snapshot.cpuPercent >= 85) {
      mode = "EMERGENCY";

      reasons.push(
        "Critical CPU pressure",
      );
    } else if (snapshot.memoryPercent >= 92) {
      mode = "EMERGENCY";

      reasons.push(
        "Critical memory pressure",
      );
    } else if (!snapshot.remoteAvailable) {
      mode = "LOCAL_SURVIVAL";

      reasons.push(
        "Remote service is unavailable",
      );
    } else if (
      warning.level === "CRITICAL" ||
      correlation.level === "CRITICAL"
    ) {
      mode = "PRE_SURVIVAL";

      reasons.push(
        "Critical network or historical risk detected while remote access remains available",
      );
    } else if (
      correlation.level === "HIGH" ||
      warning.level === "HIGH" ||
      correlation.riskScore >= 50
    ) {
      mode = "PRE_SURVIVAL";

      reasons.push(
        "High network risk detected",
      );
    } else if (
      correlation.level === "WATCH" ||
      warning.level === "WATCH" ||
      resources.mode === "WATCH"
    ) {
      mode = "WATCH";

      reasons.push(
        "Elevated network or system observation required",
      );
    } else {
      mode = "NORMAL";

      reasons.push(
        "System and network conditions are normal",
      );
    }

    if (correlation.patternMatched) {
      reasons.push(
        `Historical pattern matched: ${
          correlation.matchingIncidentName ??
          "unknown incident"
        }`,
      );
    }

    if (snapshot.queueDepth >= 100) {
      reasons.push(
        "Sync queue depth is high",
      );
    }

    if (!snapshot.networkHealthy) {
      reasons.push(
        "Network health is degraded",
      );
    }

    if (!snapshot.remoteAvailable) {
      reasons.push(
        "Remote service is unavailable",
      );
    }

    const effectiveLocalAI =
      mode === "LOCAL_SURVIVAL" ||
      mode === "PRE_SURVIVAL";

    const effectiveHeavyAnalysis =
      mode === "NORMAL";

    const effectiveSourceRefresh =
      mode === "NORMAL" ||
      mode === "WATCH";

    const effectiveNetworkProbes =
      mode !== "EMERGENCY";

    const effectiveProbeInterval =
      mode === "LOCAL_SURVIVAL"
        ? 5_000
        : mode === "PRE_SURVIVAL"
          ? 10_000
          : mode === "WATCH"
            ? 15_000
            : 30_000;

    const effectiveConcurrency =
      mode === "EMERGENCY"
        ? 1
        : mode === "LOCAL_SURVIVAL"
          ? 2
          : mode === "PRE_SURVIVAL"
            ? 2
            : mode === "WATCH"
              ? 3
              : 4;

    return {
      mode,
      riskScore: correlation.riskScore,
      warningLevel: warning.level,
      historicalPatternMatched:
        correlation.patternMatched,

      enableLocalAI:
        effectiveLocalAI,

      enableHeavyAnalysis:
        effectiveHeavyAnalysis,

      enableSourceRefresh:
        effectiveSourceRefresh,

      enableNetworkProbes:
        effectiveNetworkProbes,

      probeIntervalMs:
        effectiveProbeInterval,

      maxConcurrentJobs:
        effectiveConcurrency,

      reasons,

      generatedAt:
        new Date().toISOString(),
    };
  }
}