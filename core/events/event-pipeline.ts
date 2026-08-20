import type { SentinelEvent } from "./Event";

import { createEvent } from "./event-service";

import { createAlertFromEvent } from "../alerts/alert-engine";

import type { SentinelAlert } from "../alerts/alert-types";

import { saveAlert } from "../alerts/alert-repository";

export interface EventPipelineResult {
  events: SentinelEvent[];
  alerts: SentinelAlert[];
}

export async function processEventPipeline(
  input: SentinelEvent[],
): Promise<EventPipelineResult> {
  const events = input.map((event) =>
    createEvent(event)
  );

  const alerts = events.map((event) =>
    createAlertFromEvent(event)
  );

  for (const alert of alerts) {
    await saveAlert(alert);
  }

  return {
    events,
    alerts,
  };
}