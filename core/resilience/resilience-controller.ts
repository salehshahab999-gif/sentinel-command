import {
  EarlyWarningCorrelator,
} from "./early-warning-correlator";

import {
  EarlyWarningEngine,
  type EarlyWarningResult,
} from "./early-warning";

import {
  ResilienceDecisionEngine,
  type ResilienceDecision,
} from "./resilience-decision-engine";

import {
  ResilienceStateMachine,
  type ResilienceTransition,
} from "./resilience-state";

import {
  decideResourceMode,
  type ResourceDecision,
  type ResourceSnapshot,
} from "./resource-governor";

import {
  IncidentMemory,
  type IncidentPatternMatch,
  type IncidentSignal,
} from "./incident-memory";

import type {
  ReachabilityAssessment,
} from "./reachability-matrix";

export interface ResilienceEvaluation {
  transition: ResilienceTransition;
  warning: EarlyWarningResult;
  correlationMatches: IncidentPatternMatch[];
  resources: ResourceDecision;
  decision: ResilienceDecision;
}

export class ResilienceController {
  private readonly stateMachine =
    new ResilienceStateMachine();

  private readonly warningEngine =
    new EarlyWarningEngine();

  private readonly correlator =
    new EarlyWarningCorrelator();

  private readonly decisionEngine =
    new ResilienceDecisionEngine();

  private readonly incidentMemory: IncidentMemory;

  public constructor(
    incidentMemory = new IncidentMemory(),
  ) {
    this.incidentMemory =
      incidentMemory;
  }

  public evaluate(
    snapshot: ResourceSnapshot,
    assessments: ReachabilityAssessment[],
  ): ResilienceEvaluation {
    const warning =
      this.warningEngine.evaluate(
        assessments,
      );

    const currentSignals =
      this.buildCurrentSignals(
        assessments,
      );

    const correlationMatches =
      this.incidentMemory.matchPattern(
        currentSignals,
      );

    const correlation =
      this.correlator.correlate(
        warning,
        correlationMatches,
      );

    const baseResources =
      decideResourceMode(snapshot);

    const decision =
      this.decisionEngine.decide(
        warning,
        correlation,
        baseResources,
        snapshot,
      );

    const transition =
      this.stateMachine.transitionTo(
        decision.mode,
        decision.reasons.join("; "),
      );

    const resources: ResourceDecision = {
      mode: decision.mode,

      enableNetworkProbes:
        decision.enableNetworkProbes,

      probeIntervalMs:
        decision.probeIntervalMs,

      enableLocalAI:
        decision.enableLocalAI,

      enableHeavyAnalysis:
        decision.enableHeavyAnalysis,

      enableSourceRefresh:
        decision.enableSourceRefresh,

      maxConcurrentJobs:
        decision.maxConcurrentJobs,

      reason:
        decision.reasons.join("; "),
    };

    return {
      transition,
      warning,
      correlationMatches,
      resources,
      decision,
    };
  }

  public getIncidentMemory(): IncidentMemory {
    return this.incidentMemory;
  }

  public getState() {
    return this.stateMachine.getState();
  }

  public reset(): void {
    this.stateMachine.reset();
  }

  private buildCurrentSignals(
    assessments: ReachabilityAssessment[],
  ): IncidentSignal[] {
    if (assessments.length === 0) {
      return [];
    }

    const total =
      assessments.length;

    const upCount =
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
          ) / latencyChanges.length
        : 0;

    const currentConfidence =
      Math.min(
        0.95,
        Math.max(
          0.5,
          assessments.length >= 3
            ? 0.9
            : 0.7,
        ),
      );

    const observedAt =
      new Date().toISOString();

    return [
      {
        name: "GLOBAL_REACHABILITY",
        value:
          (upCount / total) * 100,
        source:
          "Sentinel Reachability Matrix",
        observedAt,
        confidence:
          currentConfidence,
      },

      {
        name: "DNS_FAILURE",
        value:
          (dnsFailures / total) * 100,
        source:
          "Sentinel Reachability Matrix",
        observedAt,
        confidence:
          currentConfidence,
      },

      {
        name: "TLS_FAILURE",
        value:
          (tlsFailures / total) * 100,
        source:
          "Sentinel Reachability Matrix",
        observedAt,
        confidence:
          currentConfidence,
      },

      {
        name: "TCP_FAILURE",
        value:
          (tcpFailures / total) * 100,
        source:
          "Sentinel Reachability Matrix",
        observedAt,
        confidence:
          currentConfidence,
      },

      {
        name: "AVERAGE_LATENCY_CHANGE",
        value:
          Number(
            averageLatencyChange.toFixed(2),
          ),
        source:
          "Sentinel Reachability Matrix",
        observedAt,
        confidence:
          currentConfidence,
      },
    ];
  }
}