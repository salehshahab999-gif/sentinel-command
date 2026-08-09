import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { SentinelEvent } from "./Event";

const logFile = "logs/events/events.log";

export async function writeEventLog(event: SentinelEvent) {
  await mkdir(dirname(logFile), { recursive: true });

  const line = `${JSON.stringify(event)}\n`;

  await appendFile(logFile, line);
}
