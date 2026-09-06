import type { VesselRecord } from "./maritime-contracts";

const OPENWATERS_VESSELS_URL = "https://ais.openwaters.io/v1/vessels";

interface OpenWatersFeature {
  id?: number | string;
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    mmsi?: number;
    imo?: number;
    name?: string;
    type?: number;
    cog?: number;
    sog?: number;
    heading?: number;
    nav_status?: number;
    seen?: string;
  };
}

interface OpenWatersCollection {
  features?: OpenWatersFeature[];
}

function shipTypeFromAisCode(code?: number): VesselRecord["type"] {
  if (code === undefined) return "UNKNOWN";
  if (code >= 80 && code <= 89) return "TANKER";
  if (code >= 70 && code <= 79) return "CARGO";
  if (code >= 60 && code <= 69) return "PASSENGER";
  if (code >= 30 && code <= 39) return "FISHING";
  if (code >= 90 && code <= 99) return "OTHER";
  return "OTHER";
}

export async function fetchOpenWatersSnapshot(bbox?: [number, number, number, number]): Promise<VesselRecord[]> {
  const url = new URL(OPENWATERS_VESSELS_URL);

  if (bbox) {
    url.searchParams.set("bbox", bbox.join(","));
  }

  const response = await fetch(url, {
    headers: { Accept: "application/geo+json, application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Open Waters request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OpenWatersCollection;

  return (payload.features ?? []).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates;
    const properties = feature.properties;

    if (!coordinates || coordinates.length < 2 || !properties) return [];

    const [longitude, latitude] = coordinates;
    const mmsi = properties.mmsi ?? (typeof feature.id === "number" ? feature.id : undefined);

    return [{
      id: `OW-${mmsi ?? feature.id ?? `${latitude}-${longitude}`}`,
      mmsi,
      imo: properties.imo,
      name: properties.name?.trim() || "UNKNOWN VESSEL",
      type: shipTypeFromAisCode(properties.type),
      source: "OPENWATERS" as const,
      dataMode: "LIVE" as const,
      latitude,
      longitude,
      speedKnots: properties.sog,
      courseDeg: properties.cog,
      headingDeg: properties.heading,
      state: properties.sog === undefined ? "UNKNOWN" : properties.sog < 0.5 ? "ANCHORED" : properties.sog < 3 ? "SLOW" : "MOVING",
      lastUpdate: properties.seen ?? new Date().toISOString(),
    }];
  });
}
