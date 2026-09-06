export type IntelligenceStorageDomain =
  | "MAP"
  | "SATELLITE"
  | "NASA"
  | "AIS"
  | "IMAGERY"
  | "EVENTS"
  | "ALERTS";

export type IntelligenceStorageFormat =
  | "MBTILES"
  | "PMTILES"
  | "PBF"
  | "JSON"
  | "GEOJSON"
  | "TILE_CACHE"
  | "RASTER"
  | "BINARY";

export interface IntelligenceStorageBucket {
  domain: IntelligenceStorageDomain;
  format: IntelligenceStorageFormat;
  relativePath: string;
  offlineReady: boolean;
  onlineFallback: boolean;
  cacheEnabled: boolean;
  maxRecommendedGb: number;
}

export const INTELLIGENCE_STORAGE_ROOT = "data/intelligence";

export const INTELLIGENCE_STORAGE_BUCKETS: IntelligenceStorageBucket[] = [
  {
    domain: "MAP",
    format: "PMTILES",
    relativePath: "maps/world",
    offlineReady: true,
    onlineFallback: true,
    cacheEnabled: true,
    maxRecommendedGb: 180,
  },
  {
    domain: "SATELLITE",
    format: "JSON",
    relativePath: "satellites/catalog",
    offlineReady: true,
    onlineFallback: true,
    cacheEnabled: true,
    maxRecommendedGb: 20,
  },
  {
    domain: "NASA",
    format: "JSON",
    relativePath: "nasa/firms",
    offlineReady: true,
    onlineFallback: true,
    cacheEnabled: true,
    maxRecommendedGb: 80,
  },
  {
    domain: "AIS",
    format: "JSON",
    relativePath: "ais",
    offlineReady: true,
    onlineFallback: true,
    cacheEnabled: true,
    maxRecommendedGb: 100,
  },
  {
    domain: "IMAGERY",
    format: "RASTER",
    relativePath: "imagery",
    offlineReady: true,
    onlineFallback: true,
    cacheEnabled: true,
    maxRecommendedGb: 100,
  },
  {
    domain: "EVENTS",
    format: "JSON",
    relativePath: "events",
    offlineReady: true,
    onlineFallback: true,
    cacheEnabled: true,
    maxRecommendedGb: 10,
  },
  {
    domain: "ALERTS",
    format: "JSON",
    relativePath: "alerts",
    offlineReady: true,
    onlineFallback: true,
    cacheEnabled: true,
    maxRecommendedGb: 10,
  },
];
