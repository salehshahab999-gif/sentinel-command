import type { SentinelEvent } from "./Event";
import { createEvent } from "./event-service";
import { createAlertFromEvent } from "../alerts/alert-engine";
import type { SentinelAlert } from "../alerts/alert-types";

export interface EventPipelineResult {
  events: SentinelEvent[];
  alerts: SentinelAlert[];
}

export function processEventPipeline(
  input: SentinelEvent[],
): EventPipelineResult {

  const events = input.map((event) =>
    createEvent(event)
  );

  const alerts = events.map((event) =>
    createAlertFromEvent(event)
  );

  return {
    events,
    alerts,
  };
}