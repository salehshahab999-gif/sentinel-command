import {
  ReachabilityProbeRunner,
} from "./reachability-probe-runner";

import {
  ReachabilityMatrix,
  type ReachabilityTarget,
  type ReachabilityAssessment,
} from "./reachability-matrix";

import {
  NetworkBaselineTracker,
} from "./network-baseline";

export interface LiveReachabilityCycleResult {
  assessments: ReachabilityAssessment[];
  criticalFailures: ReachabilityAssessment[];
  measuredAt: string;
}

export class LiveReachabilityCycle {
  private readonly runner =
    new ReachabilityProbeRunner();

  public async run(
    targets: ReachabilityTarget[],
    matrix: ReachabilityMatrix,
    baselineTracker: NetworkBaselineTracker,
  ): Promise<LiveReachabilityCycleResult> {
    if (targets.length === 0) {
      throw new Error(
        "At least one reachability target is required",
      );
    }

    for (const target of targets) {
      if (!matrix.getTarget(target.id)) {
        matrix.registerTarget(target);
      }
    }

    await this.runner.runAll(
      targets,
      matrix,
    );

    for (const record of matrix.getAllRecords()) {
      baselineTracker.record({
        target: record.targetId,
        host: record.host,
        port: record.port,
        status: record.overallStatus,
        latencyMs: record.latencyMs,
        measuredAt: record.measuredAt,
      });
    }

    const assessments =
      matrix.assessAll(
        baselineTracker,
      );

    const criticalFailures =
      matrix.getCriticalFailures();

    return {
      assessments,
      criticalFailures,
      measuredAt:
        new Date().toISOString(),
    };
  }
}