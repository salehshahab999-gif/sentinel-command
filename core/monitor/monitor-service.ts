import { getMonitorState } from "./monitor-engine";
import { MONITOR_RUNTIME } from "./monitor-runtime";
import { runCollectors } from "./collector/collector-service";
import { COLLECTOR_REGISTRY } from "./collector/collector-registry";
import { checkCollectorHealth } from "./collector/collector-health";

export function getMonitorSnapshot() {
  MONITOR_RUNTIME.lastCheck = new Date().toISOString();

  return {
    state: getMonitorState(),
    runtime: MONITOR_RUNTIME,
    collectors: runCollectors(),
    health: COLLECTOR_REGISTRY.map((collector) =>
      checkCollectorHealth(collector)
    ),
  };
}