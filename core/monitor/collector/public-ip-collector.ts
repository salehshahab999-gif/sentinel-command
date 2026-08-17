import type { CollectorResult } from "./collector-types";

export async function collectPublicIP(): Promise<CollectorResult> {
  const response = await fetch("https://ipinfo.io/json");

  const data = await response.json();

  return {
    name: "Public IP Intelligence",
    status: "READY",
    value: {
      ip: data.ip,
      hostname: data.hostname,
      city: data.city,
      region: data.region,
      country: data.country,
      location: data.loc,
      organization: data.org,
    },
    timestamp: new Date().toISOString(),
  };
}