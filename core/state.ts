export type SystemStatus = "ONLINE" | "DEGRADED" | "OFFLINE";

export interface CoreState {
  status: SystemStatus;
  version: string;
  modules: Record<string, boolean>;
  lastUpdate: number;
}

export const CORE_STATE: CoreState = {
  status: "ONLINE",
  version: "1.0.0",
  modules: {},
  lastUpdate: Date.now(),
};

export function updateCoreState(update: Partial<CoreState>): void {
  Object.assign(CORE_STATE, update);
  CORE_STATE.lastUpdate = Date.now();
}

export function updateModuleStatus(
  moduleName: string,
  status: boolean
): void {
  CORE_STATE.modules[moduleName] = status;
  CORE_STATE.lastUpdate = Date.now();
}

export function getCoreState(): CoreState {
  return CORE_STATE;
}