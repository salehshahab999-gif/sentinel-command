import type { CollectorResult } from "./collector-types";

export interface CollectorRuntimeResult {
  result: CollectorResult;
  durationMs: number;
}

export async function runCollectorWithRuntime(
  collector: () =>
    | CollectorResult
    | Promise<CollectorResult>,
): Promise<CollectorRuntimeResult> {
  const start = Date.now();

  try {
    const result = await collector();

    return {
      result,
      durationMs:
        Date.now() - start,
    };
  } catch (error) {
    return {
      result: {
        name: "Unknown Collector",
        status: "FAILED",
        value:
          error instanceof Error
            ? error.message
            : String(error),
        timestamp:
          new Date().toISOString(),
      },
      durationMs:
        Date.now() - start,
    };
  }
}