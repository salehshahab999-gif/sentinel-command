import type {
  EarlyWarningResult,
} from "./early-warning";

import type {
  IncidentPatternMatch,
} from "./incident-memory";

export type CorrelatedRiskLevel =
  | "NORMAL"
  | "WATCH"
  | "HIGH"
  | "CRITICAL";

export interface CorrelatedWarning {
  level: CorrelatedRiskLevel;
  riskScore: number;
  networkScore: number;
  historicalSimilarity: number;
  historicalConfidence: number;

  patternMatched: boolean;

  matchingIncidentId: string | null;
  matchingIncidentName: string | null;

  reasons: string[];
  generatedAt: string;
}

export class EarlyWarningCorrelator {
  public correlate(
    warning: EarlyWarningResult,
    matches: IncidentPatternMatch[],
  ): CorrelatedWarning {
    const topMatch = matches[0] ?? null;

    const historicalSimilarity =
      topMatch?.similarityScore ?? 0;

    const historicalConfidence =
      topMatch?.confidence ?? 0;

    const historicalContribution =
      historicalSimilarity *
      historicalConfidence;

    const riskScore = Math.min(
      Math.round(
        warning.score * 0.7 +
          historicalContribution * 0.3,
      ),
      100,
    );

    const patternMatched =
      topMatch !== null &&
      historicalSimilarity >= 70 &&
      historicalConfidence >= 0.7;

    const reasons = [
      ...warning.reasons,
    ];

    if (patternMatched && topMatch) {
      reasons.push(
        `Historical pattern match: ${topMatch.incidentName}`,
      );

      reasons.push(
        `Historical similarity: ${topMatch.similarityScore}%`,
      );

      reasons.push(
        `Historical confidence: ${Math.round(
          topMatch.confidence * 100,
        )}%`,
      );
    } else {
      reasons.push(
        "No strong historical pattern match",
      );
    }

    return {
      level: this.getLevel(riskScore),
      riskScore,
      networkScore: warning.score,
      historicalSimilarity,
      historicalConfidence,
      patternMatched,
      matchingIncidentId:
        topMatch?.incidentId ?? null,
      matchingIncidentName:
        topMatch?.incidentName ?? null,
      reasons,
      generatedAt:
        new Date().toISOString(),
    };
  }

  private getLevel(
    score: number,
  ): CorrelatedRiskLevel {
    if (score >= 75) {
      return "CRITICAL";
    }

    if (score >= 50) {
      return "HIGH";
    }

    if (score >= 25) {
      return "WATCH";
    }

    return "NORMAL";
  }
}