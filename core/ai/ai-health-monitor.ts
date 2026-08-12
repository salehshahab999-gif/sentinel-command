import { AI_REGISTRY } from "./ai-registry";

export interface AIHealthStatus {
  id: string;
  name: string;
  health: number;
  state: "HEALTHY" | "WARNING" | "CRITICAL";
}

export function getAIHealth(): AIHealthStatus[] {
  return AI_REGISTRY.map((ai) => ({
    id: ai.id,
    name: ai.name,
    health: 100,
    state: "HEALTHY",
  }));
}
