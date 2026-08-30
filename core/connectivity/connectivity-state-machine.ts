import type {
  ConnectivityState,
  ConnectivitySnapshot,
} from "./connectivity-types";

export interface ConnectivityStateTransition {
  previousState: ConnectivityState;
  currentState: ConnectivityState;
  changed: boolean;
  transitionType:
    | "NONE"
    | "STARTED"
    | "ESCALATED"
    | "RECOVERED";
  changedAt: string;
}

export class ConnectivityStateMachine {
  private currentState:
    | ConnectivityState
    | null = null;

  public getCurrentState():
    ConnectivityState | null {
    return this.currentState;
  }

  public evaluate(
    snapshot: ConnectivitySnapshot,
  ): ConnectivityStateTransition {
    const nextState =
      snapshot.state;

    const previousState =
      this.currentState;

    this.currentState =
      nextState;

    if (previousState === null) {
      return {
        previousState:
          nextState,

        currentState:
          nextState,

        changed: false,

        transitionType:
          "NONE",

        changedAt:
          snapshot.measuredAt,
      };
    }

    if (
      previousState ===
      nextState
    ) {
      return {
        previousState,

        currentState:
          nextState,

        changed: false,

        transitionType:
          "NONE",

        changedAt:
          snapshot.measuredAt,
      };
    }

    return {
      previousState,

      currentState:
        nextState,

      changed: true,

      transitionType:
        this.classifyTransition(
          previousState,
          nextState,
        ),

      changedAt:
        snapshot.measuredAt,
    };
  }

  private classifyTransition(
    previousState: ConnectivityState,
    currentState: ConnectivityState,
  ):
    | "STARTED"
    | "ESCALATED"
    | "RECOVERED" {
    if (
      currentState ===
      "NORMAL"
    ) {
      return "RECOVERED";
    }

    if (
      previousState ===
      "NORMAL"
    ) {
      return "STARTED";
    }

    return "ESCALATED";
  }
}