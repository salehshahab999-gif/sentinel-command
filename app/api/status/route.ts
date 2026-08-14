import { getCoreHealth, getCoreSystem } from "../../../core";
export async function GET() {
  const health = getCoreHealth();
  const system = getCoreSystem();

  return Response.json({
    status: system.state.status,
    service: system.runtime.system,
    database: "Connected",
    core: health.core,
    modules: health.modulesLoaded,
    mode: health.mode,
    health: health.status,
    time: health.checkedAt,
  });
}