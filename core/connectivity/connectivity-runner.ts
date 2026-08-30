import {
  NetworkProbe,
} from "../resilience/network-probe";

import {
  probeDns,
} from "./dns-probe";

import {
  CONNECTIVITY_REGISTRY,
} from "./connectivity-registry";

import type {
  ConnectivityObservation,
  ConnectivityScope,
} from "./connectivity-types";

export interface ConnectivityRunResult {
  observations: ConnectivityObservation[];
  globalReachabilityPercent: number;
  domesticReachabilityPercent: number;
}

type ConnectivityExecutionResult = {
  target: (typeof CONNECTIVITY_REGISTRY)[number];
  dnsResult: Awaited<
    ReturnType<typeof probeDns>
  > | null;
  tcpResult:
    | Awaited<
        ReturnType<NetworkProbe["probe"]>
      >
    | null;
};

export class ConnectivityRunner {
  private readonly probe =
    new NetworkProbe();

  public async run(): Promise<ConnectivityRunResult> {
    const targets =
      CONNECTIVITY_REGISTRY.filter(
        (target) => target.enabled,
      );

    const results: ConnectivityExecutionResult[] =
      await Promise.all(
        targets.map(
          async (
            target,
          ): Promise<ConnectivityExecutionResult> => {
            if (
              target.probeType ===
              "DNS"
            ) {
              const dnsResult =
                await probeDns(
                  target.host,
                  target.dnsName ??
                    "example.com",
                );

              return {
                target,
                dnsResult,
                tcpResult: null,
              };
            }

            const tcpResult =
              await this.probe.probe({
                id: target.id,
                name: target.name,
                host: target.host,
                port:
                  target.port ??
                  443,
              });

            return {
              target,
              dnsResult: null,
              tcpResult,
            };
          },
        ),
      );

    const observations:
      ConnectivityObservation[] =
      results.map(
        ({
          target,
          dnsResult,
          tcpResult,
        }): ConnectivityObservation => {
          if (dnsResult) {
            return {
              targetId:
                target.id,

              scope:
                target.scope,

              probeType:
                target.probeType,

              status:
                dnsResult.status,

              dnsStatus:
                dnsResult.status,

              tcpStatus:
                "UNKNOWN",

              latencyMs:
                dnsResult.latencyMs,

              observedAt:
                dnsResult.measuredAt,
            };
          }

          if (tcpResult) {
            return {
              targetId:
                tcpResult.targetId,

              scope:
                target.scope,

              probeType:
                target.probeType,

              status:
                tcpResult.overallStatus,

              dnsStatus:
                tcpResult.dnsStatus,

              tcpStatus:
                tcpResult.tcpStatus,

              latencyMs:
                tcpResult.latencyMs,

              observedAt:
                tcpResult.measuredAt,
            };
          }

          return {
            targetId:
              target.id,

            scope:
              target.scope,

            probeType:
              target.probeType,

            status:
              "UNKNOWN",

            dnsStatus:
              "UNKNOWN",

            tcpStatus:
              "UNKNOWN",

            latencyMs:
              null,

            observedAt:
              new Date().toISOString(),
          };
        },
      );

    return {
      observations,

      globalReachabilityPercent:
        this.calculateReachability(
          observations,
          "GLOBAL",
        ),

      domesticReachabilityPercent:
        this.calculateReachability(
          observations,
          "DOMESTIC",
        ),
    };
  }

  private calculateReachability(
    observations:
      ConnectivityObservation[],
    scope:
      ConnectivityScope,
  ): number {
    const scoped =
      observations.filter(
        (observation) =>
          observation.scope ===
          scope,
      );

    if (scoped.length === 0) {
      return 0;
    }

    const reachable =
      scoped.filter(
        (observation) =>
          observation.status ===
            "UP" ||
          observation.status ===
            "DEGRADED",
      ).length;

    return Number(
      (
        (reachable /
          scoped.length) *
        100
      ).toFixed(2),
    );
  }
}