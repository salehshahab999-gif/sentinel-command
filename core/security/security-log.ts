import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/security/security.log";

type SecurityLogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "TEST";

interface SecurityLogOptions {
  level?: SecurityLogLevel;
  event?: string;
  details?: unknown;
}

export async function writeSecurityLog(
  action: string,
  user: string,
  status: string,
  options: SecurityLogOptions = {},
) {
  await mkdir(dirname(logFile), { recursive: true });

  const timestamp = new Date().toISOString();
  const level = options.level ?? "INFO";
  const event = options.event ?? "SECURITY_EVENT";

  let details = "";

  if (options.details !== undefined) {
    try {
      details = ` | DETAILS=${JSON.stringify(options.details)}`;
    } catch {
      details = " | DETAILS=[UNSERIALIZABLE]";
    }
  }

  const line =
    `${timestamp} | ${level} | SECURITY | ${event} | ` +
    `ACTION=${action} | USER=${user} | STATUS=${status}` +
    `${details}\n`;

  await appendFile(logFile, line, "utf-8");
}
