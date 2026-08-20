import type { CollectorResult } from "./collector/collector-types";
import type { SentinelEvent } from "../events/Event";

export function evaluateCollector(
  result: CollectorResult,
): SentinelEvent | null {
  if (result.status === "FAILED") {
    return {
      id: `EVENT-${Date.now()}`,
      timestamp: result.timestamp,
      type: "COLLECTOR_FAILURE",
      source: result.name,
      severity: "ERROR",
      status: "NEW",
      description: `${result.name} collector failed`,
      data: {
        value: result.value,
        collectorStatus: result.status,
      },
    };
  }

  return null;
}

export function evaluateCollectors(
  results: CollectorResult[],
): SentinelEvent[] {
  return results.flatMap((result) => {
    const event = evaluateCollector(result);
    return event ? [event] : [];
  });
}