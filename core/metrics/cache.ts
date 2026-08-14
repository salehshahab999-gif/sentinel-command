type MetricsCache = {
  cpu: string;
  memory: string;
  ram: string;
  gpu: string;
  diskC: string;
  uptime: string;
  timestamp: string;
};

const CACHE_TTL = 15000;

let metricsCache: MetricsCache | null = null;

export function getMetricsCache(): MetricsCache | null {
  if (!metricsCache) {
    return null;
  }

  const age = Date.now() - new Date(metricsCache.timestamp).getTime();

  if (age > CACHE_TTL) {
    metricsCache = null;
    return null;
  }

  return metricsCache;
}

export function setMetricsCache(data: MetricsCache) {
  metricsCache = data;
}