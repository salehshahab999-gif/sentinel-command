import { AI_REGISTRY } from "./ai-registry";

export function getAIStatus() {
  return AI_REGISTRY.map((ai) => ({
    id: ai.id,
    name: ai.name,
    status: ai.status,
  }));
}
