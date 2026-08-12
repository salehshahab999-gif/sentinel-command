import { getMonitorState } from "./monitor-engine";
import { MONITOR_RUNTIME } from "./monitor-runtime";
import { runCollectors } from "./collector/collector-service";

export function getMonitorSnapshot() {
  MONITOR_RUNTIME.lastCheck = new Date().toISOString();

  return {
    state: getMonitorState(),
    runtime: MONITOR_RUNTIME,
    collectors: runCollectors(),
  };
}