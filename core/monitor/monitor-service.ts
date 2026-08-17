import { getMonitorState } from "./monitor-engine";
import { MONITOR_RUNTIME } from "./monitor-runtime";
import { runCollectors } from "./collector/collector-service";
import { COLLECTOR_REGISTRY } from "./collector/collector-registry";
import { checkCollectorHealth } from "./collector/collector-health";

export async function getMonitorSnapshot() {
  MONITOR_RUNTIME.lastCheck = new Date().toISOString();

  const collectors = await runCollectors();

  const health = await Promise.all(
    COLLECTOR_REGISTRY.map((collector) =>
      checkCollectorHealth(collector)
    )
  );

  return {
    state: getMonitorState(),
    runtime: MONITOR_RUNTIME,
    collectors,
    health,
  };
}