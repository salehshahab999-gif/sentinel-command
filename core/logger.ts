import { appendFile } from "fs/promises";

export async function writeLog(message: string) {
  const line = `${new Date().toISOString()} ${message}\n`;

  await appendFile(
    "logs/core/system.log",
    line
  );
}