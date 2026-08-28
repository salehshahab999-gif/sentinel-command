import {
  LiveResilienceCycle,
} from "./live-resilience-cycle";

import {
  ReachabilityMatrix,
  type ReachabilityTarget,
} from "./reachability-matrix";

import {
  NetworkBaselineTracker,
} from "./network-baseline";

import {
  IncidentMemory,
} from "./incident-memory";

import type {
  ResourceSnapshot,
} from "./resource-governor";

const targets: ReachabilityTarget[] = [
  {
    id: "CLOUDFLARE-443",
    name: "Cloudflare HTTPS",
    host: "1.1.1.1",
    port: 443,
    protocol: "TCP",
    critical: true,
  },

  {
    id: "GITHUB-443",
    name: "GitHub HTTPS",
    host: "github.com",
    port: 443,
    protocol: "TCP",
    critical: true,
  },
];

async function main(): Promise<void> {
  const cycle =
    new LiveResilienceCycle();

  const matrix =
    new ReachabilityMatrix();

  const baselineTracker =
    new NetworkBaselineTracker();

  const incidentMemory =
    new IncidentMemory();

  const resources: ResourceSnapshot = {
    cpuPercent: 20,
    memoryPercent: 45,
    queueDepth: 0,
    networkHealthy: true,
    remoteAvailable: true,
  };

  console.log(
    "LIVE RESILIENCE CYCLE STARTED 🌐🧠",
  );

  const result =
    await cycle.run(
      targets,
      resources,
      incidentMemory,
      baselineTracker,
      matrix,
    );

  console.log(
    "--------------------------------",
  );

  console.log(
    "LIVE RESILIENCE RESULT:",
  );

  console.log({
    decisionMode:
      result.decision.mode,

    riskScore:
      result.decision.riskScore,

    warningLevel:
      result.warningLevel,

    warningScore:
      result.warningScore,

    historicalMatches:
      result.historicalMatches,

    historicalPatternMatched:
      result.historicalPatternMatched,

    assessmentsCount:
      result.assessmentsCount,

    criticalFailures:
      result.criticalFailures,

    measuredAt:
      result.measuredAt,
  });

  console.log(
    "--------------------------------",
  );

  console.log(
    "DECISION DETAILS:",
  );

  console.log(
    result.decision,
  );

  if (
    result.assessmentsCount !==
    targets.length
  ) {
    throw new Error(
      `Expected ${targets.length} assessments, got ${result.assessmentsCount}`,
    );
  }

  console.log(
    "LIVE ASSESSMENT COUNT VERIFIED ✅",
  );

  if (
    result.criticalFailures !== 0
  ) {
    throw new Error(
      "Critical target failure detected during healthy network test",
    );
  }

  console.log(
    "HEALTHY NETWORK VERIFIED ✅",
  );

  if (
    result.warningLevel !==
    "NORMAL"
  ) {
    throw new Error(
      `Expected NORMAL warning, got ${result.warningLevel}`,
    );
  }

  console.log(
    "EARLY WARNING NORMAL VERIFIED ✅",
  );

  if (
    result.historicalMatches !== 0
  ) {
    throw new Error(
      "Unexpected historical match in empty memory",
    );
  }

  if (
    result.historicalPatternMatched
  ) {
    throw new Error(
      "Historical pattern should not match with empty memory",
    );
  }

  console.log(
    "EMPTY HISTORY VERIFIED ✅",
  );

  if (
    result.decision.mode !==
    "NORMAL"
  ) {
    throw new Error(
      `Expected NORMAL decision, got ${result.decision.mode}`,
    );
  }

  console.log(
    "NORMAL DECISION VERIFIED ✅",
  );

  if (
    !result.decision
      .enableNetworkProbes
  ) {
    throw new Error(
      "Network probes should be enabled in normal mode",
    );
  }

  if (
    !result.decision
      .enableHeavyAnalysis
  ) {
    throw new Error(
      "Heavy analysis should be enabled in normal mode",
    );
  }

  if (
    result.decision
      .enableLocalAI
  ) {
    throw new Error(
      "Local AI should remain disabled in normal mode",
    );
  }

  console.log(
    "NORMAL RESOURCE POLICY VERIFIED ✅",
  );

  const baselines =
    baselineTracker.getAllBaselines();

  if (
    baselines.length !==
    targets.length
  ) {
    throw new Error(
      `Expected ${targets.length} baselines, got ${baselines.length}`,
    );
  }

  console.log(
    "LIVE BASELINE CREATION VERIFIED ✅",
  );

  const records =
    matrix.getAllRecords();

  if (
    records.length !==
    targets.length
  ) {
    throw new Error(
      `Expected ${targets.length} matrix records, got ${records.length}`,
    );
  }

  console.log(
    "LIVE MATRIX RECORDING VERIFIED ✅",
  );

  for (const target of targets) {
    const record =
      matrix.getRecord(
        target.id,
      );

    if (!record) {
      throw new Error(
        `${target.name}: missing matrix record`,
      );
    }

    console.log({
      target:
        target.name,

      status:
        record.overallStatus,

      dns:
        record.dnsStatus,

      tcp:
        record.tcpStatus,

      latency:
        record.latencyMs,
    });
  }

  console.log(
    "--------------------------------",
  );

  console.log(
    "LIVE RESILIENCE PIPELINE VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "LIVE RESILIENCE CYCLE TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);