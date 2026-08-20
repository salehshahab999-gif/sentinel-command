import { getCoreHealth, getCoreSystem } from "../../../core";
import { getAlertEngineStatus } from "../../../core/alerts/alert-status";

export async function GET() {
  const health = getCoreHealth();
  const system = getCoreSystem();
  const alertEngine = getAlertEngineStatus();

  return Response.json({
    status: system.state.status,
    service: system.runtime.system,
    database: "Connected",
    core: health.core,
    modules: health.modulesLoaded,
    mode: health.mode,
    health: health.status,
    alertEngine: alertEngine.status,
    alertEngineLastActivity: alertEngine.lastActivity,
    time: health.checkedAt,
  });
}