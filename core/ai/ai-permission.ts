import { AI_CONFIG } from "./ai-config";

export type AIPermission =
  "READ_DATA" | "ANALYZE_DATA" | "GENERATE_REPORT" | "EXECUTE_ACTION";

export function checkAIPermission(permission: AIPermission): boolean {
  if (!AI_CONFIG.allowExternalAI && permission === "EXECUTE_ACTION") {
    return false;
  }

  return true;
}
