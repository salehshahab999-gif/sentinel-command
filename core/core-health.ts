import { getCoreSystem } from "./core-system";

export function getCoreHealth() {
  const system = getCoreSystem();

  return {
    status: "OK",
    core: system.runtime.system,
    modulesLoaded: system.modules.length,
    mode: system.runtime.mode,
    checkedAt: new Date().toISOString(),
  };
}