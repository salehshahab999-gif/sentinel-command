export type AlertSignalSeverity =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export type AlertSignalSource =
  | "CORE"
  | "MONITOR"
  | "AI"
  | "API"
  | "DATABASE"
  | "METRICS"
  | "SECURITY"
  | "BACKUP"
  | "EVENTS"
  | "SYSTEM";

export interface AlertSignal {
  source: AlertSignalSource;
  severity: AlertSignalSeverity;
  type: string;
  message: string;
  timestamp: string;
  active: boolean;
  data?: unknown;
}

const alertSignals = new Map<string, AlertSignal>();

export function reportAlertSignal(
  signal: AlertSignal,
): void {
  const key = `${signal.source}:${signal.type}`;

  alertSignals.set(key, {
    ...signal,
    timestamp:
      signal.timestamp || new Date().toISOString(),
  });
}

export function clearAlertSignal(
  source: AlertSignalSource,
  type: string,
): void {
  const key = `${source}:${type}`;

  alertSignals.delete(key);
}

export function getAlertSignals(): AlertSignal[] {
  return Array.from(alertSignals.values());
}

export function getActiveAlertSignals(): AlertSignal[] {
  return Array.from(alertSignals.values()).filter(
    (signal) => signal.active,
  );
}