import os from "os";
import { execSync } from "child_process";

export async function GET() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  const usedMemory = totalMemory - freeMemory;

  const ramPercent = Math.round((usedMemory / totalMemory) * 100);

  const uptimeSeconds = Math.floor(os.uptime());

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  let cpu = "0";

  try {
    cpu = execSync("wmic cpu get loadpercentage")
      .toString()
      .split("\n")
      .filter((line) => line.trim() !== "")[1]
      .trim();
  } catch {
    cpu = "N/A";
  }

  return Response.json({
    cpu: `${cpu}%`,
    ram: `${ramPercent}%`,
    uptime: `${hours}h ${minutes}m ${seconds}s`,
  });
}