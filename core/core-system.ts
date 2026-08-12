import { getCoreRuntime } from "./core-runtime";
import { getCoreState } from "./state";
import { loadModules } from "./module-loader";

export function getCoreSystem() {
  return {
    runtime: getCoreRuntime(),
    state: getCoreState(),
    modules: loadModules(),
  };
}