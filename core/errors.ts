import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/errors/error.log";

export async function writeErrorLog(error: string, source: string) {
  await mkdir(dirname(logFile), { recursive: true });

  const line = `${new Date().toISOString()} ERROR ${source}: ${error}\n`;

  await appendFile(logFile, line);
}
