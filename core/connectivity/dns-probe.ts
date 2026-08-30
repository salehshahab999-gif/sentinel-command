import {
  Resolver,
} from "dns/promises";

export type DnsProbeStatus =
  | "UP"
  | "DOWN"
  | "DEGRADED"
  | "UNKNOWN";

export interface DnsProbeResult {
  server: string;
  query: string;
  status: DnsProbeStatus;
  resolvedAddress: string | null;
  latencyMs: number | null;
  error: string | null;
  measuredAt: string;
}

const DEFAULT_TIMEOUT_MS = 1500;

export async function probeDns(
  server: string,
  query = "example.com",
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<DnsProbeResult> {
  const startedAt = Date.now();
  const measuredAt =
    new Date().toISOString();

  const resolver =
    new Resolver();

  resolver.setServers([
    server,
  ]);

  try {
    const resolved =
      await Promise.race([
        resolver.resolve4(query),
        new Promise<never>(
          (_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "TIMEOUT",
                  ),
                ),
              timeoutMs,
            ),
        ),
      ]);

    const latencyMs =
      Date.now() - startedAt;

    return {
      server,
      query,
      status:
        latencyMs >= 1000
          ? "DEGRADED"
          : "UP",
      resolvedAddress:
        resolved[0] ?? null,
      latencyMs,
      error: null,
      measuredAt,
    };
  } catch (cause) {
    const latencyMs =
      Date.now() - startedAt;

    const error =
      cause instanceof Error
        ? cause.message
        : String(cause);

    return {
      server,
      query,
      status:
        error === "TIMEOUT"
          ? "DOWN"
          : "DOWN",
      resolvedAddress:
        null,
      latencyMs,
      error,
      measuredAt,
    };
  }
}