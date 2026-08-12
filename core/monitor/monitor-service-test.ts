import { getMonitorSnapshot } from "./monitor-service";

console.log("Sentinel Monitor Service Test");

const snapshot = getMonitorSnapshot();

console.log(snapshot);