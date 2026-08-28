import {
  ResilienceRuntimeLoop,
} from "./resilience-runtime-loop";

import type {
  ReachabilityTarget,
} from "./reachability-matrix";

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

const resources: ResourceSnapshot = {
  cpuPercent: 20,
  memoryPercent: 45,
  queueDepth: 0,
  networkHealthy: true,
  remoteAvailable: true,
};

async function main(): Promise<void> {
  const loop =
    new ResilienceRuntimeLoop();

  console.log(
    "RESILIENCE RUNTIME LOOP TEST STARTED 🔄🧠",
  );

  if (loop.isRunning()) {
    throw new Error(
      "Loop should not be running before start",
    );
  }

  console.log(
    "INITIAL LOOP STATE VERIFIED ✅",
  );

  const result =
    await loop.run(
      targets,
      resources,
      {
        cycles: 3,
        intervalMs: 1_000,
      },
    );

  console.log(
    "--------------------------------",
  );

  console.log(
    "LOOP RESULT:",
  );

  console.log({
    cyclesExecuted:
      result.cyclesExecuted,

    startedAt:
      result.startedAt,

    finishedAt:
      result.finishedAt,
  });

  if (
    result.cyclesExecuted !== 3
  ) {
    throw new Error(
      `Expected 3 cycles, got ${result.cyclesExecuted}`,
    );
  }

  if (
    result.results.length !== 3
  ) {
    throw new Error(
      `Expected 3 results, got ${result.results.length}`,
    );
  }

  console.log(
    "CYCLE COUNT VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  result.results.forEach(
    (cycleResult, index) => {
      console.log(
        `CYCLE ${index + 1} RESULT:`,
      );

      console.log({
        mode:
          cycleResult.decision.mode,

        riskScore:
          cycleResult.decision.riskScore,

        warning:
          cycleResult.warningLevel,

        warningScore:
          cycleResult.warningScore,

        historicalMatches:
          cycleResult.historicalMatches,

        historicalPatternMatched:
          cycleResult
            .historicalPatternMatched,

        assessments:
          cycleResult.assessmentsCount,

        criticalFailures:
          cycleResult.criticalFailures,
      });

      if (
        cycleResult.assessmentsCount !==
        targets.length
      ) {
        throw new Error(
          `Cycle ${
            index + 1
          }: assessment count mismatch`,
        );
      }

      if (
        cycleResult.criticalFailures !==
        0
      ) {
        throw new Error(
          `Cycle ${
            index + 1
          }: unexpected critical failures`,
        );
      }

      if (
        cycleResult.decision.mode !==
        "NORMAL"
      ) {
        throw new Error(
          `Cycle ${
            index + 1
          }: expected NORMAL mode, got ${cycleResult.decision.mode}`,
        );
      }

      if (
        cycleResult.warningLevel !==
        "NORMAL"
      ) {
        throw new Error(
          `Cycle ${
            index + 1
          }: expected NORMAL warning, got ${cycleResult.warningLevel}`,
        );
      }
    },
  );

  console.log(
    "ALL LIVE CYCLES VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  const runtime =
    loop.getRuntime();

  if (
    !runtime.isStarted()
  ) {
    throw new Error(
      "Runtime should be started after loop execution",
    );
  }

  if (
    !loop.isRunning()
  ) {
    console.log(
      "LOOP AUTO-STOPPED AFTER FINISH ✅",
    );
  }

  console.log(
    "RUNTIME STATE VERIFIED ✅",
  );

  const memory =
    runtime.getMemory();

  const memorySummary =
    memory.summarize();

  console.log(
    "MEMORY SUMMARY:",
  );

  console.log(
    memorySummary,
  );

  if (
    memorySummary.totalIncidents !==
    0
  ) {
    throw new Error(
      "Expected no historical incidents in empty test memory",
    );
  }

  console.log(
    "EMPTY MEMORY VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP: VERIFY MATRIX AFTER LOOP",
  );

  const matrixRecords =
    runtime
      .getMatrix()
      .getAllRecords();

  if (
    matrixRecords.length !==
    targets.length
  ) {
    throw new Error(
      `Expected ${targets.length} matrix records, got ${matrixRecords.length}`,
    );
  }

  console.log(
    "MATRIX RETENTION VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "STEP: STOP RUNTIME",
  );

  loop.stop();

  if (
    runtime.isStarted()
  ) {
    throw new Error(
      "Runtime should be stopped",
    );
  }

  if (
    loop.isRunning()
  ) {
    throw new Error(
      "Loop should not be running after stop",
    );
  }

  console.log(
    "LOOP STOP VERIFIED ✅",
  );

  console.log(
    "--------------------------------",
  );

  console.log(
    "RESILIENCE RUNTIME LOOP VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "RESILIENCE RUNTIME LOOP TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);