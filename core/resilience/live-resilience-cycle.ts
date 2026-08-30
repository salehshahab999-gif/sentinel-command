import {
  LiveReachabilityCycle,
} from "./live-reachability-cycle";

import {
  ReachabilityMatrix,
  type ReachabilityTarget,
} from "./reachability-matrix";

import {
  NetworkBaselineTracker,
} from "./network-baseline";

import {
  EarlyWarningEngine,
} from "./early-warning";

import {
  EarlyWarningCorrelator,
} from "./early-warning-correlator";

import {
  IncidentMemory,
  type IncidentSignal,
} from "./incident-memory";

import {
  ResilienceDecisionEngine,
  type ResilienceDecision,
} from "./resilience-decision-engine";

import {
  decideResourceMode,
  type ResourceSnapshot,
} from "./resource-governor";

import {
  publishResilienceDecision,
} from "./resilience-alert-bridge";

import {
  resolveAlert,
} from "../alerts/alert-repository";

export interface LiveResilienceCycleResult {
  decision: ResilienceDecision;

  warningLevel: string;
  warningScore: number;

  historicalMatches: number;
  historicalPatternMatched: boolean;

  assessmentsCount: number;
  criticalFailures: number;

  alertId: string | null;

  alertPublished: boolean;

  measuredAt: string;
}

export class LiveResilienceCycle {
  private readonly reachability =
    new LiveReachabilityCycle();

  private readonly warningEngine =
    new EarlyWarningEngine();

  private readonly correlator =
    new EarlyWarningCorrelator();

  private readonly decisionEngine =
    new ResilienceDecisionEngine();

  public async run(
    targets: ReachabilityTarget[],
    resources: ResourceSnapshot,
    incidentMemory: IncidentMemory,
    baselineTracker: NetworkBaselineTracker,
    matrix: ReachabilityMatrix,
  ): Promise<LiveResilienceCycleResult> {
    const reachabilityResult =
      await this.reachability.run(
        targets,
        matrix,
        baselineTracker,
      );

    const warning =
      this.warningEngine.evaluate(
        reachabilityResult.assessments,
      );

    const signals =
      this.buildSignals(
        reachabilityResult.assessments,
      );

    const historicalMatches =
      incidentMemory.matchPattern(
        signals,
      );

    const correlation =
      this.correlator.correlate(
        warning,
        historicalMatches,
      );

    const baseResources =
      decideResourceMode(
        resources,
      );

    const decision =
      this.decisionEngine.decide(
        warning,
        correlation,
        baseResources,
        resources,
      );

    let alertId: string | null = null;
    let alertPublished = false;

    if (
      decision.mode === "NORMAL"
    ) {
      await this.resolveResilienceAlerts();
    } else {
      const alert =
        await publishResilienceDecision(
          decision,
        );

      alertId =
        alert.alertId;

      alertPublished = true;
    }

    return {
      decision,

      warningLevel:
        warning.level,

      warningScore:
        warning.score,

      historicalMatches:
        historicalMatches.length,

      historicalPatternMatched:
        correlation.patternMatched,

      assessmentsCount:
        reachabilityResult.assessments.length,

      criticalFailures:
        reachabilityResult
          .criticalFailures.length,

      alertId,

      alertPublished,

      measuredAt:
        reachabilityResult.measuredAt,
    };
  }

  private async resolveResilienceAlerts(): Promise<void> {
    const resilienceModes: Array<
      Exclude<
        ResilienceDecision["mode"],
        "NORMAL"
      >
    > = [
      "WATCH",
      "PRE_SURVIVAL",
      "LOCAL_SURVIVAL",
      "EMERGENCY",
    ];

    for (
      const mode of resilienceModes
    ) {
      await resolveAlert(
        "CORE",
        `RESILIENCE_${mode}`,
      );
    }
  }

  private buildSignals(
    assessments: ReturnType<
      ReachabilityMatrix["assessAll"]
    >,
  ): IncidentSignal[] {
    if (assessments.length === 0) {
      return [];
    }

    const total =
      assessments.length;

    const reachable =
      assessments.filter(
        (assessment) =>
          assessment.current
            .overallStatus === "UP",
      ).length;

    const dnsFailures =
      assessments.filter(
        (assessment) =>
          assessment.current
            .dnsStatus === "DOWN",
      ).length;

    const tlsFailures =
      assessments.filter(
        (assessment) =>
          assessment.current
            .tlsStatus === "DOWN",
      ).length;

    const tcpFailures =
      assessments.filter(
        (assessment) =>
          assessment.current
            .tcpStatus === "DOWN",
      ).length;

    const latencyChanges =
      assessments
        .map(
          (assessment) =>
            assessment.latencyChangeMs,
        )
        .filter(
          (value): value is number =>
            value !== null,
        );

    const averageLatencyChange =
      latencyChanges.length > 0
        ? latencyChanges.reduce(
            (sum, value) =>
              sum + value,
            0,
          ) /
          latencyChanges.length
        : 0;

    const observedAt =
      new Date().toISOString();

    return [
      {
        name:
          "GLOBAL_REACHABILITY",
        value:
          (reachable / total) * 100,
        source:
          "Sentinel Live Reachability",
        observedAt,
        confidence: 0.9,
      },

      {
        name:
          "DNS_FAILURE",
        value:
          (dnsFailures / total) * 100,
        source:
          "Sentinel Live Reachability",
        observedAt,
        confidence: 0.9,
      },

      {
        name:
          "TLS_FAILURE",
        value:
          (tlsFailures / total) * 100,
        source:
          "Sentinel Live Reachability",
        observedAt,
        confidence: 0.9,
      },

      {
        name:
          "TCP_FAILURE",
        value:
          (tcpFailures / total) * 100,
        source:
          "Sentinel Live Reachability",
        observedAt,
        confidence: 0.9,
      },

      {
        name:
          "AVERAGE_LATENCY_CHANGE",
        value:
          Number(
            averageLatencyChange.toFixed(
              2,
            ),
          ),
        source:
          "Sentinel Live Reachability",
        observedAt,
        confidence: 0.85,
      },
    ];
  }
}