import type {
  RouterLogEvent,
  RouterLogEventType,
  RouterLogSeverity,
} from "./router-log-parser";

export type NormalizedRouterEvent = {
  timestamp: string | null;
  source: string;

  category:
    | "WAN"
    | "DSL"
    | "PPP"
    | "DNS"
    | "LAN"
    | "CLIENT"
    | "ROUTING"
    | "SYSTEM"
    | "OTHER";

  type: RouterLogEventType;
  severity: RouterLogSeverity;

  message: string;
  raw: string;

  signals: {
    wan: "UP" | "DOWN" | "UNKNOWN";
    dsl: "UP" | "DOWN" | "UNKNOWN";
    ppp:
      | "CONNECTED"
      | "DISCONNECTED"
      | "UNKNOWN";
    dns: "UP" | "DOWN" | "UNKNOWN";
    lan: "UP" | "DOWN" | "UNKNOWN";
  };
};

function getCategory(
  type: RouterLogEventType,
): NormalizedRouterEvent["category"] {
  switch (type) {
    case "WAN_UP":
    case "WAN_DOWN":
      return "WAN";

    case "DSL_UP":
    case "DSL_DOWN":
      return "DSL";

    case "PPP_CONNECTED":
    case "PPP_DISCONNECTED":
      return "PPP";

    case "DNS_EVENT":
      return "DNS";

    case "LAN_UP":
    case "LAN_DOWN":
      return "LAN";

    case "CLIENT_EVENT":
      return "CLIENT";

    case "ROUTING_EVENT":
      return "ROUTING";

    case "SYSTEM_EVENT":
      return "SYSTEM";

    default:
      return "OTHER";
  }
}

function getDnsSignal(
  event: RouterLogEvent,
): NormalizedRouterEvent["signals"]["dns"] {
  if (
    event.type !==
    "DNS_EVENT"
  ) {
    return "UNKNOWN";
  }

  const message =
    event.message.toLowerCase();

  if (
    message.includes("refused") ||
    message.includes("failed") ||
    message.includes("fail") ||
    message.includes("error") ||
    message.includes("timeout") ||
    message.includes("unreachable")
  ) {
    return "DOWN";
  }

  if (
    message.includes(
      "using nameserver",
    ) ||
    message.includes(
      "reading /etc/resolv.conf",
    ) ||
    message.includes(
      "read /etc/hosts",
    )
  ) {
    return "UP";
  }

  return "UNKNOWN";
}

function createSignals(
  event: RouterLogEvent,
): NormalizedRouterEvent["signals"] {
  const type =
    event.type;

  return {
    wan:
      type === "WAN_UP"
        ? "UP"
        : type === "WAN_DOWN"
          ? "DOWN"
          : "UNKNOWN",

    dsl:
      type === "DSL_UP"
        ? "UP"
        : type === "DSL_DOWN"
          ? "DOWN"
          : "UNKNOWN",

    ppp:
      type ===
      "PPP_CONNECTED"
        ? "CONNECTED"
        : type ===
            "PPP_DISCONNECTED"
          ? "DISCONNECTED"
          : "UNKNOWN",

    dns:
      getDnsSignal(
        event,
      ),

    lan:
      type === "LAN_UP"
        ? "UP"
        : type === "LAN_DOWN"
          ? "DOWN"
          : "UNKNOWN",
  };
}

export function normalizeRouterEvent(
  event: RouterLogEvent,
): NormalizedRouterEvent {
  return {
    timestamp:
      event.routerTimestamp,

    source:
      event.source,

    category:
      getCategory(
        event.type,
      ),

    type:
      event.type,

    severity:
      event.severity,

    message:
      event.message,

    raw:
      event.raw,

    signals:
      createSignals(
        event,
      ),
  };
}

export function normalizeRouterEvents(
  events: RouterLogEvent[],
): NormalizedRouterEvent[] {
  return events.map(
    normalizeRouterEvent,
  );
}