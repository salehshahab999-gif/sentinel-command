import { collectSystemStatus } from "./system-collector";
import type { CollectorResult } from "./collector-types";

export function runCollectors(): CollectorResult[] {
  return [
    collectSystemStatus(),
  ];
}