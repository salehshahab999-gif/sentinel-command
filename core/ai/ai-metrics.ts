import { getAIHealth } from "./ai-health-monitor";

export interface AIMetrics {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  lastCheck: string;
}

export function getAIMetrics(): AIMetrics {
  const health = getAIHealth();

  return {
    total: health.length,
    healthy: health.filter((ai) => ai.state === "HEALTHY").length,
    warning: health.filter((ai) => ai.state === "WARNING").length,
    critical: health.filter((ai) => ai.state === "CRITICAL").length,
    lastCheck: new Date().toISOString(),
  };
}
