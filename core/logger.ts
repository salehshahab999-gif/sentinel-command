import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/core/system.log";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "TEST";

type LogSource =
  "CORE" | "API" | "DATABASE" | "EVENT" | "SECURITY" | "BACKUP" | "SYSTEM";

interface LogDetails {
  level?: LogLevel;
  source?: LogSource;
  event?: string;
  status?: string;
  details?: unknown;
}

export async function writeLog(message: string, options: LogDetails = {}) {
  await mkdir(dirname(logFile), { recursive: true });

  const timestamp = new Date().toISOString();
  const level = options.level ?? "INFO";
  const source = options.source ?? "CORE";
  const event = options.event ?? "GENERAL";
  const status = options.status ?? "INFO";

  let details = "";

  if (options.details !== undefined) {
    details = ` | DETAILS=${JSON.stringify(options.details)}`;
  }

  const line =
    `${timestamp} | ${level} | ${source} | ${event} | ${status} | ` +
    `${message}${details}\n`;

  await appendFile(logFile, line, "utf-8");
}
