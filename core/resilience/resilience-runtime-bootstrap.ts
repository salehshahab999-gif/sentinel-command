import {
  IncidentMemory,
} from "./incident-memory";

import {
  IncidentPersistence,
} from "./incident-persistence";

import {
  ResilienceBootstrap,
  type ResilienceBootstrapResult,
} from "./resilience-bootstrap";

import {
  LiveResilienceCycle,
  type LiveResilienceCycleResult,
} from "./live-resilience-cycle";

import {
  ReachabilityMatrix,
  type ReachabilityTarget,
} from "./reachability-matrix";

import {
  NetworkBaselineTracker,
} from "./network-baseline";

import type {
  ResourceSnapshot,
} from "./resource-governor";

export interface ResilienceRuntimeBootstrapResult {
  bootstrap: ResilienceBootstrapResult;
  cycle: LiveResilienceCycleResult;
  runtimeStarted: boolean;
}

export class ResilienceRuntimeBootstrap {
  private readonly memory: IncidentMemory;
  private readonly persistence: IncidentPersistence;
  private readonly bootstrap: ResilienceBootstrap;
  private readonly cycle: LiveResilienceCycle;

  private readonly matrix =
    new ReachabilityMatrix();

  private readonly baselineTracker =
    new NetworkBaselineTracker();

  private started = false;

  public constructor(
    memory = new IncidentMemory(),
    persistence = new IncidentPersistence(),
    cycle = new LiveResilienceCycle(),
  ) {
    this.memory = memory;
    this.persistence = persistence;

    this.bootstrap =
      new ResilienceBootstrap(
        this.memory,
        this.persistence,
      );

    this.cycle = cycle;
  }

  public async start(
    targets: ReachabilityTarget[],
    resources: ResourceSnapshot,
  ): Promise<ResilienceRuntimeBootstrapResult> {
    if (this.started) {
      throw new Error(
        "Resilience runtime is already started",
      );
    }

    const bootstrapResult =
      await this.bootstrap.initialize();

    const cycleResult =
      await this.cycle.run(
        targets,
        resources,
        this.memory,
        this.baselineTracker,
        this.matrix,
      );

    this.started = true;

    return {
      bootstrap: bootstrapResult,
      cycle: cycleResult,
      runtimeStarted: true,
    };
  }

  public isStarted(): boolean {
    return this.started;
  }

  public getMemory(): IncidentMemory {
    return this.memory;
  }

  public getPersistence(): IncidentPersistence {
    return this.persistence;
  }

  public getMatrix(): ReachabilityMatrix {
    return this.matrix;
  }

  public getBaselineTracker(): NetworkBaselineTracker {
    return this.baselineTracker;
  }

  public stop(): void {
    this.started = false;
  }

  public reset(): void {
    this.started = false;
    this.memory.clear();
  }
}