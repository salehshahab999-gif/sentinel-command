import type {
  ReachabilityAssessment,
} from "./reachability-matrix";

export type EarlyWarningLevel =
  | "NORMAL"
  | "WATCH"
  | "HIGH"
  | "CRITICAL";

export interface EarlyWarningResult {
  level: EarlyWarningLevel;
  score: number;
  affectedTargets: number;
  criticalFailures: number;
  reasons: string[];
  generatedAt: string;
}

export interface EarlyWarningThresholds {
  watchScore: number;
  highScore: number;
  criticalScore: number;
}

const DEFAULT_THRESHOLDS: EarlyWarningThresholds = {
  watchScore: 20,
  highScore: 45,
  criticalScore: 70,
};

export class EarlyWarningEngine {
  private readonly thresholds: EarlyWarningThresholds;

  public constructor(
    thresholds: Partial<EarlyWarningThresholds> = {},
  ) {
    this.thresholds = {
      ...DEFAULT_THRESHOLDS,
      ...thresholds,
    };
  }

  public evaluate(
    assessments: ReachabilityAssessment[],
  ): EarlyWarningResult {
    if (assessments.length === 0) {
      return {
        level: "NORMAL",
        score: 0,
        affectedTargets: 0,
        criticalFailures: 0,
        reasons: [
          "No reachability assessments available",
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    const affectedTargets = assessments.filter(
      (assessment) =>
        assessment.current.overallStatus === "DOWN" ||
        assessment.current.overallStatus === "DEGRADED",
    ).length;

    const criticalFailures = assessments.filter(
      (assessment) =>
        assessment.target.critical &&
        (
          assessment.current.overallStatus === "DOWN" ||
          assessment.current.overallStatus === "DEGRADED"
        ),
    ).length;

    const averageDegradationScore =
      assessments.reduce(
        (sum, assessment) =>
          sum + assessment.degradationScore,
        0,
      ) / assessments.length;

    const highestDegradationScore = Math.max(
      ...assessments.map(
        (assessment) =>
          assessment.degradationScore,
      ),
    );

    let score = averageDegradationScore;

    if (affectedTargets >= 2) {
      score += 10;
    }

    if (affectedTargets >= 4) {
      score += 10;
    }

    if (criticalFailures >= 1) {
      score += 10;
    }

    if (criticalFailures >= 2) {
      score += 10;
    }

    if (highestDegradationScore >= 80) {
      score += 10;
    }

    score = Math.min(
      Math.round(score),
      100,
    );

    const reasons: string[] = [];

    if (affectedTargets > 0) {
      reasons.push(
        `${affectedTargets} target(s) degraded or unavailable`,
      );
    }

    if (criticalFailures > 0) {
      reasons.push(
        `${criticalFailures} critical target(s) affected`,
      );
    }

    if (highestDegradationScore >= 80) {
      reasons.push(
        "At least one target has severe degradation",
      );
    }

    if (assessments.some(
      (assessment) =>
        assessment.current.tlsStatus === "DOWN",
    )) {
      reasons.push(
        "TLS failures detected",
      );
    }

    if (assessments.some(
      (assessment) =>
        assessment.current.dnsStatus === "DOWN",
    )) {
      reasons.push(
        "DNS failures detected",
      );
    }

    if (assessments.some(
      (assessment) =>
        assessment.current.tcpStatus === "DOWN",
    )) {
      reasons.push(
        "TCP failures detected",
      );
    }

    if (assessments.some(
      (assessment) =>
        assessment.latencyChangeMs !== null &&
        assessment.latencyChangeMs >= 100,
    )) {
      reasons.push(
        "Significant latency increase detected",
      );
    }

    if (reasons.length === 0) {
      reasons.push(
        "Network conditions appear normal",
      );
    }

    return {
      level: this.getLevel(score),
      score,
      affectedTargets,
      criticalFailures,
      reasons,
      generatedAt: new Date().toISOString(),
    };
  }

  private getLevel(
    score: number,
  ): EarlyWarningLevel {
    if (
      score >= this.thresholds.criticalScore
    ) {
      return "CRITICAL";
    }

    if (
      score >= this.thresholds.highScore
    ) {
      return "HIGH";
    }

    if (
      score >= this.thresholds.watchScore
    ) {
      return "WATCH";
    }

    return "NORMAL";
  }
}