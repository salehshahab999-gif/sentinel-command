import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/database/database.log";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "TEST";

interface DatabaseLogOptions {
  level?: LogLevel;
  event?: string;
  status?: string;
  details?: unknown;
}

export async function writeDatabaseLog(
  message: string,
  options: DatabaseLogOptions = {},
) {
  const timestamp = new Date().toISOString();
  const level = options.level ?? "INFO";
  const event = options.event ?? "DATABASE_EVENT";
  const status = options.status ?? "INFO";

  let details = "";

  if (options.details !== undefined) {
    try {
      details = ` | DETAILS=${JSON.stringify(options.details)}`;
    } catch {
      details = " | DETAILS=[UNSERIALIZABLE]";
    }
  }

  const line =
    `${timestamp} | ${level} | DATABASE | ${event} | ` +
    `STATUS=${status} | ${message}${details}\n`;

  // Vercel serverless file system is temporary
  // Keep file logging only for local environment
  if (!process.env.VERCEL) {
    await mkdir(dirname(logFile), { recursive: true });
    await appendFile(logFile, line, "utf-8");
  } else {
    console.log(line.trim());
  }
}