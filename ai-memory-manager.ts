import { AI_MEMORY, AIMemoryItem, saveMemory } from "./ai-memory";

export function addMemory(memory: AIMemoryItem): void {
  saveMemory(memory);
}

export function getAllMemories(): AIMemoryItem[] {
  return AI_MEMORY;
}

export function getHighPriorityMemories(): AIMemoryItem[] {
  return AI_MEMORY.filter(
    (memory) => memory.priority === "HIGH" || memory.priority === "CRITICAL",
  );
}

export function countMemories(): number {
  return AI_MEMORY.length;
}
