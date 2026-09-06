import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveStoragePath } from "../../../../../../../core/storage/storage-runtime";

const WORLD_DIR = resolveStoragePath("MAP");
const CACHE_DIR = path.join(WORLD_DIR, "cache");
const OFFLINE_TILE_DIR = path.join(WORLD_DIR, "tiles");
const TILE_HOST = "tile.openstreetmap.org";

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

async function writeCachedTile(z: string, x: string, y: string, body: ArrayBuffer): Promise<void> {
  const target = tilePath(CACHE_DIR, z, x, y);
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y: rawY } = await params;
  const y = normalizeY(rawY);

  if (!isSafeTilePart(z) || !isSafeTilePart(x) || !y) {
    return new Response("Invalid tile", { status: 400 });
  }

  const offline = await readTile(OFFLINE_TILE_DIR, z, x, y);
  if (offline) {
    return imageResponse(offline, "OFFLINE-DATASET");
  }

  const cached = await readTile(CACHE_DIR, z, x, y);
  if (cached) {
    return imageResponse(cached, "LOCAL-CACHE");
  }

  try {
    const upstream = await fetch(`https://${TILE_HOST}/${z}/${x}/${y}.png`, {
      headers: {
        Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
        "User-Agent": process.env.SENTINEL_MAP_USER_AGENT ?? "Sentinel-Command-Center/1.0 local map tile cache",
      },
    });

    if (upstream.ok) {
      const body = await upstream.arrayBuffer();
      await writeCachedTile(z, x, y, body);
      return new Response(body, {
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Sentinel-Map": "ONLINE-CACHED",
        },
      });
    }
  } catch {
    // Offline-first: an unavailable online provider must not break the globe.
  }

  return new Response("Map tile unavailable", {
    status: 503,
    headers: {
      "X-Sentinel-Map": "OFFLINE-MISS",
      "Cache-Control": "no-store",
    },
  });
}
