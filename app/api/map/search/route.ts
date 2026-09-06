import { promises as fs } from "node:fs";
import path from "node:path";
import {
  filterMapResults,
  parseMapFilter,
  searchLocalPlaces,
  type MapSearchResult,
} from "../../../../core/map/map-search";

const CACHE_DIR = path.join(process.cwd(), "data", "map-search-cache");
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function safeKey(query: string): string {
  return encodeURIComponent(query.trim().toLocaleLowerCase()).replace(/%/g, "_");
}

async function readCache(query: string): Promise<MapSearchResult[] | null> {
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, `${safeKey(query)}.json`), "utf8");
    const parsed = JSON.parse(raw) as { results?: MapSearchResult[] };
    if (!Array.isArray(parsed.results)) return null;
    return parsed.results.map((result) => ({ ...result, source: "CACHE" as const }));
  } catch {
    return null;
  }
}

async function writeCache(query: string, results: MapSearchResult[]): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CACHE_DIR, `${safeKey(query)}.json`),
    JSON.stringify({ cachedAt: new Date().toISOString(), results }, null, 2),
    "utf8",
  );
}

async function searchOnline(query: string): Promise<MapSearchResult[]> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": process.env.SENTINEL_MAP_USER_AGENT ?? "Sentinel-Command-Center/1.0 local map search",
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Map search provider returned ${response.status}`);

  const data = (await response.json()) as Array<{
    place_id?: number;
    display_name?: string;
    lat?: string;
    lon?: string;
    type?: string;
  }>;

  return data.flatMap((item) => {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

    return [{
      id: `online-${item.place_id ?? `${latitude}-${longitude}`}`,
      name: item.display_name?.split(",")[0] ?? "Place",
      displayName: item.display_name ?? query,
      latitude,
      longitude,
      source: "ONLINE" as const,
      type: item.type ?? "place",
      openMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    }];
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) return Response.json({ ok: false, error: "Missing q" }, { status: 400 });

  const filter = parseMapFilter(url.searchParams);

  const localResults = searchLocalPlaces(query, filter);
  if (localResults.length > 0) {
    return Response.json({ ok: true, mode: "OFFLINE", results: localResults, filter, onlineAvailable: true });
  }

  const cached = await readCache(query);
  if (cached && cached.length > 0) {
    const filtered = filterMapResults(cached, filter);
    return Response.json({ ok: true, mode: "CACHE", results: filtered, filter });
  }

  try {
    const onlineResults = filterMapResults(await searchOnline(query), filter);
    await writeCache(query, onlineResults);
    return Response.json({ ok: true, mode: "ONLINE", results: onlineResults, filter });
  } catch (error) {
    return Response.json({
      ok: true,
      mode: "OFFLINE",
      results: [],
      filter,
      error: error instanceof Error ? error.message : "Map search unavailable",
    });
  }
}
