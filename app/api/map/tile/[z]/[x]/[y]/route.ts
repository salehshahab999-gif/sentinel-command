import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveStoragePath } from "../../../../../../../core/storage/storage-runtime";

const WORLD_DIR = resolveStoragePath("MAP");
const CACHE_ROOT = path.join(WORLD_DIR, "cache", "world-street-v2");
const PROVIDER_CACHES = {
  esriStreet: path.join(CACHE_ROOT, "esri-street"),
  osm: path.join(CACHE_ROOT, "osm"),
  carto: path.join(CACHE_ROOT, "carto"),
} as const;

const PROVIDER_TIMEOUT_MS = 1800;
const CARTO_API_KEY = process.env.CARTO_BASEMAP_API_KEY?.trim();
const SENTINEL_MAP_REFERER =
  process.env.SENTINEL_MAP_REFERER?.trim() ?? "http://127.0.0.1:3000/";
const SENTINEL_USER_AGENT =
  process.env.SENTINEL_MAP_USER_AGENT ??
  "Sentinel-Command-Center/1.0 local map tile cache";

function isSafeTilePart(value: string): boolean {
  return /^\d{1,6}$/.test(value);
}

function normalizeY(value: string): string | null {
  const y = value.endsWith(".png") ? value.slice(0, -4) : value;
  return isSafeTilePart(y) ? y : null;
}

function tilePath(root: string, z: string, x: string, y: string): string {
  return path.join(root, z, x, `${y}.png`);
}

async function readTile(root: string, z: string, x: string, y: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(tilePath(root, z, x, y));
  } catch {
    return null;
  }
}

async function writeCachedTile(
  root: string,
  z: string,
  x: string,
  y: string,
  body: Buffer,
): Promise<void> {
  const target = tilePath(root, z, x, y);
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

type Provider = {
  id: keyof typeof PROVIDER_CACHES;
  label: string;
  buildUrl: (z: string, x: string, y: string) => string | null;
};

const providers: Provider[] = [
  {
    id: "esriStreet",
    label: "ESRI-WORLD-STREET",
    buildUrl: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
  },
  {
    id: "osm",
    label: "OSM-STANDARD",
    buildUrl: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  },
  {
    id: "carto",
    label: "CARTO-LIGHT",
    buildUrl: (z, x, y) => {
      if (!CARTO_API_KEY) return null;
      const url = new URL(
        `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`,
      );
      url.searchParams.set("key", CARTO_API_KEY);
      return url.toString();
    },
  },
];

const memoryCache = new Map<string, Buffer>();
const MEMORY_CACHE_LIMIT = 128;

function memoryKey(providerId: string, z: string, x: string, y: string): string {
  return `${providerId}/${z}/${x}/${y}`;
}

function getMemoryTile(key: string): Buffer | null {
  const value = memoryCache.get(key);
  if (!value) return null;
  memoryCache.delete(key);
  memoryCache.set(key, value);
  return value;
}

function setMemoryTile(key: string, body: Buffer): void {
  memoryCache.delete(key);
  memoryCache.set(key, body);
  while (memoryCache.size > MEMORY_CACHE_LIMIT) {
    const oldest = memoryCache.keys().next().value;
    if (oldest === undefined) break;
    memoryCache.delete(oldest);
  }
}

async function fetchProviderTile(provider: Provider, z: string, x: string, y: string): Promise<Response | null> {
  const url = provider.buildUrl(z, x, y);
  if (!url) return null;

  try {
    const headers: Record<string, string> = {
      Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
      "User-Agent": SENTINEL_USER_AGENT,
    };

    if (provider.id === "osm") headers.Referer = SENTINEL_MAP_REFERER;

    const upstream = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!upstream.ok) return null;
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) return null;

    const body = Buffer.from(await upstream.arrayBuffer());
    if (!body.length) return null;

    setMemoryTile(memoryKey(provider.id, z, x, y), body);
    await writeCachedTile(PROVIDER_CACHES[provider.id], z, x, y, body);

    return imageResponse(body, `${provider.label}-ONLINE-CACHED`);
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y: rawY } = await params;
  const y = normalizeY(rawY);

  if (!isSafeTilePart(z) || !isSafeTilePart(x) || !y) {
    return new Response("Invalid tile", { status: 400 });
  }

  // Strict MAP contract: cached street maps first. Never read the old World Imagery cache.
  for (const provider of providers) {
    const key = memoryKey(provider.id, z, x, y);
    const memory = getMemoryTile(key);
    if (memory) return imageResponse(memory, `${provider.label}-MEMORY-CACHE`);

    const cached = await readTile(PROVIDER_CACHES[provider.id], z, x, y);
    if (cached) {
      setMemoryTile(key, cached);
      return imageResponse(cached, `${provider.label}-LOCAL-CACHE`);
    }
  }

  // Fast primary street map, then OSM, then optional keyed CARTO.
  for (const provider of providers) {
    const online = await fetchProviderTile(provider, z, x, y);
    if (online) return online;
  }

  return new Response("Map tile unavailable", {
    status: 503,
    headers: {
      "X-Sentinel-Map": "ALL-STREET-PROVIDERS-MISS",
      "Cache-Control": "no-store",
    },
  });
}
