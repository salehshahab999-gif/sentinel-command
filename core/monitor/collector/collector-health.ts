import type { CollectorResult } from "./collector-types";

export interface CollectorHealth {
  name: string;
  status: "HEALTHY" | "FAILED";
  durationMs: number;
  error?: string;
}

export function checkCollectorHealth(
  collector: () => CollectorResult
): CollectorHealth {
  const start = Date.now();

  try {
    const result = collector();

    return {
      name: result.name,
      status: "HEALTHY",
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name: "Unknown Collector",
      status: "FAILED",
      durationMs: Date.now() - start,
      error: String(error),
    };
  }
}