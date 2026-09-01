import {
  buildWindowsLocationObservation,
  runPnt,
} from "./pnt-runner";

import {
  selectPntSource,
} from "./pnt-source-switch";

import type {
  PntPosition,
  PntSourceId,
  PntObservation,
  PntSwitchDecision,
} from "./pnt-types";

export type PntServiceState = {
  observations: PntObservation[];
  decision: PntSwitchDecision;
  previousSourceId: PntSourceId | null;
  lastKnownPosition: PntPosition | null;
};

export class PntService {
  private previousSourceId: PntSourceId | null = null;
  private lastKnownPosition: PntPosition | null = null;

  public async runOnce(now = new Date()): Promise<PntServiceState> {
    const observations = await runPnt();

    const decision = selectPntSource(
      observations,
      this.previousSourceId,
      now,
      this.lastKnownPosition,
    );

    if (decision.position) {
      this.lastKnownPosition = decision.position;
    }

    this.previousSourceId = decision.activeSourceId;

    return {
      observations,
      decision,
      previousSourceId: this.previousSourceId,
      lastKnownPosition: this.lastKnownPosition,
    };
  }
}

export function buildPntServiceObservation(
  result: Awaited<ReturnType<typeof runPnt>>[number],
): PntObservation {
  return result;
}

export { buildWindowsLocationObservation };
