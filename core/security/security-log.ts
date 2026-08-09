import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

const logFile = "logs/security/security.log";

export async function writeSecurityLog(
  action: string,
  user: string,
  status: string,
) {
  await mkdir(dirname(logFile), { recursive: true });

  const line = `${new Date().toISOString()} SECURITY ${action} ${user} ${status}\n`;

  await appendFile(logFile, line);
}
