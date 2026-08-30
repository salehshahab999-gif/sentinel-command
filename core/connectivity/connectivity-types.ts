export type ConnectivityScope =
  | "DOMESTIC"
  | "GLOBAL";

export type ConnectivityProbeType =
  | "TCP"
  | "DNS"
  | "HTTPS";

export type ConnectivityState =
  | "NORMAL"
  | "GLOBAL_PARTIAL"
  | "DOMESTIC_ONLY"
  | "OFFLINE"
  | "UNKNOWN";

export type ConnectivityTarget = {
  id: string;
  name: string;
  scope: ConnectivityScope;
  probeType: ConnectivityProbeType;
  host: string;
  port?: number;
  dnsName?: string;
  priority: number;
  enabled: boolean;
};

export type ConnectivityObservation = {
  targetId: string;
  scope: ConnectivityScope;
  probeType: ConnectivityProbeType;

  status:
    | "UP"
    | "DOWN"
    | "DEGRADED"
    | "UNKNOWN";

  dnsStatus:
    | "UP"
    | "DOWN"
    | "DEGRADED"
    | "UNKNOWN";

  tcpStatus:
    | "UP"
    | "DOWN"
    | "DEGRADED"
    | "UNKNOWN";

  latencyMs: number | null;

  observedAt: string;
};

export type ConnectivitySnapshot = {
  state: ConnectivityState;

  globalReachabilityPercent: number;
  domesticReachabilityPercent: number;

  totalTargets: number;
  reachableTargets: number;

  observations: ConnectivityObservation[];

  measuredAt: string;
};