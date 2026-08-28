import {
  NetworkProbe,
  type NetworkProbeTarget,
  type NetworkProbeResult,
} from "./network-probe";

import {
  NetworkBaselineTracker,
  type NetworkMeasurement,
  type NetworkBaseline,
} from "./network-baseline";

export interface LiveBaselineTarget {
  id: string;
  name: string;
  host: string;
  port: number;
  timeoutMs?: number;
}

export interface LiveBaselineResult {
  target: LiveBaselineTarget;
  samplesCollected: number;
  successfulSamples: number;
  failedSamples: number;
  baseline: NetworkBaseline | null;
  lastProbe: NetworkProbeResult | null;
}

export class LiveBaselineRunner {
  private readonly probe =
    new NetworkProbe();

  public async collect(
    target: LiveBaselineTarget,
    tracker: NetworkBaselineTracker,
    sampleCount = 5,
    delayMs = 1_000,
  ): Promise<LiveBaselineResult> {
    if (sampleCount < 1) {
      throw new Error(
        "sampleCount must be at least 1",
      );
    }

    if (delayMs < 0) {
      throw new Error(
        "delayMs cannot be negative",
      );
    }

    let successfulSamples = 0;
    let failedSamples = 0;
    let lastProbe: NetworkProbeResult | null =
      null;

    for (let index = 0; index < sampleCount; index += 1) {
      const probeTarget: NetworkProbeTarget = {
        id: target.id,
        name: target.name,
        host: target.host,
        port: target.port,
        timeoutMs: target.timeoutMs,
      };

      const result =
        await this.probe.probe(
          probeTarget,
        );

      lastProbe = result;

      const measurement: NetworkMeasurement = {
        target: target.id,
        host: target.host,
        port: target.port,
        status: result.overallStatus,
        latencyMs: result.latencyMs,
        measuredAt: result.measuredAt,
      };

      tracker.record(measurement);

      if (
        result.overallStatus ===
        "UP"
      ) {
        successfulSamples += 1;
      } else {
        failedSamples += 1;
      }

      if (
        index < sampleCount - 1 &&
        delayMs > 0
      ) {
        await this.delay(
          delayMs,
        );
      }
    }

    const baseline =
      tracker.getBaseline(
        target.id,
        target.host,
        target.port,
      );

    return {
      target,
      samplesCollected:
        sampleCount,
      successfulSamples,
      failedSamples,
      baseline,
      lastProbe,
    };
  }

  private delay(
    milliseconds: number,
  ): Promise<void> {
    return new Promise(
      (resolve) => {
        setTimeout(
          resolve,
          milliseconds,
        );
      },
    );
  }
}