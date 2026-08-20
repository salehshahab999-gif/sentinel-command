import type {
  EventSeverity,
  EventStatus,
  SentinelEvent,
} from "../events/Event";

export interface SentinelAlert {
  id: string;
  createdAt: string;
  severity: EventSeverity;
  status: EventStatus;
  source: string;
  type: string;
  title: string;
  description: string;
  eventId: string;
  data?: Record<string, unknown>;
}

export type AlertInput = SentinelEvent;