import { SENTINEL_MODULES } from "./modules";

export type SentinelModuleStatus =
  | "skeleton"
  | "planned"
  | "offline"
  | "active";

export interface SentinelModule {
  name: string;
  status: SentinelModuleStatus;
}

export function getModuleRegistry() {
  return SENTINEL_MODULES as Record<string, SentinelModule>;
}

export function getModuleStatus(moduleName: string) {
  const registry = getModuleRegistry();

  return registry[moduleName] ?? null;
}