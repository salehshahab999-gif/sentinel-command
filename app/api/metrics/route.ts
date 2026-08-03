import os from "os";

export async function GET() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  const usedMemory = totalMemory - freeMemory;

  const ramPercent = Math.round((usedMemory / totalMemory) * 100);

  const uptime = Math.floor(os.uptime());

  return Response.json({
    cpu: "Checking...",
    ram: `${ramPercent}%`,
    uptime: `${uptime} seconds`,
  });
}
