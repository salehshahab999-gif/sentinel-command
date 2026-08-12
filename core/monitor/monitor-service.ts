import { getMonitorState } from "./monitor-engine";
import { MONITOR_RUNTIME } from "./monitor-runtime";

export function getMonitorSnapshot() {
  MONITOR_RUNTIME.lastCheck = new Date().toISOString();

  return {
    state: getMonitorState(),
    runtime: MONITOR_RUNTIME,
  };
}