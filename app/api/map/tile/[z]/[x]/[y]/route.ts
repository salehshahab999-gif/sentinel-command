import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveStoragePath } from "../../../../../../../core/storage/storage-runtime";

const WORLD_DIR = resolveStoragePath("MAP");
const CACHE_ROOT = path.join(WORLD_DIR, "cache");
const PROVIDER_TIMEOUT_MS = 4000;
const SENTINEL_MAP_REFERER =
  process.env.SENTINEL_MAP_REFERER?.trim() ??
  "http://127.0.0.1:3000/";
const SENTINEL_USER_AGENT =
  process.env.SENTINEL_MAP_USER_AGENT?.trim() ??
  "Sentinel-Command-Center/1.0 local map tile cache";

type MapMode = "map" | "imagery" | "labels";

type Provider = {
  id: string;
  label: string;
  buildUrl: (z: string, x: string, y: string) => string | null;
};

function isSafeTilePart(value: string): boolean {
  return /^\d{1,6}$/.test(value);
}

function normalizeY(value: string): string | null {
  const y = value.endsWith(".png") ? value.slice(0, -4) : value;
  return isSafeTilePart(y) ? y : null;
}

function cachePath(providerId: string, mode: MapMode, z: string, x: string, y: string): string {
  return path.join(CACHE_ROOT, mode, providerId, z, x, `${y}.png`);
}

async function readCachedTile(
  providerId: string,
  mode: MapMode,
  z: string,
  x: string,
  y: string,
): Promise<Buffer | null> {
  try {
    return await fs.readFile(cachePath(providerId, mode, z, x, y));
  } catch {
    return null;
  }
}

async function writeCachedTile(
  providerId: string,
  mode: MapMode,
  z: string,
  x: string,
  y: string,
  body: Buffer,
): Promise<void> {
  const target = cachePath(providerId, mode, z, x, y);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body);
}

function imageResponse(data: Buffer, source: string): Response {
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Sentinel-Map": source,
    },
  });
}

function providersForMode(mode: MapMode): Provider[] {
  if (mode === "imagery") {
    return [
      {
        id: "esri-world-imagery",
        label: "ESRI-WORLD-IMAGERY",
        buildUrl: (z, x, y) =>
          `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
      },
    ];
  }

  if (mode === "labels") {
    return [
      {
        id: "esri-reference-world-boundaries-places",
        label: "ESRI-BOUNDARIES-PLACES",
        buildUrl: (z, x, y) =>
          `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`,
      },
    ];
  }

  return [
    {
      id: "osm",
      label: "OSM-STANDARD",
      buildUrl: (z, x, y) =>
        `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    },
  ];
}

async function fetchProviderTile(
  provider: Provider,
  mode: MapMode,
  z: string,
  x: string,
  y: string,
): Promise<Response | null> {
  const url = provider.buildUrl(z, x, y);
  if (!url) return null;

  try {
    const headers: Record<string, string> = {
      Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
      "User-Agent": SENTINEL_USER_AGENT,
    };

    if (provider.id === "osm") {
      headers.Referer = SENTINEL_MAP_REFERER;
    }

    const upstream = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!upstream.ok) return null;

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) return null;

    const body = Buffer.from(await upstream.arrayBuffer());
    if (!body.length) return null;

    await writeCachedTile(provider.id, mode, z, x, y, body);
    return imageResponse(body, `${provider.label}-ONLINE-CACHED`);
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y: rawY } = await params;
  const y = normalizeY(rawY);

  if (!isSafeTilePart(z) || !isSafeTilePart(x) || !y) {
    return new Response("Invalid tile", { status: 400 });
  }

  const requestedMode = new URL(request.url).searchParams.get("mode");
  const mode: MapMode =
    requestedMode === "imagery" || requestedMode === "labels"
      ? requestedMode
      : "map";

  const providers = providersForMode(mode);

  for (const provider of providers) {
    const cached = await readCachedTile(provider.id, mode, z, x, y);
    if (cached) {
      return imageResponse(cached, `${provider.label}-LOCAL-CACHE`);
    }
  }

  for (const provider of providers) {
    const online = await fetchProviderTile(provider, mode, z, x, y);
    if (online) return online;
  }

  return new Response("Map tile unavailable", {
    status: 503,
    headers: {
      "X-Sentinel-Map": `ALL-PROVIDERS-MISS-${mode.toUpperCase()}`,
      "Cache-Control": "no-store",
    },
  });
}
