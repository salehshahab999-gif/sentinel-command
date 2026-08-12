import { getModuleRegistry } from "./module-registry";

export function loadModules() {
  const modules = getModuleRegistry();

  return Object.entries(modules).map(([id, module]) => ({
    id,
    ...module,
  }));
}