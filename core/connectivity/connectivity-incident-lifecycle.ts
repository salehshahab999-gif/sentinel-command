import {
  IncidentPersistence,
} from "../resilience/incident-persistence";

import {
  snapshotToIncident,
} from "./connectivity-incident";

import type {
  ConnectivitySnapshot,
} from "./connectivity-types";

import type {
  NetworkIncident,
} from "../resilience/incident-memory";

export class ConnectivityIncidentLifecycle {
  private readonly persistence =
    new IncidentPersistence();

  private activeIncidentId:
    | string
    | null = null;

  private activeIncident:
    | NetworkIncident
    | null = null;

  public async applySnapshot(
    snapshot: ConnectivitySnapshot,
  ): Promise<NetworkIncident | null> {
    if (
      snapshot.state ===
      "NORMAL"
    ) {
      return this.recover(snapshot);
    }

    if (
      this.activeIncident ===
      null
    ) {
      return this.start(snapshot);
    }

    return this.update(snapshot);
  }

  public getActiveIncident():
    NetworkIncident | null {
    return this.activeIncident;
  }

  private async start(
    snapshot: ConnectivitySnapshot,
  ): Promise<NetworkIncident> {
    const incident =
      snapshotToIncident(
        snapshot,
      );

    this.activeIncident =
      incident;

    this.activeIncidentId =
      incident.id;

    return this.persistence.save(
      incident,
    );
  }

  private async update(
    snapshot: ConnectivitySnapshot,
  ): Promise<NetworkIncident> {
    const current =
      this.activeIncident;

    if (
      current === null
    ) {
      return this.start(snapshot);
    }

    const next =
      snapshotToIncident(
        snapshot,
      );

    const updated:
      NetworkIncident = {
      ...current,

      phase:
        "DURING",

      severity:
        next.severity,

      globalReachabilityPercent:
        next.globalReachabilityPercent,

      domesticReachabilityPercent:
        next.domesticReachabilityPercent,

      affectedTargets:
        next.affectedTargets,

      criticalFailures:
        next.criticalFailures,

      endedAt:
        null,

      signals:
        next.signals,

      notes:
        next.notes,
    };

    this.activeIncident =
      updated;

    this.activeIncidentId =
      updated.id;

    return this.persistence.save(
      updated,
    );
  }

  private async recover(
    snapshot: ConnectivitySnapshot,
  ): Promise<NetworkIncident | null> {
    if (
      this.activeIncident ===
      null
    ) {
      return null;
    }

    const current =
      this.activeIncident;

    const recovery =
      snapshotToIncident(
        snapshot,
      );

    const recovered:
      NetworkIncident = {
      ...current,

      phase:
        "RECOVERY",

      severity:
        "LOW",

      globalReachabilityPercent:
        recovery.globalReachabilityPercent,

      domesticReachabilityPercent:
        recovery.domesticReachabilityPercent,

      affectedTargets:
        recovery.affectedTargets,

      criticalFailures:
        0,

      endedAt:
        snapshot.measuredAt,

      signals:
        recovery.signals,

      notes: [
        ...current.notes,
        "Connectivity recovered",
        `Recovered at: ${snapshot.measuredAt}`,
      ],
    };

    const saved =
      await this.persistence.save(
        recovered,
      );

    this.activeIncident =
      null;

    this.activeIncidentId =
      null;

    return saved;
  }
}