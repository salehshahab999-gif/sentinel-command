export type EventSeverity =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export type EventStatus =
  | "NEW"
  | "PROCESSING"
  | "RESOLVED";

export interface SentinelEvent {
  id: string;

  timestamp: string;

  type: string;

  source: string;

  severity: EventSeverity;

  status: EventStatus;

  description: string;

  data?: Record<string, unknown>;
}