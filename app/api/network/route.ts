import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

let previousSent = 0;
let previousReceived = 0;
let totalUsed = 0;

async function getNetworkStats() {
  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `
        Get-NetAdapterStatistics |
        Where-Object {
          $_.ReceivedBytes -gt 0 -or $_.SentBytes -gt 0
        } |
        Select-Object Name, ReceivedBytes, SentBytes |
        ConvertTo-Json -Compress
        `,
      ],
      { windowsHide: true },
    );

    if (!stdout.trim()) {
      throw new Error("No network data");
    }

    const data = JSON.parse(stdout);
    const adapters = Array.isArray(data) ? data : [data];

    let sent = 0;
    let received = 0;

    for (const adapter of adapters) {
      sent += Number(adapter.SentBytes || 0);
      received += Number(adapter.ReceivedBytes || 0);
    }

    if (previousSent === 0 && previousReceived === 0) {
      previousSent = sent;
      previousReceived = received;

      return {
        sentDelta: 0,
        receivedDelta: 0,
        totalUsed,
      };
    }

    const sentDelta = Math.max(0, sent - previousSent);
    const receivedDelta = Math.max(0, received - previousReceived);

    previousSent = sent;
    previousReceived = received;

    totalUsed += sentDelta + receivedDelta;

    return {
      sentDelta,
      receivedDelta,
      totalUsed,
    };
  } catch {
    return {
      sentDelta: 0,
      receivedDelta: 0,
      totalUsed,
    };
  }
}

async function getPublicIP() {
  try {
    const response = await fetch("https://ipwho.is/", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("IP lookup failed");
    }

    const data = await response.json();

    return {
      ip: data.ip || "Unknown",
      country: data.country || "Unknown",
      region: data.region || "Unknown",
      city: data.city || "Unknown",
      isp: data.connection?.isp || "Unknown",
      asn: data.connection?.asn ? `AS${data.connection.asn}` : "Unknown",
    };
  } catch {
    return {
      ip: "Unavailable",
      country: "Unavailable",
      region: "Unavailable",
      city: "Unavailable",
      isp: "Unavailable",
      asn: "Unavailable",
    };
  }
}

async function checkInternet() {
  try {
    const response = await fetch("https://1.1.1.1", {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });

    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function getVPNStatus() {
  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        '$a=Get-NetAdapter | Where-Object { $_.Name -match "xray|Wintun|TUN|VPN" -and $_.Status -eq "Up" }; if($a){"Connected"}else{"Disconnected"}',
      ],
      { windowsHide: true },
    );

    return stdout.trim() || "Unknown";
  } catch {
    return "Unknown";
  }
}
async function getLatency() {
  try {
    const { stdout } = await execFileAsync(
      "ping.exe",
      ["1.1.1.1", "-n", "1", "-w", "2000"],
      { windowsHide: true },
    );

    const match = stdout.match(/time[=<](\d+)ms/i);

    if (!match) {
      return "Unavailable";
    }

    return `${match[1]} ms`;
  } catch {
    return "Unavailable";
  }
}

export async function GET() {
  const [network, publicIP, internet, latency] = await Promise.all([
    getNetworkStats(),
    getPublicIP(),
    checkInternet(),
    getLatency(),
  ]);

  return Response.json({
    internet: internet ? "Online" : "Offline",

    send: network.sentDelta,
    receive: network.receivedDelta,

    sessionUsed: network.sentDelta + network.receivedDelta,

    totalUsed: network.totalUsed,

    publicIP: publicIP.ip,
    country: publicIP.country,
    region: publicIP.region,
    city: publicIP.city,
    isp: publicIP.isp,
    asn: publicIP.asn,

    vpn: await getVPNStatus(),
    latency,

    api: "Online",
    database: "Online",

    time: new Date().toLocaleTimeString(),
  });
}

