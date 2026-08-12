import { getMonitorState } from "./monitor-engine";

export function getMonitorSnapshot() {
  return getMonitorState();
}