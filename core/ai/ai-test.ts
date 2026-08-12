import { startAICore } from "./ai-manager";
import { writeAILog } from "./ai-log";
import { getAIHealth } from "./ai-health-monitor";
import { getAIMetrics } from "./ai-metrics";

async function runAITest() {
  try {
    const result = await startAICore();
    const health = getAIHealth();
    const metrics = getAIMetrics();

    await writeAILog("AI_CORE_HEALTH_CHECK", {
      healthyAgents: health.filter((ai) => ai.state === "HEALTHY").length,
      totalAgents: health.length,
    });

    await writeAILog("AI_CORE_METRICS_CHECK", {
      total: metrics.total,
      healthy: metrics.healthy,
      warning: metrics.warning,
      critical: metrics.critical,
    });

    await writeAILog("AI_CORE_TEST_SUCCESS", {
      status: result.status,
      mode: result.mode,
      agents: result.agents.length,
    });

    console.log("AI CORE TEST SUCCESS");
    console.log(result);

    console.log("AI HEALTH STATUS");
    console.log(health);

    console.log("AI METRICS");
    console.log(metrics);
  } catch (error) {
    await writeAILog(
      "AI_CORE_TEST_FAILED",
      {
        error: String(error),
      },
      "ERROR",
    );

    console.error("AI CORE TEST FAILED");
    console.error(error);
  }
}

runAITest();
