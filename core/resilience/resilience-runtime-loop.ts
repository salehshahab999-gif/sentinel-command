import {
  ResilienceRuntimeBootstrap,
} from "./resilience-runtime-bootstrap";

import {
  LiveResilienceCycle,
} from "./live-resilience-cycle";

import type {
  ReachabilityTarget,
} from "./reachability-matrix";

import type {
  ResourceSnapshot,
} from "./resource-governor";

export interface ResilienceRuntimeLoopOptions {
  intervalMs?: number;
  cycles?: number;
}

export interface ResilienceRuntimeLoopResult {
  cyclesExecuted: number;
  results: Awaited<
    ReturnType<LiveResilienceCycle["run"]>
  >[];
  startedAt: string;
  finishedAt: string;
}

export class ResilienceRuntimeLoop {
  private readonly runtime: ResilienceRuntimeBootstrap;
  private readonly cycle: LiveResilienceCycle;

  private running = false;

  public constructor(
    runtime = new ResilienceRuntimeBootstrap(),
    cycle = new LiveResilienceCycle(),
  ) {
    this.runtime = runtime;
    this.cycle = cycle;
  }

  public async run(
    targets: ReachabilityTarget[],
    resources: ResourceSnapshot,
    options: ResilienceRuntimeLoopOptions = {},
  ): Promise<ResilienceRuntimeLoopResult> {
    if (this.running) {
      throw new Error(
        "Resilience runtime loop is already running",
      );
    }

    const intervalMs =
      options.intervalMs ?? 30_000;

    const cycles =
      options.cycles ?? 1;

    if (intervalMs < 0) {
      throw new Error(
        "intervalMs cannot be negative",
      );
    }

    if (cycles < 1) {
      throw new Error(
        "cycles must be at least 1",
      );
    }

    this.running = true;

    const startedAt =
      new Date().toISOString();

    const results: Awaited<
      ReturnType<LiveResilienceCycle["run"]>
    >[] = [];

    try {
      if (!this.runtime.isStarted()) {
        await this.runtime.start(
          targets,
          resources,
        );
      }

      for (
        let index = 0;
        index < cycles;
        index += 1
      ) {
        const result =
          await this.cycle.run(
            targets,
            resources,
            this.runtime.getMemory(),
            this.runtime.getBaselineTracker(),
            this.runtime.getMatrix(),
          );

        results.push(result);

        console.log(
          `RESILIENCE LOOP CYCLE ${
            index + 1
          }/${cycles} ✅`,
        );

        console.log({
          mode:
            result.decision.mode,

          riskScore:
            result.decision.riskScore,

          warning:
            result.warningLevel,

          historicalMatches:
            result.historicalMatches,

          historicalPatternMatched:
            result.historicalPatternMatched,

          criticalFailures:
            result.criticalFailures,
        });

        if (
          index < cycles - 1 &&
          intervalMs > 0
        ) {
          await this.delay(
            intervalMs,
          );
        }
      }

      return {
        cyclesExecuted:
          results.length,

        results,

        startedAt,

        finishedAt:
          new Date().toISOString(),
      };
    } finally {
      this.running = false;
    }
  }

  public stop(): void {
    this.runtime.stop();
    this.running = false;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getRuntime(): ResilienceRuntimeBootstrap {
    return this.runtime;
  }

  private delay(
    milliseconds: number,
  ): Promise<void> {
    return new Promise(
      (resolve) => {
        setTimeout(
          resolve,
          milliseconds,
        );
      },
    );
  }
}