import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/ai/ai.log";

type AILogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export async function writeAILog(
  event: string,
  details?: unknown,
  level: AILogLevel = "INFO",
) {
  await mkdir(dirname(logFile), { recursive: true });

  const timestamp = new Date().toISOString();

  let extra = "";

  if (details !== undefined) {
    try {
      extra = ` | DETAILS=${JSON.stringify(details)}`;
    } catch {
      extra = " | DETAILS=[UNSERIALIZABLE]";
    }
  }

  const line = `${timestamp} | ${level} | AI_CORE | ${event}` + `${extra}\n`;

  await appendFile(logFile, line, "utf-8");
}
