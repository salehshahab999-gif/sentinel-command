export type AlertEngineStatus = "ACTIVE" | "INACTIVE";

export interface AlertEngineState {
  status: AlertEngineStatus;
  lastActivity: string | null;
}

let alertEngineState: AlertEngineState = {
  status: "ACTIVE",
  lastActivity: null,
};

export function getAlertEngineStatus(): AlertEngineState {
  return {
    ...alertEngineState,
  };
}

export function markAlertEngineActivity(): void {
  alertEngineState = {
    status: "ACTIVE",
    lastActivity: new Date().toISOString(),
  };
}

export function markAlertEngineInactive(): void {
  alertEngineState = {
    status: "INACTIVE",
    lastActivity: alertEngineState.lastActivity,
  };
}