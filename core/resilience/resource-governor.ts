export type ResourceMode =
  | "NORMAL"
  | "WATCH"
  | "PRE_SURVIVAL"
  | "LOCAL_SURVIVAL"
  | "EMERGENCY";

export interface ResourceSnapshot {
  cpuPercent: number;
  memoryPercent: number;
  queueDepth: number;
  networkHealthy: boolean;
  remoteAvailable: boolean;
}

export interface ResourceDecision {
  mode: ResourceMode;
  enableNetworkProbes: boolean;
  probeIntervalMs: number;
  enableLocalAI: boolean;
  enableHeavyAnalysis: boolean;
  enableSourceRefresh: boolean;
  maxConcurrentJobs: number;
  reason: string;
}

export function decideResourceMode(
  snapshot: ResourceSnapshot,
): ResourceDecision {
  const { cpuPercent, memoryPercent, queueDepth } = snapshot;

  if (cpuPercent >= 85 || memoryPercent >= 92) {
    return {
      mode: "EMERGENCY",
      enableNetworkProbes: false,
      probeIntervalMs: 30_000,
      enableLocalAI: false,
      enableHeavyAnalysis: false,
      enableSourceRefresh: false,
      maxConcurrentJobs: 1,
      reason: "System resource pressure is critical",
    };
  }

  if (
    !snapshot.networkHealthy &&
    !snapshot.remoteAvailable
  ) {
    return {
      mode: "LOCAL_SURVIVAL",
      enableNetworkProbes: true,
      probeIntervalMs: 5_000,
      enableLocalAI: true,
      enableHeavyAnalysis: false,
      enableSourceRefresh: false,
      maxConcurrentJobs: 2,
      reason: "Remote connectivity unavailable",
    };
  }

  if (
    cpuPercent >= 70 ||
    memoryPercent >= 80 ||
    queueDepth >= 100
  ) {
    return {
      mode: "PRE_SURVIVAL",
      enableNetworkProbes: true,
      probeIntervalMs: 10_000,
      enableLocalAI: true,
      enableHeavyAnalysis: false,
      enableSourceRefresh: true,
      maxConcurrentJobs: 2,
      reason: "System load or queue pressure is elevated",
    };
  }

  if (
    cpuPercent >= 40 ||
    memoryPercent >= 65 ||
    queueDepth >= 25 ||
    !snapshot.networkHealthy
  ) {
    return {
      mode: "WATCH",
      enableNetworkProbes: true,
      probeIntervalMs: 15_000,
      enableLocalAI: false,
      enableHeavyAnalysis: false,
      enableSourceRefresh: true,
      maxConcurrentJobs: 3,
      reason: "System or network requires closer observation",
    };
  }

  return {
    mode: "NORMAL",
    enableNetworkProbes: true,
    probeIntervalMs: 30_000,
    enableLocalAI: false,
    enableHeavyAnalysis: true,
    enableSourceRefresh: true,
    maxConcurrentJobs: 4,
    reason: "System operating normally",
  };
}