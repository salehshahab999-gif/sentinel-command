import {
  ResilienceController,
  type ResilienceEvaluation,
} from "./resilience-controller";

import type {
  ResourceSnapshot,
} from "./resource-governor";

import type {
  ReachabilityAssessment,
} from "./reachability-matrix";

export interface ResilienceRuntimeInput {
  resources: ResourceSnapshot;
  assessments: ReachabilityAssessment[];
}

export interface ResilienceRuntimeState {
  started: boolean;
  cycleCount: number;
  lastEvaluation: ResilienceEvaluation | null;
  updatedAt: string | null;
}

export class ResilienceRuntime {
  private readonly controller =
    new ResilienceController();

  private state: ResilienceRuntimeState = {
    started: false,
    cycleCount: 0,
    lastEvaluation: null,
    updatedAt: null,
  };

  public start(): void {
    this.state = {
      ...this.state,
      started: true,
      updatedAt: new Date().toISOString(),
    };
  }

  public stop(): void {
    this.state = {
      ...this.state,
      started: false,
      updatedAt: new Date().toISOString(),
    };
  }

  public evaluate(
    input: ResilienceRuntimeInput,
  ): ResilienceEvaluation {
    if (!this.state.started) {
      throw new Error(
        "Resilience runtime is not started",
      );
    }

    const evaluation =
      this.controller.evaluate(
        input.resources,
        input.assessments,
      );

    this.state = {
      started: true,
      cycleCount:
        this.state.cycleCount + 1,
      lastEvaluation: evaluation,
      updatedAt: new Date().toISOString(),
    };

    return evaluation;
  }

  public getState(): ResilienceRuntimeState {
    return {
      ...this.state,
    };
  }

  public reset(): void {
    this.controller.reset();

    this.state = {
      started: false,
      cycleCount: 0,
      lastEvaluation: null,
      updatedAt: null,
    };
  }
}