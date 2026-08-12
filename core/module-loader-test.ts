import { loadModules } from "./module-loader";

console.log("Sentinel Module Loader Test");

const modules = loadModules();

console.log(modules);