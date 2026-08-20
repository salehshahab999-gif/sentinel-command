import { getMonitorState } from "./monitor-engine";

import { MONITOR_RUNTIME } from "./monitor-runtime";

import { runCollectors } from "./collector/collector-service";

import { COLLECTOR_REGISTRY } from "./collector/collector-registry";

import { checkCollectorHealth } from "./collector/collector-health";

import { evaluateCollectors } from "./monitor-evaluation";

import { evaluateMonitorRules } from "./monitor-rules";

import { processEventPipeline } from "../events/event-pipeline";

export async function getMonitorSnapshot() {
  MONITOR_RUNTIME.lastCheck = new Date().toISOString();

  const collectors = await runCollectors();

  const evaluationEvents = evaluateCollectors(collectors);

  const ruleEvents = evaluateMonitorRules(collectors);

  const events = [
    ...evaluationEvents,
    ...ruleEvents,
  ];

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