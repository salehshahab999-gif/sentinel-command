import type { CollectorResult } from "./collector/collector-types";
import type { EventSeverity, SentinelEvent } from "../events/Event";

export interface MonitorRule {
  name: string;
  collector: string;
  severity: EventSeverity;
  description: string;
  evaluate: (result: CollectorResult) => boolean;
}

const SEVERITY_PRIORITY: Record<EventSeverity, number> = {
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4,
};

export const MONITOR_RULES: MonitorRule[] = [
  {
    name: "CPU Warning",
    collector: "CPU Load",
    severity: "WARNING",
    description: "CPU load is above warning threshold",
    evaluate: (result) =>
      typeof result.value === "number" && result.value >= 80,
  },
  {
    name: "CPU Critical",
    collector: "CPU Load",
    severity: "CRITICAL",
    description: "CPU load is above critical threshold",
    evaluate: (result) =>
      typeof result.value === "number" && result.value >= 95,
  },
  {
    name: "Memory Warning",
    collector: "Memory Usage",
    severity: "WARNING",
    description: "Memory usage is above warning threshold",
    evaluate: (result) => {
      if (
        typeof result.value !== "object" ||
        result.value === null
      ) {
        return false;
      }

      const value = result.value as {
        usedGB?: unknown;
        totalGB?: unknown;
      };

      if (
        typeof value.usedGB !== "number" ||
        typeof value.totalGB !== "number" ||
        value.totalGB <= 0
      ) {
        return false;
      }

      return value.usedGB / value.totalGB >= 0.8;
    },
  },
  {
    name: "Memory Critical",
    collector: "Memory Usage",
    severity: "CRITICAL",
    description: "Memory usage is above critical threshold",
    evaluate: (result) => {
      if (
        typeof result.value !== "object" ||
        result.value === null
      ) {
        return false;
      }

      const value = result.value as {
        usedGB?: unknown;
        totalGB?: unknown;
      };

      if (
        typeof value.usedGB !== "number" ||
        typeof value.totalGB !== "number" ||
        value.totalGB <= 0
      ) {
        return false;
      }

      return value.usedGB / value.totalGB >= 0.95;
    },
  },
  {
    name: "Disk Warning",
    collector: "Disk Usage",
    severity: "WARNING",
    description: "Disk free space is below warning threshold",
    evaluate: (result) => {
      if (
        typeof result.value !== "object" ||
        result.value === null
      ) {
        return false;
      }

      const value = result.value as {
        freeGB?: unknown;
      };

      return (
        typeof value.freeGB === "number" &&
        value.freeGB <= 15
      );
    },
  },
  {
    name: "Disk Critical",
    collector: "Disk Usage",
    severity: "CRITICAL",
    description: "Disk free space is below critical threshold",
    evaluate: (result) => {
      if (
        typeof result.value !== "object" ||
        result.value === null
      ) {
        return false;
      }

      const value = result.value as {
        freeGB?: unknown;
      };

      return (
        typeof value.freeGB === "number" &&
        value.freeGB <= 10
      );
    },
  },
];

export function evaluateMonitorRules(
  results: CollectorResult[],
): SentinelEvent[] {
  const events: SentinelEvent[] = [];

  for (const result of results) {
    const matchedRules = MONITOR_RULES
      .filter((rule) => rule.collector === result.name)
      .filter((rule) => rule.evaluate(result))
      .sort(
        (a, b) =>
          SEVERITY_PRIORITY[b.severity] -
          SEVERITY_PRIORITY[a.severity],
      );

    const rule = matchedRules[0];

    if (!rule) {
      continue;
    }

    events.push({
      id: `EVENT-${Date.now()}-${events.length}`,
      timestamp: result.timestamp,
      type: rule.name,
      source: result.name,
      severity: rule.severity,
      status: "NEW",
      description: rule.description,
      data: {
        value: result.value,
        rule: rule.name,
      },
    });
  }

  return events;
}