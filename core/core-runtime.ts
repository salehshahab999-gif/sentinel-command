import { getModuleRegistry } from "./module-registry";

export function getCoreRuntime() {
  const modules = getModuleRegistry();

  return {
    system: "Sentinel Command",
    version: "1.0",
    mode: "skeleton",
    modules,
    timestamp: new Date().toISOString(),
  };
}