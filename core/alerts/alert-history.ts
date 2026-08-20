import type { EventSeverity, EventStatus } from "../events/Event";

export type AlertHistoryAction =
  | "CREATED"
  | "ACKNOWLEDGED"
  | "PROCESSING"
  | "RESOLVED";

export interface AlertHistoryEntry {
  id: string;
  alertId: string;
  action: AlertHistoryAction;
  timestamp: string;
  severity: EventSeverity;
  status: EventStatus;
  source: string;
  message: string;
  data?: Record<string, unknown>;
}