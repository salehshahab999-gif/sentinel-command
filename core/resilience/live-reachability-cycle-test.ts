import {
  LiveReachabilityCycle,
} from "./live-reachability-cycle";

import {
  ReachabilityMatrix,
  type ReachabilityTarget,
} from "./reachability-matrix";

import {
  NetworkBaselineTracker,
} from "./network-baseline";

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
    new LiveReachabilityCycle();

  const matrix =
    new ReachabilityMatrix();

  const baselineTracker =
    new NetworkBaselineTracker();

  console.log(
    "LIVE REACHABILITY CYCLE STARTED 🌐",
  );

  const result =
    await cycle.run(
      targets,
      matrix,
      baselineTracker,
    );

  console.log(
    "--------------------------------",
  );

  console.log(
    "MEASURED AT:",
    result.measuredAt,
  );

  console.log(
    "ASSESSMENTS:",
  );

  console.log(
    result.assessments,
  );

  console.log(
    "CRITICAL FAILURES:",
  );

  console.log(
    result.criticalFailures,
  );

  if (
    result.assessments.length !==
    targets.length
  ) {
    throw new Error(
      `Expected ${targets.length} assessments, got ${result.assessments.length}`,
    );
  }

  console.log(
    "ASSESSMENT COUNT VERIFIED ✅",
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
    "MATRIX RECORD COUNT VERIFIED ✅",
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
    "BASELINE COUNT VERIFIED ✅",
  );

  for (const assessment of result.assessments) {
    console.log(
      "--------------------------------",
    );

    console.log(
      assessment.target.name,
    );

    console.log({
      host:
        assessment.target.host,

      port:
        assessment.target.port,

      currentStatus:
        assessment.current.overallStatus,

      baselineStatus:
        assessment.baseline
          ?.baselineStatus ?? null,

      latencyMs:
        assessment.current.latencyMs,

      latencyChangeMs:
        assessment.latencyChangeMs,

      successRateChange:
        assessment.successRateChange,

      degradationScore:
        assessment.degradationScore,
    });
  }

  for (const target of targets) {
    const record =
      matrix.getRecord(
        target.id,
      );

    if (!record) {
      throw new Error(
        `${target.name}: matrix record missing`,
      );
    }

    if (
      target.critical &&
      record.overallStatus !== "UP" &&
      record.overallStatus !== "DEGRADED"
    ) {
      throw new Error(
        `${target.name}: critical target is unexpectedly unavailable`,
      );
    }
  }

  console.log(
    "CRITICAL TARGET REACHABILITY VERIFIED ✅",
  );

  console.log(
    "LIVE REACHABILITY CYCLE VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "LIVE REACHABILITY CYCLE FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);