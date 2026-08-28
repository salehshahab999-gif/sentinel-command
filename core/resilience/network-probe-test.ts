import {
  NetworkProbe,
  type NetworkProbeResult,
} from "./network-probe";

interface TestTarget {
  id: string;
  name: string;
  host: string;
  port: number;
  timeoutMs?: number;
  expectedDns: "UP" | "DOWN";
}

const targets: TestTarget[] = [
  {
    id: "CLOUDFLARE-HTTPS",
    name: "Cloudflare HTTPS",
    host: "1.1.1.1",
    port: 443,
    timeoutMs: 3_000,
    expectedDns: "UP",
  },

  {
    id: "GITHUB-HTTPS",
    name: "GitHub HTTPS",
    host: "github.com",
    port: 443,
    timeoutMs: 3_000,
    expectedDns: "UP",
  },

  {
    id: "INVALID-HOST",
    name: "Invalid Test Host",
    host: "this-host-should-not-exist.invalid",
    port: 443,
    timeoutMs: 3_000,
    expectedDns: "DOWN",
  },
];

function printResult(
  result: NetworkProbeResult,
): void {
  console.log(
    "--------------------------------",
  );

  console.log(
    `${result.targetName}`,
  );

  console.log({
    host: result.host,
    port: result.port,
    dnsStatus: result.dnsStatus,
    tcpStatus: result.tcpStatus,
    resolvedAddress:
      result.resolvedAddress,
    addressFamily:
      result.addressFamily,
    latencyMs:
      result.latencyMs,
    overallStatus:
      result.overallStatus,
    failureStage:
      result.failureStage,
    error:
      result.error,
    measuredAt:
      result.measuredAt,
  });
}

async function main(): Promise<void> {
  const probe =
    new NetworkProbe();

  console.log(
    "NETWORK PROBE REAL-WORLD TEST STARTED 🌐",
  );

  let passed = 0;

  for (const target of targets) {
    console.log(
      `\nTEST TARGET: ${target.name}`,
    );

    const result =
      await probe.probe(target);

    printResult(result);

    if (
      result.dnsStatus !==
      target.expectedDns
    ) {
      throw new Error(
        `${target.name}: expected DNS ${target.expectedDns}, got ${result.dnsStatus}`,
      );
    }

    if (
      target.expectedDns === "DOWN"
    ) {
      if (
        result.overallStatus !== "DOWN" ||
        result.failureStage !== "DNS"
      ) {
        throw new Error(
          `${target.name}: invalid DNS failure handling`,
        );
      }
    } else {
      if (
        result.resolvedAddress === null
      ) {
        throw new Error(
          `${target.name}: DNS resolved without an address`,
        );
      }

      if (
        result.dnsStatus === "DOWN"
      ) {
        throw new Error(
          `${target.name}: DNS unexpectedly failed`,
        );
      }
    }

    passed += 1;

    console.log(
      `${target.name} VERIFIED ✅`,
    );
  }

  console.log(
    "--------------------------------",
  );

  console.log(
    `PROBE TESTS PASSED: ${passed}/${targets.length} ✅`,
  );

  if (
    passed !== targets.length
  ) {
    throw new Error(
      "One or more network probe tests failed",
    );
  }

  console.log(
    "NETWORK PROBE VERIFIED ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(
      "NETWORK PROBE TEST FAILED ❌",
    );

    console.error(error);

    process.exitCode = 1;
  },
);