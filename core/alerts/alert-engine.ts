import type { SentinelEvent } from "../events/Event";
import type { SentinelAlert } from "./alert-types";

export function createAlertFromEvent(
  event: SentinelEvent,
): SentinelAlert {
  return {
    id: `ALERT-${event.id}`,
    createdAt: new Date().toISOString(),
    severity: event.severity,
    status: event.status,
    source: event.source,
    type: event.type,
    title: event.type,
    description: event.description,
    eventId: event.id,
    data: event.data,
  };
}