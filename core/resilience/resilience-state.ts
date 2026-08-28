import {
  decideResourceMode,
  type ResourceMode,
  type ResourceSnapshot,
} from "./resource-governor";

export interface ResilienceState {
  mode: ResourceMode;
  previousMode: ResourceMode | null;
  changedAt: string;
  reason: string;
}

export interface ResilienceTransition {
  previousMode: ResourceMode | null;
  currentMode: ResourceMode;
  changed: boolean;
  changedAt: string;
  reason: string;
}

export class ResilienceStateMachine {
  private state: ResilienceState = {
    mode: "NORMAL",
    previousMode: null,
    changedAt: new Date().toISOString(),
    reason: "Initial state",
  };

  public evaluate(
    snapshot: ResourceSnapshot,
  ): ResilienceTransition {
    const decision = decideResourceMode(snapshot);

    return this.transitionTo(
      decision.mode,
      decision.reason,
    );
  }

  public transitionTo(
    mode: ResourceMode,
    reason: string,
  ): ResilienceTransition {
    const now = new Date().toISOString();

    if (mode === this.state.mode) {
      this.state = {
        ...this.state,
        changedAt: now,
        reason,
      };

      return {
        previousMode: this.state.previousMode,
        currentMode: this.state.mode,
        changed: false,
        changedAt: now,
        reason,
      };
    }

    const previousMode = this.state.mode;

    this.state = {
      mode,
      previousMode,
      changedAt: now,
      reason,
    };

    return {
      previousMode,
      currentMode: mode,
      changed: true,
      changedAt: now,
      reason,
    };
  }

  public getState(): ResilienceState {
    return {
      ...this.state,
    };
  }

  public reset(): void {
    const now = new Date().toISOString();

    this.state = {
      mode: "NORMAL",
      previousMode: null,
      changedAt: now,
      reason: "State machine reset",
    };
  }
}