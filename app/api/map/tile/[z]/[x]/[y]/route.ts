import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveStoragePath } from "../../../../../../../core/storage/storage-runtime";

const WORLD_DIR = resolveStoragePath("MAP");

const CACHE_ROOT = path.join(WORLD_DIR, "cache");
const PROVIDER_CACHES = {
  carto: path.join(CACHE_ROOT, "carto"),
  esri: path.join(CACHE_ROOT, "esri"),
  osm: path.join(CACHE_ROOT, "osm"),
} as const;

const PROVIDER_TIMEOUT_MS = 3000;
const CARTO_API_KEY = process.env.CARTO_BASEMAP_API_KEY?.trim();
const SENTINEL_MAP_REFERER =
  process.env.SENTINEL_MAP_REFERER?.trim() ??
  "http://127.0.0.1:3000/";
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

async function readTile(
  root: string,
  z: string,
  x: string,
  y: string,
): Promise<Buffer | null> {
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
  {
    id: "esri",
    label: "ESRI-WORLD-IMAGERY",
    buildUrl: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
  {
    id: "osm",
    label: "OSM-STANDARD",
    buildUrl: (z, x, y) =>
      `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  },
];

async function fetchProviderTile(provider: Provider, z: string, x: string, y: string) {
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

  // Try every local cache first, then every online provider.
  for (const provider of providers) {
    const cached = await readTile(PROVIDER_CACHES[provider.id], z, x, y);
    if (cached) {
      return imageResponse(cached, `${provider.label}-LOCAL-CACHE`);
    }
  }

  // CARTO is used only when a current provider-owned API key is configured.
  // Esri and OSM remain available as independent online fallbacks.
  for (const provider of providers) {
    const online = await fetchProviderTile(provider, z, x, y);
    if (online) return online;
  }

  return new Response("Map tile unavailable", {
    status: 503,
    headers: {
      "X-Sentinel-Map": "ALL-PROVIDERS-MISS",
      "Cache-Control": "no-store",
    },
  });
}
