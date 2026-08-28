import {
  NetworkBaselineTracker,
  type NetworkMeasurement,
} from "./network-baseline";

function createMeasurement(
  index: number,
  status: NetworkMeasurement["status"],
  latencyMs: number | null,
): NetworkMeasurement {
  return {
    target: "TEST-REMOTE",
    host: "example.test",
    port: 443,
    status,
    latencyMs,
    measuredAt: new Date(
      Date.now() + index * 1000,
    ).toISOString(),
  };
}

function main() {
  const tracker = new NetworkBaselineTracker();

  console.log("BUILDING NORMAL BASELINE ✅");

  for (let i = 0; i < 20; i += 1) {
    tracker.record(
      createMeasurement(
        i,
        "UP",
        30 + (i % 5),
      ),
    );
  }

  const baseline = tracker.getBaseline(
    "TEST-REMOTE",
    "example.test",
    443,
  );

  console.log("BASELINE ✅");
  console.log(baseline);

  if (
    !baseline ||
    baseline.baselineStatus !== "UP" ||
    baseline.successRate < 95
  ) {
    throw new Error(
      "Normal network baseline verification failed",
    );
  }

  console.log("NORMAL BASELINE VERIFIED ✅");

  const degradedMeasurement = createMeasurement(
    21,
    "DOWN",
    null,
  );

  const comparison = tracker.compare(
    degradedMeasurement,
  );

  console.log("DEGRADED MEASUREMENT ✅");
  console.log(degradedMeasurement);

  console.log("BASELINE COMPARISON ✅");
  console.log(comparison);

  if (
    comparison.baseline === null ||
    !comparison.statusChanged ||
    comparison.successRateChange === null ||
    comparison.successRateChange >= 0
  ) {
    throw new Error(
      "Network degradation comparison failed",
    );
  }

  console.log("NETWORK DEGRADATION DETECTED ✅");

  const latencySpike = createMeasurement(
    22,
    "UP",
    250,
  );

  const latencyComparison =
    tracker.compare(latencySpike);

  console.log("LATENCY SPIKE TEST ✅");
  console.log(latencyComparison);

  if (
    latencyComparison.baseline === null ||
    latencyComparison.latencyChangeMs === null ||
    latencyComparison.latencyChangeMs <= 0
  ) {
    throw new Error(
      "Latency spike detection failed",
    );
  }

  console.log("LATENCY SPIKE DETECTED ✅");

  console.log("ALL NETWORK BASELINE TESTS PASSED ✅");
}

main();