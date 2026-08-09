import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/api/api.log";

export async function writeApiLog(
  method: string,
  path: string,
  status: string,
) {
  await mkdir(dirname(logFile), { recursive: true });

  const line = `${new Date().toISOString()} ${method} ${path} ${status}\n`;

  await appendFile(logFile, line);
}
