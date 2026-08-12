export type AIKnowledgeType = "FACT" | "PATTERN" | "LESSON" | "REFERENCE";

export interface AIKnowledgeItem {
  id: string;
  type: AIKnowledgeType;
  title: string;
  content: string;
  sourceAI: string;
  createdAt: number;
}

export const AI_KNOWLEDGE: AIKnowledgeItem[] = [];

export function addKnowledge(knowledge: AIKnowledgeItem): void {
  AI_KNOWLEDGE.push(knowledge);
}

export function getKnowledge(): AIKnowledgeItem[] {
  return AI_KNOWLEDGE;
}

export function clearKnowledge(): void {
  AI_KNOWLEDGE.length = 0;
}
