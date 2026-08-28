import {
  NetworkProbe,
  type NetworkProbeTarget,
  type NetworkProbeResult,
} from "./network-probe";

import {
  ReachabilityMatrix,
  type ReachabilityRecord,
  type ReachabilityTarget,
} from "./reachability-matrix";

export interface ReachabilityProbeResult {
  target: ReachabilityTarget;
  probe: NetworkProbeResult;
  recorded: boolean;
}

export class ReachabilityProbeRunner {
  private readonly probe = new NetworkProbe();

  public async run(
    target: ReachabilityTarget,
    matrix: ReachabilityMatrix,
  ): Promise<ReachabilityProbeResult> {
    const probeTarget: NetworkProbeTarget = {
      id: target.id,
      name: target.name,
      host: target.host,
      port: target.port,
    };

    const result =
      await this.probe.probe(
        probeTarget,
      );

    const record: ReachabilityRecord = {
      targetId: target.id,
      targetName: target.name,
      host: target.host,
      port: target.port,
      protocol: target.protocol,

      tcpStatus:
        result.tcpStatus,

      tlsStatus:
        result.tcpStatus === "UP"
          ? "UNKNOWN"
          : result.tcpStatus,

      dnsStatus:
        result.dnsStatus,

      httpStatus:
        result.tcpStatus === "UP"
          ? "UNKNOWN"
          : result.tcpStatus,

      latencyMs:
        result.latencyMs,

      packetLossPercent:
        result.overallStatus === "UP"
          ? 0
          : result.overallStatus ===
              "DEGRADED"
            ? null
            : 100,

      overallStatus:
        result.overallStatus,

      measuredAt:
        result.measuredAt,
    };

    matrix.record(record);

    return {
      target,
      probe: result,
      recorded: true,
    };
  }

  public async runAll(
    targets: ReachabilityTarget[],
    matrix: ReachabilityMatrix,
  ): Promise<ReachabilityProbeResult[]> {
    const results: ReachabilityProbeResult[] = [];

    for (const target of targets) {
      const result =
        await this.run(
          target,
          matrix,
        );

      results.push(result);
    }

    return results;
  }
}