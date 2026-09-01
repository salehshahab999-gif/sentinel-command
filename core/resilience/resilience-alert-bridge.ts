import type {
  SentinelEvent,
  EventSeverity,
} from "../events/Event";

import {
  processEventPipeline,
} from "../events/event-pipeline";

import type {
  ResilienceDecision,
} from "./resilience-decision-engine";

export interface ResilienceAlertBridgeResult {
  event: SentinelEvent;
  alertId: string;
  mode: ResilienceDecision["mode"];
  severity: EventSeverity;
}

export async function publishResilienceDecision(
  decision: ResilienceDecision,
): Promise<ResilienceAlertBridgeResult> {
  const severity =
    mapDecisionSeverity(
      decision,
    );

  const event: SentinelEvent = {
    id: `RESILIENCE-${Date.now()}`,

    timestamp:
      decision.generatedAt,

    type:
      `RESILIENCE_${decision.mode}`,

    source:
      "CORE",

    severity,

    status:
      "NEW",

    description:
      buildDescription(
        decision,
      ),

    data: {
      mode:
        decision.mode,

      riskScore:
        decision.riskScore,

      warningLevel:
        decision.warningLevel,

      historicalPatternMatched:
        decision.historicalPatternMatched,

      enableLocalAI:
        decision.enableLocalAI,

      enableHeavyAnalysis:
        decision.enableHeavyAnalysis,

      enableSourceRefresh:
        decision.enableSourceRefresh,

      enableNetworkProbes:
        decision.enableNetworkProbes,

      probeIntervalMs:
        decision.probeIntervalMs,

      maxConcurrentJobs:
        decision.maxConcurrentJobs,

      reasons:
        decision.reasons,
    },
  };

  const pipeline =
    await processEventPipeline([
      event,
    ]);

  const alert =
    pipeline.alerts[0];

  if (!alert) {
    throw new Error(
      "Resilience alert was not created by the event pipeline",
    );
  }

  return {
    event,
    alertId:
      alert.id,

    mode:
      decision.mode,

    severity,
  };
}

function mapDecisionSeverity(
  decision: ResilienceDecision,
): EventSeverity {
  switch (decision.mode) {
    case "NORMAL":
      return "INFO";

    case "WATCH":
      return "WARNING";

    case "PRE_SURVIVAL":
      return "ERROR";

    case "LOCAL_SURVIVAL":
      return "WARNING";

    case "EMERGENCY":
      return "CRITICAL";

    default:
      return "INFO";
  }
}

function buildDescription(
  decision: ResilienceDecision,
): string {
  const reasons =
    decision.reasons.length > 0
      ? decision.reasons.join(
          " | ",
        )
      : "No additional reasons";

  return [
    `Resilience mode: ${decision.mode}`,
    `Risk score: ${decision.riskScore}`,
    `Warning level: ${decision.warningLevel}`,
    `Historical pattern matched: ${
      decision.historicalPatternMatched
    }`,
    `Reasons: ${reasons}`,
  ].join(" | ");
}