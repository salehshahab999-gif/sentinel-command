import fs from "node:fs";
import path from "node:path";

import {
  parseRouterLogs,
} from "./router-log-parser";

import type {
  RouterLogEvent,
  RouterLogEventType,
  RouterLogSeverity,
} from "./router-log-parser";

export interface RouterDailySnapshot {
  date: string;
  source: string;

  totalEvents: number;
  importantEvents: number;

  firstEventAt: string | null;
  lastEventAt: string | null;

  byType: Record<
    RouterLogEventType,
    number
  >;

  bySeverity: Record<
    RouterLogSeverity,
    number
  >;

  wanEvents: number;
  dslEvents: number;
  pppEvents: number;
  dnsEvents: number;
  lanEvents: number;
  clientEvents: number;
  routingEvents: number;
  systemEvents: number;

  connectionStateEvents: number;
  heartbeatEvents: number;

  warnings: number;
  errors: number;
  criticalEvents: number;

  rawLogBytes: number;
}

function createTypeCounter(): Record<
  RouterLogEventType,
  number
> {
  return {
    WAN_UP: 0,
    WAN_DOWN: 0,
    DSL_UP: 0,
    DSL_DOWN: 0,
    PPP_CONNECTED: 0,
    PPP_DISCONNECTED: 0,
    DNS_EVENT: 0,
    LAN_UP: 0,
    LAN_DOWN: 0,
    CLIENT_EVENT: 0,
    ROUTING_EVENT: 0,
    CONNECTION_STATE: 0,
    HEARTBEAT: 0,
    SYSTEM_EVENT: 0,
    UNKNOWN: 0,
  };
}

function createSeverityCounter(): Record<
  RouterLogSeverity,
  number
> {
  return {
    INFO: 0,
    WARNING: 0,
    ERROR: 0,
    CRITICAL: 0,
  };
}

function parseDateFromTimestamp(
  timestamp: string | null,
): string | null {
  if (!timestamp) {
    return null;
  }

  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function countTypes(
  events: RouterLogEvent[],
): Record<
  RouterLogEventType,
  number
> {
  const byType =
    createTypeCounter();

  for (const event of events) {
    byType[event.type] += 1;
  }

  return byType;
}

function countSeverities(
  events: RouterLogEvent[],
): Record<
  RouterLogSeverity,
  number
> {
  const bySeverity =
    createSeverityCounter();

  for (const event of events) {
    bySeverity[event.severity] += 1;
  }

  return bySeverity;
}

function countMatchingTypes(
  events: RouterLogEvent[],
  types: RouterLogEventType[],
): number {
  const allowed =
    new Set(types);

  return events.filter(
    (event) =>
      allowed.has(event.type),
  ).length;
}

export function createRouterDailySnapshot(
  events: RouterLogEvent[],
  rawLogBytes = 0,
): RouterDailySnapshot {
  const timestamps =
    events
      .map(
        (event) =>
          event.receiverTimestamp,
      )
      .filter(
        (
          timestamp,
        ): timestamp is string =>
          timestamp !== null,
      )
      .sort();

  const firstEventAt =
    timestamps[0] ?? null;

  const lastEventAt =
    timestamps[
      timestamps.length - 1
    ] ?? null;

  const dates =
    events
      .map(
        (event) =>
          parseDateFromTimestamp(
            event.receiverTimestamp,
          ),
      )
      .filter(
        (
          date,
        ): date is string =>
          date !== null,
      )
      .sort();

  const date =
    dates[0] ??
    new Date()
      .toISOString()
      .slice(0, 10);

  const source =
    events.find(
      (event) =>
        event.source !==
        "unknown",
    )?.source ??
    "unknown";

  const byType =
    countTypes(events);

  const bySeverity =
    countSeverities(events);

  return {
    date,

    source,

    totalEvents:
      events.length,

    importantEvents:
      events.filter(
        (event) =>
          event.type !==
            "UNKNOWN" &&
          event.type !==
            "HEARTBEAT",
      ).length,

    firstEventAt,

    lastEventAt,

    byType,

    bySeverity,

    wanEvents:
      countMatchingTypes(
        events,
        [
          "WAN_UP",
          "WAN_DOWN",
        ],
      ),

    dslEvents:
      countMatchingTypes(
        events,
        [
          "DSL_UP",
          "DSL_DOWN",
        ],
      ),

    pppEvents:
      countMatchingTypes(
        events,
        [
          "PPP_CONNECTED",
          "PPP_DISCONNECTED",
        ],
      ),

    dnsEvents:
      byType.DNS_EVENT,

    lanEvents:
      countMatchingTypes(
        events,
        [
          "LAN_UP",
          "LAN_DOWN",
        ],
      ),

    clientEvents:
      byType.CLIENT_EVENT,

    routingEvents:
      byType.ROUTING_EVENT,

    systemEvents:
      byType.SYSTEM_EVENT,

    connectionStateEvents:
      byType.CONNECTION_STATE,

    heartbeatEvents:
      byType.HEARTBEAT,

    warnings:
      bySeverity.WARNING,

    errors:
      bySeverity.ERROR,

    criticalEvents:
      bySeverity.CRITICAL,

    rawLogBytes,
  };
}

export function createRouterDailySnapshotFromFile(
  logFilePath = path.join(
    process.cwd(),
    "logs",
    "router",
    "asus-syslog.log",
  ),
): RouterDailySnapshot {
  if (
    !fs.existsSync(
      logFilePath,
    )
  ) {
    return createRouterDailySnapshot(
      [],
      0,
    );
  }

  const raw =
    fs.readFileSync(
      logFilePath,
    );

  const content =
    raw.toString(
      "utf8",
    );

  const events =
    parseRouterLogs(
      content,
    );

  return createRouterDailySnapshot(
    events,
    raw.byteLength,
  );
}