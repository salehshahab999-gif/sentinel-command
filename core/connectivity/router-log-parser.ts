export type RouterLogEventType =
  | "WAN_UP"
  | "WAN_DOWN"
  | "DSL_UP"
  | "DSL_DOWN"
  | "PPP_CONNECTED"
  | "PPP_DISCONNECTED"
  | "DNS_EVENT"
  | "LAN_UP"
  | "LAN_DOWN"
  | "CLIENT_EVENT"
  | "ROUTING_EVENT"
  | "CONNECTION_STATE"
  | "HEARTBEAT"
  | "SYSTEM_EVENT"
  | "UNKNOWN";

export type RouterLogSeverity =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export interface RouterLogEvent {
  receiverTimestamp: string | null;
  routerTimestamp: string | null;
  source: string;
  priority: number | null;
  service: string | null;
  type: RouterLogEventType;
  severity: RouterLogSeverity;
  message: string;
  raw: string;
}

function extractPriority(message: string): {
  priority: number | null;
  message: string;
} {
  const match = message.match(
    /^<(\d+)>\s*(.*)$/,
  );

  if (!match) {
    return {
      priority: null,
      message,
    };
  }

  return {
    priority: Number.parseInt(
      match[1],
      10,
    ),
    message: match[2].trim(),
  };
}

function extractRouterTimestamp(message: string): {
  routerTimestamp: string | null;
  message: string;
} {
  const match = message.match(
    /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(.*)$/,
  );

  if (!match) {
    return {
      routerTimestamp: null,
      message,
    };
  }

  return {
    routerTimestamp: match[1],
    message: match[2].trim(),
  };
}

function extractService(message: string): {
  service: string | null;
  message: string;
} {
  const match = message.match(
    /^([A-Za-z0-9_.-]+):\s*(.*)$/,
  );

  if (!match) {
    return {
      service: null,
      message,
    };
  }

  return {
    service: match[1],
    message: match[2].trim(),
  };
}

function detectSeverity(
  message: string,
): RouterLogSeverity {
  const text = message.toLowerCase();

  if (
    text.includes("panic") ||
    text.includes("critical")
  ) {
    return "CRITICAL";
  }

  if (
    text.includes("error") ||
    text.includes("failed") ||
    text.includes("fail") ||
    text.includes("refused")
  ) {
    return "ERROR";
  }

  if (
    text.includes("down") ||
    text.includes("disconnect") ||
    text.includes("unavailable")
  ) {
    return "WARNING";
  }

  return "INFO";
}

function detectEventType(
  message: string,
): RouterLogEventType {
  const text = message.toLowerCase();

  if (
    text.includes(
      "wan connection: wan was restored",
    ) ||
    text.includes(
      "wan connection: wan link up",
    )
  ) {
    return "WAN_UP";
  }

  if (
    text.includes(
      "wan connection: wan link down",
    )
  ) {
    return "WAN_DOWN";
  }

  if (
    text.includes(
      "link state: dsl link up",
    )
  ) {
    return "DSL_UP";
  }

  if (
    text.includes(
      "dsl link down",
    )
  ) {
    return "DSL_DOWN";
  }

  if (
    text.includes(
      "authentication success",
    ) ||
    text.includes(
      "pap authentication succeeded",
    ) ||
    text.includes(
      "ppp session",
    ) ||
    text.includes(
      "using interface ppp",
    )
  ) {
    return "PPP_CONNECTED";
  }

  if (
    text.includes("pppd") &&
    (
      text.includes("exit") ||
      text.includes("disconnect") ||
      text.includes("down")
    )
  ) {
    return "PPP_DISCONNECTED";
  }

  if (
    text.includes("dnsmasq") ||
    text.includes("nameserver")
  ) {
    return "DNS_EVENT";
  }

  if (
    text.includes("link state: lan_") ||
    text.includes("lan_1 up") ||
    text.includes("lan_1 down")
  ) {
    return text.includes("up")
      ? "LAN_UP"
      : "LAN_DOWN";
  }

  if (
    text.includes("ap setkeys") ||
    text.includes("rcv wcid") ||
    text.includes("addbareq")
  ) {
    return "CLIENT_EVENT";
  }

  if (
    text.includes("route_setting") ||
    text.includes("routing table")
  ) {
    return "ROUTING_EVENT";
  }

  if (
    text.includes("conntrackinfo")
  ) {
    return "HEARTBEAT";
  }

  if (
    text.includes("connection state") ||
    text.includes("connection_state")
  ) {
    return "CONNECTION_STATE";
  }

  if (
    text.includes("syslogd") ||
    text.includes("kernel") ||
    text.includes("syslog")
  ) {
    return "SYSTEM_EVENT";
  }

  return "UNKNOWN";
}

function extractReceiverTimestamp(
  raw: string,
): string | null {
  const match = raw.match(
    /^\[([^\]]+)\]/,
  );

  return match?.[1] ?? null;
}

function extractSource(
  raw: string,
): string {
  const match = raw.match(
    /^\[[^\]]+\]\s+\[([^\]]+)\]/,
  );

  return match?.[1] ?? "unknown";
}

function extractMessage(
  raw: string,
): string {
  const match = raw.match(
    /^\[[^\]]+\]\s+\[[^\]]+\]\s+(.*)$/,
  );

  return (
    match?.[1]?.trim() ??
    raw.trim()
  );
}

export function parseRouterLogLine(
  raw: string,
): RouterLogEvent {
  const trimmed =
    raw.trim();

  const receiverTimestamp =
    extractReceiverTimestamp(
      trimmed,
    );

  const source =
    extractSource(
      trimmed,
    );

  const outerMessage =
    extractMessage(
      trimmed,
    );

  const priorityResult =
    extractPriority(
      outerMessage,
    );

  const routerTimestampResult =
    extractRouterTimestamp(
      priorityResult.message,
    );

  const serviceResult =
    extractService(
      routerTimestampResult.message,
    );

  const message =
    serviceResult.message;

  return {
    receiverTimestamp,

    routerTimestamp:
      routerTimestampResult.routerTimestamp,

    source,

    priority:
      priorityResult.priority,

    service:
      serviceResult.service,

    type:
      detectEventType(
        message,
      ),

    severity:
      detectSeverity(
        message,
      ),

    message,

    raw: trimmed,
  };
}

export function parseRouterLogs(
  content: string,
): RouterLogEvent[] {
  return content
    .split(/\r?\n/)
    .map(
      (line) => line.trim(),
    )
    .filter(
      (line) => line.length > 0,
    )
    .map(
      (line) =>
        parseRouterLogLine(line),
    );
}

export function filterImportantRouterEvents(
  events: RouterLogEvent[],
): RouterLogEvent[] {
  return events.filter(
    (event) =>
      event.type !== "HEARTBEAT" &&
      event.type !== "UNKNOWN",
  );
}