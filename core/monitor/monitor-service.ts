import { getMonitorState } from "./monitor-engine";

import { MONITOR_RUNTIME } from "./monitor-runtime";

import { runCollectors } from "./collector/collector-service";

import { COLLECTOR_REGISTRY } from "./collector/collector-registry";

import { checkCollectorHealth } from "./collector/collector-health";

import { evaluateCollectors } from "./monitor-evaluation";

import { evaluateMonitorRules } from "./monitor-rules";

import { processEventPipeline } from "../events/event-pipeline";

import {
  reportAlertSignal,
  clearAlertSignal,
} from "../alerts/alert-signal";

export async function getMonitorSnapshot() {
  MONITOR_RUNTIME.lastCheck = new Date().toISOString();

  const collectors = await runCollectors();

  const evaluationEvents = evaluateCollectors(collectors);

  const ruleEvents = evaluateMonitorRules(collectors);

  const events = [
    ...evaluationEvents,
    ...ruleEvents,
  ];

  for (const event of ruleEvents) {
    reportAlertSignal({
      source: "MONITOR",
      severity: event.severity,
      type: event.type,
      message: event.description,
      timestamp: event.timestamp,
      active: true,
      data: event.data,
    });
  }

  const monitorRuleTypes = [
    "CPU Warning",
    "CPU Critical",
    "Memory Warning",
    "Memory Critical",
    "Disk Warning",
    "Disk Critical",
  ];

  for (const type of monitorRuleTypes) {
    const active = ruleEvents.some(
      (event) => event.type === type,
    );

    if (!active) {
      clearAlertSignal("MONITOR", type);
    }
  }

  const pipeline = await processEventPipeline(events);

  const health = await Promise.all(
    COLLECTOR_REGISTRY.map((collector) =>
      checkCollectorHealth(collector),
    ),
  );

  return {
    state: getMonitorState(),
    runtime: MONITOR_RUNTIME,
    collectors,
    health,
    events: pipeline.events,
    alerts: pipeline.alerts,
  };
}