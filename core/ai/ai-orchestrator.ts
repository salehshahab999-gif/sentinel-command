import { AI_REGISTRY } from "./ai-registry";
import { checkAIPermission, AIPermission } from "./ai-permission";

export type AITaskPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface AITask {
  id: string;
  permission: AIPermission;
  priority: AITaskPriority;
  description: string;
  assignedAI?: string;
  createdAt: number;
}

export interface AIExecutionResult {
  taskId: string;
  aiId: string;
  status: "ACCEPTED" | "BLOCKED";
  message: string;
}

export function getAvailableAI() {
  return AI_REGISTRY.filter((ai) => ai.status !== "OFFLINE");
}

export function selectAI() {
  const available = getAvailableAI();

  return available.length > 0 ? available[0] : null;
}

export function createAITask(task: Omit<AITask, "id" | "createdAt">): AITask {
  return {
    ...task,
    id: `TASK-${Date.now()}`,
    createdAt: Date.now(),
  };
}

export function dispatchAITask(task: AITask): AIExecutionResult {
  const allowed = checkAIPermission(task.permission);

  if (!allowed) {
    return {
      taskId: task.id,
      aiId: task.assignedAI ?? "NONE",
      status: "BLOCKED",
      message: "Permission denied",
    };
  }

  const selectedAI = selectAI();

  return {
    taskId: task.id,
    aiId: selectedAI?.id ?? "NONE",
    status: "ACCEPTED",
    message: "Task accepted by AI orchestrator",
  };
}
