import {
  getCoreHealth,
  loadModules,
} from "./index";

console.log("Sentinel Core Public API Test");

console.log(getCoreHealth());

console.log(loadModules());