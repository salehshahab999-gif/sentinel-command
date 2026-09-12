import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveStoragePath } from "../../../../../../../core/storage/storage-runtime";

const WORLD_DIR = resolveStoragePath("MAP");
const CACHE_ROOT = path.join(WORLD_DIR, "cache", "world-street-osm-v3");
const OSM_CACHE = path.join(CACHE_ROOT, "osm");

const PROVIDER_TIMEOUT_MS = 5000;
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

async function readTile(z: string, x: string, y: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(tilePath(OSM_CACHE, z, x, y));
  } catch {
    return null;
  }
}

async function writeCachedTile(
  z: string,
  x: string,
  y: string,
  body: Buffer,
): Promise<void> {
  const target = tilePath(OSM_CACHE, z, x, y);
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

const memoryCache = new Map<string, Buffer>();
const MEMORY_CACHE_LIMIT = 512;
const inFlightTiles = new Map<string, Promise<Response | null>>();

function memoryKey(z: string, x: string, y: string): string {
  return `${z}/${x}/${y}`;
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

async function readCachedTile(
  z: string,
  x: string,
  y: string,
): Promise<Response | null> {
  const key = memoryKey(z, x, y);
  const memory = getMemoryTile(key);

  if (memory) {
    return imageResponse(memory, "OSM-MEMORY-CACHE");
  }

  const disk = await readTile(z, x, y);

  if (!disk) return null;

  setMemoryTile(key, disk);
  return imageResponse(disk, "OSM-LOCAL-CACHE");
}

async function fetchOnlineOsmTile(
  z: string,
  x: string,
  y: string,
): Promise<Response | null> {
  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
        Referer: SENTINEL_MAP_REFERER,
        "User-Agent": SENTINEL_USER_AGENT,
      },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!upstream.ok) return null;

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) return null;

    const body = Buffer.from(await upstream.arrayBuffer());
    if (!body.length) return null;

    const key = memoryKey(z, x, y);
    setMemoryTile(key, body);

    await writeCachedTile(z, x, y, body);

    return imageResponse(body, "OSM-ONLINE-CACHED");
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

  const requestKey = `${z}/${x}/${y}`;

  const cached = await readCachedTile(z, x, y);
  if (cached) return cached;

  const existing = inFlightTiles.get(requestKey);
  if (existing) {
    const shared = await existing;
    if (shared) return shared.clone();
  }

  const pending = fetchOnlineOsmTile(z, x, y).finally(() => {
    inFlightTiles.delete(requestKey);
  });

  inFlightTiles.set(requestKey, pending);

  const online = await pending;
  if (online) return online;

  return new Response("Map tile unavailable", {
    status: 503,
    headers: {
      "X-Sentinel-Map": "OSM-MISS",
      "Cache-Control": "no-store",
    },
  });
}
