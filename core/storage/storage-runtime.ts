import path from "node:path";
import {
  INTELLIGENCE_STORAGE_BUCKETS,
  type IntelligenceStorageDomain,
} from "./storage-contracts";

const STORAGE_ROOT = path.join(process.cwd(), "data", "intelligence");

export function resolveStoragePath(domain: IntelligenceStorageDomain): string {
  const bucket = INTELLIGENCE_STORAGE_BUCKETS.find((item) => item.domain === domain);
  if (!bucket) {
    throw new Error(`Unknown intelligence storage domain: ${domain}`);
  }

  return path.join(STORAGE_ROOT, bucket.relativePath);
}

export function getStoragePlan() {
  return INTELLIGENCE_STORAGE_BUCKETS.map((bucket) => ({
    domain: bucket.domain,
    format: bucket.format,
    path: path.join(STORAGE_ROOT, bucket.relativePath),
    offlineReady: bucket.offlineReady,
    onlineFallback: bucket.onlineFallback,
    cacheEnabled: bucket.cacheEnabled,
    maxRecommendedGb: bucket.maxRecommendedGb,
  }));
}
