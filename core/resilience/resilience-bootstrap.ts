import {
  IncidentMemory,
} from "./incident-memory";

import {
  IncidentPersistence,
} from "./incident-persistence";

export interface ResilienceBootstrapResult {
  loadedIncidents: number;
  memoryReady: boolean;
  initializedAt: string;
}

export class ResilienceBootstrap {
  private readonly memory: IncidentMemory;
  private readonly persistence: IncidentPersistence;

  public constructor(
    memory = new IncidentMemory(),
    persistence = new IncidentPersistence(),
  ) {
    this.memory = memory;
    this.persistence = persistence;
  }

  public async initialize(): Promise<ResilienceBootstrapResult> {
    const loadedIncidents =
      await this.persistence.loadIntoMemory(
        this.memory,
      );

    return {
      loadedIncidents,
      memoryReady: true,
      initializedAt:
        new Date().toISOString(),
    };
  }

  public getMemory(): IncidentMemory {
    return this.memory;
  }

  public getPersistence(): IncidentPersistence {
    return this.persistence;
  }
}