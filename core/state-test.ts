import {
  getCoreState,
  updateCoreState,
  updateModuleStatus,
} from "./state";

console.log("Initial State");
console.log(getCoreState());

updateCoreState({
  status: "ONLINE",
  version: "1.0.0",
});

updateModuleStatus("monitor", true);

console.log("Updated State");
console.log(getCoreState());