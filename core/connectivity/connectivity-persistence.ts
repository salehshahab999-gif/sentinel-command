import {
  IncidentPersistence,
} from "../resilience/incident-persistence";

import {
  snapshotToIncident,
} from "./connectivity-incident";

import type {
  ConnectivitySnapshot,
} from "./connectivity-types";

export class ConnectivityPersistence {
  private readonly persistence =
    new IncidentPersistence();

  public async saveSnapshot(
    snapshot: ConnectivitySnapshot,
  ) {
    const incident =
      snapshotToIncident(
        snapshot,
      );

    return this.persistence.save(
      incident,
    );
  }
}