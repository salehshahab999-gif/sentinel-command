import path from "node:path";
import {
  INTELLIGENCE_STORAGE_BUCKETS,
  INTELLIGENCE_STORAGE_ROOT,
  type IntelligenceStorageDomain,
} from "./storage-contracts";

export function resolveStoragePath(domain: IntelligenceStorageDomain): string {
  const bucket = INTELLIGENCE_STORAGE_BUCKETS.find((item) => item.domain === domain);
  if (!bucket) {
    throw new Error(`Unknown intelligence storage domain: ${domain}`);
  }

  return path.join(process.cwd(), INTELLIGENCE_STORAGE_ROOT, bucket.relativePath);
}

export function getStoragePlan() {
  return INTELLIGENCE_STORAGE_BUCKETS.map((bucket) => ({
    domain: bucket.domain,
    format: bucket.format,
    path: resolveStoragePath(bucket.domain),
    offlineReady: bucket.offlineReady,
    onlineFallback: bucket.onlineFallback,
    cacheEnabled: bucket.cacheEnabled,
    maxRecommendedGb: bucket.maxRecommendedGb,
  }));
}
