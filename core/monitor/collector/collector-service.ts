import { COLLECTOR_REGISTRY } from "./collector-registry";

import type { CollectorResult } from "./collector-types";

import {
  runCollectorWithRuntime,
  type CollectorRuntimeResult,
} from "./collector-runtime";

export async function runCollectors(): Promise<
  CollectorResult[]
> {
  const runtimeResults =
    await Promise.all(
      COLLECTOR_REGISTRY.map(
        (collector) =>
          runCollectorWithRuntime(
            collector,
          ),
      ),
    );

  return runtimeResults.map(
    ({ result }) =>
      result,
  );
}

export async function runCollectorsWithRuntime(): Promise<
  CollectorRuntimeResult[]
> {
  return Promise.all(
    COLLECTOR_REGISTRY.map(
      (collector) =>
        runCollectorWithRuntime(
          collector,
        ),
    ),
  );
}