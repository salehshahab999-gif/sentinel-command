import { getAIStatus } from "./ai-status-monitor";
import { writeAILog } from "./ai-log";

export async function startAICore() {
  const agents = getAIStatus();

  await writeAILog("AI_CORE_STARTED", {
    totalAI: agents.length,
    mode: "MONITOR_ONLY",
  });

  return {
    status: "ACTIVE",
    mode: "MONITOR_ONLY",
    agents,
  };
}
