import type {
  NetworkBaseline,
  NetworkBaselineTracker,
  NetworkMeasurement,
} from "./network-baseline";

export type ProtocolStatus =
  | "UP"
  | "DOWN"
  | "DEGRADED"
  | "UNKNOWN";

export interface ReachabilityTarget {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: "TCP" | "UDP";
  critical: boolean;
}

export interface ReachabilityRecord {
  targetId: string;
  targetName: string;
  host: string;
  port: number;
  protocol: "TCP" | "UDP";

  tcpStatus: ProtocolStatus;
  tlsStatus: ProtocolStatus;
  dnsStatus: ProtocolStatus;
  httpStatus: ProtocolStatus;

  latencyMs: number | null;
  packetLossPercent: number | null;

  overallStatus: ProtocolStatus;
  measuredAt: string;
}

export interface ReachabilityAssessment {
  target: ReachabilityTarget;
  current: ReachabilityRecord;
  baseline: NetworkBaseline | null;

  statusChanged: boolean;
  latencyChangeMs: number | null;
  successRateChange: number | null;

  degradationScore: number;
}

export class ReachabilityMatrix {
  private readonly targets = new Map<
    string,
    ReachabilityTarget
  >();

  private readonly records = new Map<
    string,
    ReachabilityRecord
  >();

  public registerTarget(
    target: ReachabilityTarget,
  ): void {
    this.targets.set(target.id, target);
  }

  public removeTarget(targetId: string): void {
    this.targets.delete(targetId);
    this.records.delete(targetId);
  }

  public record(
    record: ReachabilityRecord,
  ): void {
    if (!this.targets.has(record.targetId)) {
      throw new Error(
        `Unknown reachability target: ${record.targetId}`,
      );
    }

    this.records.set(
      record.targetId,
      record,
    );
  }

  public getTarget(
    targetId: string,
  ): ReachabilityTarget | null {
    return this.targets.get(targetId) ?? null;
  }

  public getRecord(
    targetId: string,
  ): ReachabilityRecord | null {
    return this.records.get(targetId) ?? null;
  }

  public getAllTargets(): ReachabilityTarget[] {
    return Array.from(this.targets.values());
  }

  public getAllRecords(): ReachabilityRecord[] {
    return Array.from(this.records.values());
  }

  public assess(
    targetId: string,
    baselineTracker: NetworkBaselineTracker,
  ): ReachabilityAssessment {
    const target = this.targets.get(targetId);
    const current = this.records.get(targetId);

    if (!target) {
      throw new Error(
        `Unknown reachability target: ${targetId}`,
      );
    }

    if (!current) {
      throw new Error(
        `No reachability record for target: ${targetId}`,
      );
    }

    const measurement: NetworkMeasurement = {
      target: target.id,
      host: target.host,
      port: target.port,
      status: current.overallStatus,
      latencyMs: current.latencyMs,
      measuredAt: current.measuredAt,
    };

    const comparison =
      baselineTracker.compare(measurement);

    const degradationScore =
      this.calculateDegradationScore(
        current,
        comparison,
      );

    return {
      target,
      current,
      baseline: comparison.baseline,
      statusChanged: comparison.statusChanged,
      latencyChangeMs:
        comparison.latencyChangeMs,
      successRateChange:
        comparison.successRateChange,
      degradationScore,
    };
  }

  public assessAll(
    baselineTracker: NetworkBaselineTracker,
  ): ReachabilityAssessment[] {
    const assessments: ReachabilityAssessment[] = [];

    for (const targetId of this.records.keys()) {
      assessments.push(
        this.assess(
          targetId,
          baselineTracker,
        ),
      );
    }

    return assessments.sort(
      (a, b) =>
        b.degradationScore -
        a.degradationScore,
    );
  }

  public getCriticalFailures(): ReachabilityAssessment[] {
    const failures: ReachabilityAssessment[] = [];

    for (const target of this.targets.values()) {
      if (!target.critical) {
        continue;
      }

      const record = this.records.get(target.id);

      if (!record) {
        continue;
      }

      if (
        record.overallStatus === "DOWN" ||
        record.overallStatus === "DEGRADED"
      ) {
        failures.push({
          target,
          current: record,
          baseline: null,
          statusChanged:
            record.overallStatus === "DOWN" ||
            record.overallStatus ===
              "DEGRADED",
          latencyChangeMs: null,
          successRateChange: null,
          degradationScore: this.calculateSimpleScore(
            record,
          ),
        });
      }
    }

    return failures.sort(
      (a, b) =>
        b.degradationScore -
        a.degradationScore,
    );
  }

  public clearRecords(): void {
    this.records.clear();
  }

  private calculateDegradationScore(
    record: ReachabilityRecord,
    comparison: {
      statusChanged: boolean;
      latencyChangeMs: number | null;
      successRateChange: number | null;
    },
  ): number {
    let score = 0;

    if (record.overallStatus === "DOWN") {
      score += 60;
    } else if (
      record.overallStatus === "DEGRADED"
    ) {
      score += 35;
    }

    if (record.tcpStatus === "DOWN") {
      score += 15;
    }

    if (record.tlsStatus === "DOWN") {
      score += 10;
    }

    if (record.dnsStatus === "DOWN") {
      score += 10;
    }

    if (record.httpStatus === "DOWN") {
      score += 10;
    }

    if (comparison.statusChanged) {
      score += 10;
    }

    if (
      comparison.latencyChangeMs !== null
    ) {
      if (
        comparison.latencyChangeMs >= 200
      ) {
        score += 15;
      } else if (
        comparison.latencyChangeMs >= 100
      ) {
        score += 10;
      } else if (
        comparison.latencyChangeMs >= 50
      ) {
        score += 5;
      }
    }

    if (
      comparison.successRateChange !==
        null &&
      comparison.successRateChange <= -20
    ) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  private calculateSimpleScore(
    record: ReachabilityRecord,
  ): number {
    let score = 0;

    if (record.overallStatus === "DOWN") {
      score += 60;
    } else if (
      record.overallStatus === "DEGRADED"
    ) {
      score += 35;
    }

    if (record.tcpStatus === "DOWN") {
      score += 15;
    }

    if (record.tlsStatus === "DOWN") {
      score += 10;
    }

    if (record.dnsStatus === "DOWN") {
      score += 10;
    }

    if (record.httpStatus === "DOWN") {
      score += 10;
    }

    return Math.min(score, 100);
  }
}