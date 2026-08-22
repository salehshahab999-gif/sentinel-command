import { getCoreHealth, getCoreSystem } from "../../../core";
import { getAlertEngineStatus } from "../../../core/alerts/alert-status";
import { prisma } from "../../../core/database/prisma-client";

export async function GET() {
  const health = getCoreHealth();
  const system = getCoreSystem();
  const alertEngine = getAlertEngineStatus();

  const activeAlertsData = await prisma.alert.findMany({
    where: {
      status: "NEW",
      resolvedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  const activeAlerts = activeAlertsData.length;

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
    alertState: activeAlerts > 0 ? "ALARM" : "ACTIVE",
    activeAlerts,
    alerts: activeAlertsData,
    time: health.checkedAt,
  });
}