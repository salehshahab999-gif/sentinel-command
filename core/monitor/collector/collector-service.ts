import { COLLECTOR_REGISTRY } from "./collector-registry";
import type { CollectorResult } from "./collector-types";

export function runCollectors(): CollectorResult[] {
  return COLLECTOR_REGISTRY.map(
    (collector) => collector()
  );
}