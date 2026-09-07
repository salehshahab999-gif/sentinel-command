import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveStoragePath } from "../../../../../../../core/storage/storage-runtime";

const WORLD_DIR = resolveStoragePath("MAP");
const NESHAN_CACHE_DIR = path.join(WORLD_DIR, "cache", "neshan");
const OSM_CACHE_DIR = path.join(WORLD_DIR, "cache", "osm");
const TILE_HOST = "tile.openstreetmap.org";
const NESHAN_TILE_HOST = "map.neshan.org";
const NESHAN_API_KEY = process.env.NESHAN_API_KEY?.trim();
const PROVIDER_TIMEOUT_MS = 3000;

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
  body: ArrayBuffer,
): Promise<void> {
  const target = tilePath(root, z, x, y);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, Buffer.from(body));
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

async function fetchNeshanTile(z: string, x: string, y: string): Promise<Response | null> {
  if (!NESHAN_API_KEY) return null;

  try {
    const upstream = await fetch(
      `https://${NESHAN_TILE_HOST}/${z}/${x}/${y}.png?key=${encodeURIComponent(NESHAN_API_KEY)}`,
      {
        headers: {
          Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
          "User-Agent":
            process.env.SENTINEL_MAP_USER_AGENT ??
            "Sentinel-Command-Center/1.0 local map tile cache",
        },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      },
    );

    if (!upstream.ok) return null;

    const body = await upstream.arrayBuffer();
    await writeCachedTile(NESHAN_CACHE_DIR, z, x, y, body);

    return new Response(body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Sentinel-Map": "NESHAN-ONLINE-CACHED",
      },
    });
  } catch {
    return null;
  }
}

async function fetchOsmTile(z: string, x: string, y: string): Promise<Response | null> {
  try {
    const upstream = await fetch(`https://${TILE_HOST}/${z}/${x}/${y}.png`, {
      headers: {
        Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
        "User-Agent":
          process.env.SENTINEL_MAP_USER_AGENT ??
          "Sentinel-Command-Center/1.0 local map tile cache",
      },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!upstream.ok) return null;

    const body = await upstream.arrayBuffer();
    await writeCachedTile(OSM_CACHE_DIR, z, x, y, body);

    return new Response(body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Sentinel-Map": "OSM-ONLINE-CACHED",
      },
    });
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

  // Provider order: Neshan first, then OSM. Each provider has its own local cache.
  const neshanCached = await readTile(NESHAN_CACHE_DIR, z, x, y);
  if (neshanCached) {
    return imageResponse(neshanCached, "NESHAN-LOCAL-CACHE");
  }

  const neshanOnline = await fetchNeshanTile(z, x, y);
  if (neshanOnline) return neshanOnline;

  const osmCached = await readTile(OSM_CACHE_DIR, z, x, y);
  if (osmCached) {
    return imageResponse(osmCached, "OSM-LOCAL-CACHE-FALLBACK");
  }

  const osmOnline = await fetchOsmTile(z, x, y);
  if (osmOnline) return osmOnline;

  return new Response("Map tile unavailable", {
    status: 503,
    headers: {
      "X-Sentinel-Map": "ALL-PROVIDERS-MISS",
      "Cache-Control": "no-store",
    },
  });
}
