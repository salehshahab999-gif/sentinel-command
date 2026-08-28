import {
  ReachabilityProbeRunner,
} from "./reachability-probe-runner";

import {
  ReachabilityMatrix,
  type ReachabilityTarget,
} from "./reachability-matrix";

async function main(): Promise<void> {
  const runner =
    new ReachabilityProbeRunner();

  const matrix =
    new ReachabilityMatrix();

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

    {
      id: "INVALID-443",
      name: "Invalid Test Target",
      host: "this-host-should-not-exist.invalid",
      port: 443,
      protocol: "TCP",
      critical: false,
    },
  ];

  console.log(
    "REGISTERING REACHABILITY TARGETS ✅",
  );

  for (const target of targets) {
    matrix.registerTarget(target);
  }

  if (
    matrix.getAllTargets().length !==
    targets.length
  ) {
    throw new Error(
      "Target registration verification failed",
    );
  }

  console.log(
    "TARGET REGISTRATION VERIFIED ✅",
  );

  console.log(
    "RUNNING REAL NETWORK PROBES 🌐",
  );

  const results =
    await runner.runAll(
      targets,
      matrix,
    );

  if (
    results.length !==
    targets.length
  ) {
    throw new Error(
      "Probe result count mismatch",
    );
  }

  for (const result of results) {
    console.log(
      "--------------------------------",
    );

    console.log(
      result.target.name,
    );

    console.log({
      host:
        result.probe.host,
      port:
        result.probe.port,
      dnsStatus:
        result.probe.dnsStatus,
      tcpStatus:
        result.probe.tcpStatus,
      latencyMs:
        result.probe.latencyMs,
      overallStatus:
        result.probe.overallStatus,
      failureStage:
        result.probe.failureStage,
      recorded:
        result.recorded,
    });

    if (!result.recorded) {
      throw new Error(
        `${result.target.name}: record was not stored`,
      );
    }

    const stored =
      matrix.getRecord(
        result.target.id,
      );

    if (!stored) {
      throw new Error(
        `${result.target.name}: matrix record missing`,
      );
    }

    if (
      stored.overallStatus !==
      result.probe.overallStatus
    ) {
      throw new Error(
        `${result.target.name}: matrix status mismatch`,
      );
    }

    console.log(
      `${result.target.name} RECORDED ✅`,
    );
  }

  console.log(
    "--------------------------------",
  );

  const records =
    matrix.getAllRecords();

  console.log(
    "MATRIX RECORDS:",
  );

  console.log(records);

  if (
    records.length !==
    targets.length
  ) {
    throw new Error(
      "Reachability matrix record count verification failed",
    );
  }

  console.log(
    "MATRIX RECORD COUNT VERIFIED ✅",
  );

  const cloudflare =
    matrix.getRecord(
      "CLOUDFLARE-443",
    );

  if (!cloudflare) {
    throw new Error(
      "Cloudflare matrix record missing",
    );
  }

  if (
    cloudflare.overallStatus !==
      "UP" &&
    cloudflare.overallStatus !==
      "DEGRADED"
  ) {
    throw new Error(
      `Cloudflare expected reachable status, got ${cloudflare.overallStatus}`,
    );
  }

  console.log(
    "CLOUDFLARE REACHABILITY VERIFIED ✅",
  );

  const github =
    matrix.getRecord(
      "GITHUB-443",
    );

  if (!github) {
    throw new Error(
      "GitHub matrix record missing",
    );
  }

  if (
    github.overallStatus !==
      "UP" &&
    github.overallStatus !==
      "DEGRADED"
  ) {
    throw new Error(
      `GitHub expected reachable status, got ${github.overallStatus}`,
    );
  }

  console.log(
    "GITHUB REACHABILITY VERIFIED ✅",
  );

  const invalid =
    matrix.getRecord(
      "INVALID-443",
    );

  if (!invalid) {
    throw new Error(
      "Invalid target matrix record missing",
    );
  }

  if (
    invalid.dnsStatus !==
      "DOWN" ||
    invalid.overallStatus !==
      "DOWN"
  ) {
    throw new Error(
      "Invalid target DNS failure verification failed",
    );
  }

  console.log(
    "INVALID TARGET FAILURE VERIFIED ✅",
  );

  const criticalFailures =
    matrix.getCriticalFailures();

  console.log(
    "CRITICAL FAILURES:",
  );

  console.log(
    criticalFailures,
  );

  console.log(
    "REACHABILITY PROBE RUNNER VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "REACHABILITY PROBE RUNNER TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);