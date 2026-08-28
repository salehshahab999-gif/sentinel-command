import {
  LiveBaselineRunner,
  type LiveBaselineTarget,
} from "./live-baseline-runner";

import {
  NetworkBaselineTracker,
} from "./network-baseline";

const targets: LiveBaselineTarget[] = [
  {
    id: "CLOUDFLARE-443",
    name: "Cloudflare HTTPS",
    host: "1.1.1.1",
    port: 443,
    timeoutMs: 3_000,
  },

  {
    id: "GITHUB-443",
    name: "GitHub HTTPS",
    host: "github.com",
    port: 443,
    timeoutMs: 3_000,
  },
];

async function main(): Promise<void> {
  const runner =
    new LiveBaselineRunner();

  const tracker =
    new NetworkBaselineTracker();

  console.log(
    "LIVE BASELINE COLLECTION STARTED 🌐",
  );

  for (const target of targets) {
    console.log(
      "\n--------------------------------",
    );

    console.log(
      `TARGET: ${target.name}`,
    );

    const result =
      await runner.collect(
        target,
        tracker,
        5,
        1_000,
      );

    console.log(
      "SAMPLES:",
      result.samplesCollected,
    );

    console.log(
      "SUCCESSFUL:",
      result.successfulSamples,
    );

    console.log(
      "FAILED:",
      result.failedSamples,
    );

    console.log(
      "LAST PROBE:",
      result.lastProbe,
    );

    console.log(
      "BASELINE:",
      result.baseline,
    );

    if (
      result.samplesCollected !== 5
    ) {
      throw new Error(
        `${target.name}: expected 5 samples`,
      );
    }

    if (
      result.baseline === null
    ) {
      throw new Error(
        `${target.name}: baseline was not created`,
      );
    }

    if (
      result.baseline.totalSamples !== 5
    ) {
      throw new Error(
        `${target.name}: baseline sample count mismatch`,
      );
    }

    if (
      result.baseline.successRate < 0 ||
      result.baseline.successRate > 100
    ) {
      throw new Error(
        `${target.name}: invalid success rate`,
      );
    }

    if (
      result.baseline.averageLatencyMs !==
        null &&
      result.baseline.averageLatencyMs < 0
    ) {
      throw new Error(
        `${target.name}: invalid average latency`,
      );
    }

    console.log(
      `${target.name} LIVE BASELINE VERIFIED ✅`,
    );
  }

  console.log(
    "\n================================",
  );

  const allBaselines =
    tracker.getAllBaselines();

  console.log(
    "ALL LIVE BASELINES:",
  );

  console.log(allBaselines);

  if (
    allBaselines.length !==
    targets.length
  ) {
    throw new Error(
      "Live baseline count verification failed",
    );
  }

  console.log(
    "LIVE BASELINE COUNT VERIFIED ✅",
  );

  for (const baseline of allBaselines) {
    console.log({
      target: baseline.target,
      status:
        baseline.baselineStatus,
      successRate:
        baseline.successRate,
      averageLatencyMs:
        baseline.averageLatencyMs,
      totalSamples:
        baseline.totalSamples,
    });
  }

  console.log(
    "LIVE BASELINE RUNNER VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "LIVE BASELINE RUNNER TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);