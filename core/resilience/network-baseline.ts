export type ReachabilityStatus =
  | "UP"
  | "DOWN"
  | "DEGRADED"
  | "UNKNOWN";

export interface NetworkMeasurement {
  target: string;
  host: string;
  port: number;
  status: ReachabilityStatus;
  latencyMs: number | null;
  measuredAt: string;
}

export interface NetworkBaseline {
  target: string;
  host: string;
  port: number;
  healthySamples: number;
  totalSamples: number;
  averageLatencyMs: number | null;
  successRate: number;
  baselineStatus: ReachabilityStatus;
  firstSeenAt: string;
  lastSeenAt: string;
}

export class NetworkBaselineTracker {
  private readonly samples = new Map<string, NetworkMeasurement[]>();

  public record(measurement: NetworkMeasurement): void {
    const key = this.getKey(measurement);

    const existing = this.samples.get(key) ?? [];

    existing.push(measurement);

    if (existing.length > 100) {
      existing.shift();
    }

    this.samples.set(key, existing);
  }

  public getBaseline(
    target: string,
    host: string,
    port: number,
  ): NetworkBaseline | null {
    const key = `${target}|${host}|${port}`;
    const measurements = this.samples.get(key);

    if (!measurements || measurements.length === 0) {
      return null;
    }

    const successful = measurements.filter(
      (item) => item.status === "UP",
    );

    const latencySamples = successful
      .map((item) => item.latencyMs)
      .filter(
        (value): value is number => value !== null,
      );

    const averageLatencyMs =
      latencySamples.length > 0
        ? Number(
            (
              latencySamples.reduce(
                (sum, value) => sum + value,
                0,
              ) / latencySamples.length
            ).toFixed(2),
          )
        : null;

    const successRate = Number(
      (
        (successful.length / measurements.length) *
        100
      ).toFixed(2),
    );

    const baselineStatus =
      successRate >= 95
        ? "UP"
        : successRate >= 70
          ? "DEGRADED"
          : "DOWN";

    return {
      target,
      host,
      port,
      healthySamples: successful.length,
      totalSamples: measurements.length,
      averageLatencyMs,
      successRate,
      baselineStatus,
      firstSeenAt: measurements[0].measuredAt,
      lastSeenAt:
        measurements[measurements.length - 1].measuredAt,
    };
  }

  public getAllBaselines(): NetworkBaseline[] {
    const results: NetworkBaseline[] = [];

    for (const measurements of this.samples.values()) {
      const first = measurements[0];

      const baseline = this.getBaseline(
        first.target,
        first.host,
        first.port,
      );

      if (baseline) {
        results.push(baseline);
      }
    }

    return results;
  }

  public compare(
    measurement: NetworkMeasurement,
  ): {
    baseline: NetworkBaseline | null;
    statusChanged: boolean;
    latencyChangeMs: number | null;
    successRateChange: number | null;
  } {
    const baseline = this.getBaseline(
      measurement.target,
      measurement.host,
      measurement.port,
    );

    if (!baseline) {
      return {
        baseline: null,
        statusChanged: false,
        latencyChangeMs: null,
        successRateChange: null,
      };
    }

    const latencyChangeMs =
      measurement.latencyMs !== null &&
      baseline.averageLatencyMs !== null
        ? Number(
            (
              measurement.latencyMs -
              baseline.averageLatencyMs
            ).toFixed(2),
          )
        : null;

    const currentSuccess =
      measurement.status === "UP" ? 100 : 0;

    const successRateChange = Number(
      (currentSuccess - baseline.successRate).toFixed(2),
    );

    return {
      baseline,
      statusChanged:
        measurement.status !== baseline.baselineStatus,
      latencyChangeMs,
      successRateChange,
    };
  }

  public clear(): void {
    this.samples.clear();
  }

  private getKey(
    measurement: NetworkMeasurement,
  ): string {
    return `${measurement.target}|${measurement.host}|${measurement.port}`;
  }
}