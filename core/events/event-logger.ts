import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { randomUUID } from "crypto";
import { SentinelEvent } from "./Event";

const logFile = "logs/events/events.log";

type EventLogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "TEST";

interface EventLogOptions {
  level?: EventLogLevel;
  status?: string;
  details?: unknown;
}

export async function writeEventLog(
  event: SentinelEvent,
  options: EventLogOptions = {},
) {
  await mkdir(dirname(logFile), { recursive: true });

  const timestamp = new Date().toISOString();
  const logId = randomUUID();

  const level = options.level ?? "INFO";
  const status = options.status ?? event.status ?? "NEW";

  const logRecord = {
    logId,
    timestamp,
    level,
    source: "EVENT",
    event: "SENTINEL_EVENT",
    status,
    eventData: event,
    details: options.details ?? null,
  };

  let line: string;

  try {
    line = `${JSON.stringify(logRecord)}\n`;
  } catch {
    line = `${JSON.stringify({
      logId,
      timestamp,
      level: "ERROR",
      source: "EVENT",
      event: "SENTINEL_EVENT",
      status: "SERIALIZATION_FAILED",
      message: "Failed to serialize Sentinel event",
    })}\n`;
  }

  await appendFile(logFile, line, "utf-8");
}
