import { promises as fs } from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), "data", "map-tile-cache");
const TILE_HOSTS = ["a", "b", "c"];

function isSafeTilePart(value: string): boolean {
  return /^\d{1,3}$/.test(value);
}

function tilePath(z: string, x: string, y: string): string {
  return path.join(CACHE_DIR, z, x, `${y}.png`);
}

async function readCachedTile(z: string, x: string, y: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(tilePath(z, x, y));
  } catch {
    return null;
  }
}

async function writeCachedTile(z: string, x: string, y: string, body: ArrayBuffer): Promise<void> {
  const target = tilePath(z, x, y);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, Buffer.from(body));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y } = await params;

  if (!isSafeTilePart(z) || !isSafeTilePart(x) || !isSafeTilePart(y)) {
    return new Response("Invalid tile", { status: 400 });
  }

  const cached = await readCachedTile(z, x, y);
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Sentinel-Map": "LOCAL-CACHE",
      },
    });
  }

  for (const host of TILE_HOSTS) {
    try {
      const upstream = await fetch(`https://${host}.tile.openstreetmap.org/${z}/${x}/${y}.png`, {
        headers: {
          Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
          "User-Agent": process.env.SENTINEL_MAP_USER_AGENT ?? "Sentinel-Command-Center/1.0 local map tile cache",
        },
        cache: "no-store",
      });

      if (!upstream.ok) continue;

      const body = await upstream.arrayBuffer();
      await writeCachedTile(z, x, y, body);

      return new Response(body, {
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Sentinel-Map": "ONLINE-CACHED",
        },
      });
    } catch {
      // Try the next public tile host, then fail cleanly for offline mode.
    }
  }

  return new Response("Map tile unavailable", {
    status: 503,
    headers: {
      "X-Sentinel-Map": "OFFLINE-MISS",
      "Cache-Control": "no-store",
    },
  });
}
