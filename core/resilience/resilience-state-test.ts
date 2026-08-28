import {
  ResilienceStateMachine,
  type ResilienceState,
} from "./resilience-state";

interface TestScenario {
  name: string;
  snapshot: {
    cpuPercent: number;
    memoryPercent: number;
    queueDepth: number;
    networkHealthy: boolean;
    remoteAvailable: boolean;
  };
  expectedMode: ResilienceState["mode"];
}

const scenarios: TestScenario[] = [
  {
    name: "Normal operation",
    snapshot: {
      cpuPercent: 10,
      memoryPercent: 40,
      queueDepth: 0,
      networkHealthy: true,
      remoteAvailable: true,
    },
    expectedMode: "NORMAL",
  },
  {
    name: "Network watch",
    snapshot: {
      cpuPercent: 50,
      memoryPercent: 65,
      queueDepth: 30,
      networkHealthy: true,
      remoteAvailable: true,
    },
    expectedMode: "WATCH",
  },
  {
    name: "Local survival",
    snapshot: {
      cpuPercent: 75,
      memoryPercent: 82,
      queueDepth: 120,
      networkHealthy: false,
      remoteAvailable: false,
    },
    expectedMode: "LOCAL_SURVIVAL",
  },
  {
    name: "Emergency resource pressure",
    snapshot: {
      cpuPercent: 90,
      memoryPercent: 95,
      queueDepth: 200,
      networkHealthy: false,
      remoteAvailable: false,
    },
    expectedMode: "EMERGENCY",
  },
];

function main() {
  const machine = new ResilienceStateMachine();

  for (const scenario of scenarios) {
    const result = machine.evaluate(scenario.snapshot);

    console.log(`SCENARIO: ${scenario.name}`);
    console.log("TRANSITION:", result);
    console.log("STATE:", machine.getState());

    if (result.currentMode !== scenario.expectedMode) {
      throw new Error(
        `Expected ${scenario.expectedMode}, got ${result.currentMode}`,
      );
    }

    console.log("STATUS: PASS ✅");
    console.log("--------------------------------");
  }

  machine.reset();

  const finalState = machine.getState();

  if (
    finalState.mode !== "NORMAL" ||
    finalState.previousMode !== null
  ) {
    throw new Error("State machine reset verification failed");
  }

  console.log("RESET TEST ✅");
  console.log(finalState);
  console.log("RESILIENCE STATE MACHINE VERIFIED ✅");
}

main();