import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/api/api.log";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "TEST";

interface ApiLogOptions {
  level?: LogLevel;
  event?: string;
  details?: unknown;
}

export async function writeApiLog(
  method: string,
  path: string,
  status: string,
  options: ApiLogOptions = {},
) {
  await mkdir(dirname(logFile), { recursive: true });

  const timestamp = new Date().toISOString();
  const level = options.level ?? "INFO";
  const event = options.event ?? "API_REQUEST";

  let details = "";

  if (options.details !== undefined) {
    try {
      details = ` | DETAILS=${JSON.stringify(options.details)}`;
    } catch {
      details = " | DETAILS=[UNSERIALIZABLE]";
    }
  }

  const line =
    `${timestamp} | ${level} | API | ${event} | ` +
    `METHOD=${method} | PATH=${path} | STATUS=${status}` +
    `${details}\n`;

  await appendFile(logFile, line, "utf-8");
}