import { lookup } from "dns/promises";
import { Socket } from "net";

export type ProbeStatus =
  | "UP"
  | "DOWN"
  | "DEGRADED"
  | "UNKNOWN";

export type ProbeFailureStage =
  | "NONE"
  | "DNS"
  | "TCP"
  | "TIMEOUT"
  | "ERROR";

export interface NetworkProbeTarget {
  id: string;
  name: string;
  host: string;
  port: number;
  timeoutMs?: number;
}

export interface NetworkProbeResult {
  targetId: string;
  targetName: string;
  host: string;
  port: number;

  dnsStatus: ProbeStatus;
  tcpStatus: ProbeStatus;

  resolvedAddress: string | null;
  addressFamily: "IPv4" | "IPv6" | null;

  latencyMs: number | null;

  overallStatus: ProbeStatus;
  failureStage: ProbeFailureStage;
  error: string | null;

  measuredAt: string;
}

const DEFAULT_TIMEOUT_MS = 3_000;

function classifyLatency(
  latencyMs: number | null,
): ProbeStatus {
  if (latencyMs === null) {
    return "UNKNOWN";
  }

  if (latencyMs >= 500) {
    return "DEGRADED";
  }

  return "UP";
}

export class NetworkProbe {
  public async probe(
    target: NetworkProbeTarget,
  ): Promise<NetworkProbeResult> {
    const startedAt = Date.now();

    const timeoutMs =
      target.timeoutMs ??
      DEFAULT_TIMEOUT_MS;

    const measuredAt =
      new Date().toISOString();

    let resolvedAddress: string | null = null;

    let addressFamily:
      | "IPv4"
      | "IPv6"
      | null = null;

    let dnsStatus: ProbeStatus = "UNKNOWN";
    let tcpStatus: ProbeStatus = "UNKNOWN";

    let latencyMs: number | null = null;

    let failureStage: ProbeFailureStage = "NONE";

    let error: string | null = null;

    try {
      const dnsStarted = Date.now();

      const resolved = await lookup(
        target.host,
        {
          all: false,
        },
      );

      resolvedAddress =
        resolved.address;

      addressFamily =
        resolved.family === 6
          ? "IPv6"
          : "IPv4";

      const dnsLatency =
        Date.now() - dnsStarted;

      dnsStatus =
        dnsLatency >= 1_000
          ? "DEGRADED"
          : "UP";
    } catch (cause) {
      dnsStatus = "DOWN";
      tcpStatus = "UNKNOWN";
      failureStage = "DNS";

      error =
        this.normalizeError(cause);

      return {
        targetId: target.id,
        targetName: target.name,
        host: target.host,
        port: target.port,
        dnsStatus,
        tcpStatus,
        resolvedAddress: null,
        addressFamily: null,
        latencyMs: null,
        overallStatus: "DOWN",
        failureStage,
        error,
        measuredAt,
      };
    }

    try {
      latencyMs =
        await this.checkTcp(
          resolvedAddress,
          target.port,
          timeoutMs,
        );

      tcpStatus =
        classifyLatency(latencyMs);
    } catch (cause) {
      const message =
        this.normalizeError(cause);

      tcpStatus = "DOWN";
      failureStage =
        message === "TIMEOUT"
          ? "TIMEOUT"
          : "TCP";

      error = message;
    }

    let overallStatus: ProbeStatus;

    if (tcpStatus === "DOWN") {
      overallStatus = "DOWN";
    } else if (
      tcpStatus === "DEGRADED"
    ) {
      overallStatus = "DEGRADED";
    } else if (tcpStatus === "UP") {
      overallStatus = "UP";
    } else {
      overallStatus = "UNKNOWN";
    }

    if (
      failureStage === "NONE" &&
      overallStatus === "UP"
    ) {
      const totalLatency =
        Date.now() - startedAt;

      if (totalLatency >= 1_000) {
        overallStatus = "DEGRADED";
      }
    }

    return {
      targetId: target.id,
      targetName: target.name,
      host: target.host,
      port: target.port,
      dnsStatus,
      tcpStatus,
      resolvedAddress,
      addressFamily,
      latencyMs,
      overallStatus,
      failureStage,
      error,
      measuredAt,
    };
  }

  private checkTcp(
    host: string,
    port: number,
    timeoutMs: number,
  ): Promise<number> {
    return new Promise(
      (resolve, reject) => {
        const socket = new Socket();

        let settled = false;

        const startedAt = Date.now();

        const finish = (
          callback: () => void,
        ): void => {
          if (settled) {
            return;
          }

          settled = true;

          socket.destroy();

          callback();
        };

        const timeoutHandle =
          setTimeout(() => {
            finish(() =>
              reject(
                new Error("TIMEOUT"),
              ),
            );
          }, timeoutMs);

        socket.once(
          "connect",
          () => {
            clearTimeout(
              timeoutHandle,
            );

            const latency =
              Date.now() - startedAt;

            finish(() =>
              resolve(latency),
            );
          },
        );

        socket.once(
          "error",
          (cause) => {
            clearTimeout(
              timeoutHandle,
            );

            finish(() =>
              reject(cause),
            );
          },
        );

        socket.connect(
          port,
          host,
        );
      },
    );
  }

  private normalizeError(
    cause: unknown,
  ): string {
    if (cause instanceof Error) {
      return cause.message;
    }

    return String(cause);
  }
}