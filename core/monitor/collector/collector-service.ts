import { COLLECTOR_REGISTRY } from "./collector-registry";
import type { CollectorResult } from "./collector-types";

export async function runCollectors(): Promise<CollectorResult[]> {
  const results = await Promise.all(
    COLLECTOR_REGISTRY.map(
      async (collector) => await collector()
    )
  );

  return results;
}