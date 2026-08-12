export type AIDecisionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AIDecisionLog {
  id: string;
  aiId: string;
  action: string;
  reasoning: string;
  status: AIDecisionStatus;
  createdAt: number;
}

export const AI_DECISION_LOGS: AIDecisionLog[] = [];

export function recordDecision(decision: AIDecisionLog): void {
  AI_DECISION_LOGS.push(decision);
}

export function getDecisionLogs(): AIDecisionLog[] {
  return AI_DECISION_LOGS;
}

export function clearDecisionLogs(): void {
  AI_DECISION_LOGS.length = 0;
}
