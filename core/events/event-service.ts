import type { SentinelEvent } from "./Event";

export function createEvent(
  event: SentinelEvent,
): SentinelEvent {
  return {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
    status: event.status || "NEW",
  };
}