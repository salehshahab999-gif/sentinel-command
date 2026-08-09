import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/database/database.log";

export async function writeDatabaseLog(message: string) {
  await mkdir(dirname(logFile), { recursive: true });

  const line = `${new Date().toISOString()} ${message}\n`;

  await appendFile(logFile, line);
}
