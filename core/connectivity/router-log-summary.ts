import type {
  RouterLogEvent,
  RouterLogEventType,
  RouterLogSeverity,
} from "./router-log-parser";

export interface RouterLogSummary {
  generatedAt: string;

  totalEvents: number;

  byType: Record<
    RouterLogEventType,
    number
  >;

  bySeverity: Record<
    RouterLogSeverity,
    number
  >;

  firstEventAt: string | null;
  lastEventAt: string | null;

  wanUp: number;
  wanDown: number;

  dslUp: number;
  dslDown: number;

  pppConnected: number;
  pppDisconnected: number;

  dnsEvents: number;

  lanUp: number;
  lanDown: number;

  clientEvents: number;
  routingEvents: number;
  systemEvents: number;
  unknownEvents: number;
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
    CONNECTION_STATE: 0,
    HEARTBEAT: 0,
    ROUTING_EVENT: 0,
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

export function summarizeRouterLogs(
  events: RouterLogEvent[],
): RouterLogSummary {
  const byType =
    createTypeCounter();

  const bySeverity =
    createSeverityCounter();

  let wanUp = 0;
  let wanDown = 0;

  let dslUp = 0;
  let dslDown = 0;

  let pppConnected = 0;
  let pppDisconnected = 0;

  let dnsEvents = 0;

  let lanUp = 0;
  let lanDown = 0;

  let clientEvents = 0;
  let routingEvents = 0;
  let systemEvents = 0;
  let unknownEvents = 0;

  for (const event of events) {
    byType[event.type] += 1;
    bySeverity[event.severity] += 1;

    switch (event.type) {
      case "WAN_UP":
        wanUp += 1;
        break;

      case "WAN_DOWN":
        wanDown += 1;
        break;

      case "DSL_UP":
        dslUp += 1;
        break;

      case "DSL_DOWN":
        dslDown += 1;
        break;

      case "PPP_CONNECTED":
        pppConnected += 1;
        break;

      case "PPP_DISCONNECTED":
        pppDisconnected += 1;
        break;

      case "DNS_EVENT":
        dnsEvents += 1;
        break;

      case "LAN_UP":
        lanUp += 1;
        break;

      case "LAN_DOWN":
        lanDown += 1;
        break;

      case "CLIENT_EVENT":
        clientEvents += 1;
        break;

      case "ROUTING_EVENT":
        routingEvents += 1;
        break;

      case "SYSTEM_EVENT":
        systemEvents += 1;
        break;

      case "UNKNOWN":
        unknownEvents += 1;
        break;

      case "CONNECTION_STATE":
      case "HEARTBEAT":
        break;
    }
  }

  const timestamps = events
    .map(
      (event) =>
        event.receiverTimestamp ??
        event.routerTimestamp,
    )
    .filter(
      (
        value,
      ): value is string =>
        value !== null,
    )
    .sort();

  return {
    generatedAt:
      new Date().toISOString(),

    totalEvents:
      events.length,

    byType,
    bySeverity,

    firstEventAt:
      timestamps[0] ??
      null,

    lastEventAt:
      timestamps[timestamps.length - 1] ??
      null,

    wanUp,
    wanDown,

    dslUp,
    dslDown,

    pppConnected,
    pppDisconnected,

    dnsEvents,

    lanUp,
    lanDown,

    clientEvents,
    routingEvents,
    systemEvents,
    unknownEvents,
  };
}