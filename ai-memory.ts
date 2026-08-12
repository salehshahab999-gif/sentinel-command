export type AIMemoryType = "TASK" | "DECISION" | "ANALYSIS" | "KNOWLEDGE";

export type AIMemoryPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface AIMemoryItem {
  id: string;
  type: AIMemoryType;
  priority: AIMemoryPriority;
  content: string;
  sourceAI: string;
  createdAt: number;
  updatedAt: number;
}

export const AI_MEMORY: AIMemoryItem[] = [];

export function saveMemory(memory: AIMemoryItem): void {
  AI_MEMORY.push(memory);
}

export function getMemory(): AIMemoryItem[] {
  return AI_MEMORY;
}

export function clearMemory(): void {
  AI_MEMORY.length = 0;
}
