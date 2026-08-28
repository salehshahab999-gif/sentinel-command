import {
  decideResourceMode,
  type ResourceSnapshot,
} from "./resource-governor";

const scenarios: ResourceSnapshot[] = [
  {
    cpuPercent: 10,
    memoryPercent: 40,
    queueDepth: 0,
    networkHealthy: true,
    remoteAvailable: true,
  },
  {
    cpuPercent: 50,
    memoryPercent: 65,
    queueDepth: 30,
    networkHealthy: true,
    remoteAvailable: true,
  },
  {
    cpuPercent: 75,
    memoryPercent: 82,
    queueDepth: 120,
    networkHealthy: false,
    remoteAvailable: false,
  },
  {
    cpuPercent: 90,
    memoryPercent: 95,
    queueDepth: 200,
    networkHealthy: false,
    remoteAvailable: false,
  },
];

for (const scenario of scenarios) {
  console.log(
    "INPUT:",
    scenario,
  );

  console.log(
    "DECISION:",
    decideResourceMode(scenario),
  );

  console.log("--------------------------------");
}