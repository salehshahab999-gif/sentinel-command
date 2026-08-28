import {
  Prisma,
} from "../../app/generated/prisma-local/client";

import {
  prisma,
} from "../../core/database/prisma-client";

import type {
  IncidentMemory,
  NetworkIncident,
} from "./incident-memory";

export class IncidentPersistence {
  public async save(
    incident: NetworkIncident,
  ): Promise<NetworkIncident> {
    const signals =
      this.toJsonValue(
        incident.signals,
      );

    const notes =
      this.toJsonValue(
        incident.notes,
      );

    const saved =
      await prisma.networkIncident.upsert({
        where: {
          id: incident.id,
        },

        create: {
          id: incident.id,
          name: incident.name,

          startedAt: new Date(
            incident.startedAt,
          ),

          endedAt:
            incident.endedAt !== null
              ? new Date(incident.endedAt)
              : null,

          phase: incident.phase,
          severity: incident.severity,

          globalReachabilityPercent:
            incident.globalReachabilityPercent,

          domesticReachabilityPercent:
            incident.domesticReachabilityPercent,

          affectedTargets:
            incident.affectedTargets,

          criticalFailures:
            incident.criticalFailures,

          signals,
          notes,
        },

        update: {
          name: incident.name,

          startedAt: new Date(
            incident.startedAt,
          ),

          endedAt:
            incident.endedAt !== null
              ? new Date(incident.endedAt)
              : null,

          phase: incident.phase,
          severity: incident.severity,

          globalReachabilityPercent:
            incident.globalReachabilityPercent,

          domesticReachabilityPercent:
            incident.domesticReachabilityPercent,

          affectedTargets:
            incident.affectedTargets,

          criticalFailures:
            incident.criticalFailures,

          signals,
          notes,
        },
      });

    return this.fromDatabase(
      saved,
    );
  }

  public async loadAll(): Promise<
    NetworkIncident[]
  > {
    const incidents =
      await prisma.networkIncident.findMany({
        orderBy: {
          startedAt: "desc",
        },
      });

    return incidents.map(
      (incident) =>
        this.fromDatabase(
          incident,
        ),
    );
  }

  public async loadIntoMemory(
    memory: IncidentMemory,
  ): Promise<number> {
    const incidents =
      await this.loadAll();

    memory.clear();

    for (const incident of incidents) {
      memory.recordIncident(
        incident,
      );
    }

    return incidents.length;
  }

  public async delete(
    incidentId: string,
  ): Promise<void> {
    await prisma.networkIncident.delete({
      where: {
        id: incidentId,
      },
    });
  }

  private fromDatabase(
    incident: {
      id: string;
      name: string;
      startedAt: Date;
      endedAt: Date | null;
      phase: string;
      severity: string;
      globalReachabilityPercent:
        number | null;
      domesticReachabilityPercent:
        number | null;
      affectedTargets: number;
      criticalFailures: number;
      signals: unknown;
      notes: unknown;
    },
  ): NetworkIncident {
    return {
      id: incident.id,
      name: incident.name,

      startedAt:
        incident.startedAt.toISOString(),

      endedAt:
        incident.endedAt !== null
          ? incident.endedAt.toISOString()
          : null,

      phase:
        this.toPhase(
          incident.phase,
        ),

      severity:
        this.toSeverity(
          incident.severity,
        ),

      globalReachabilityPercent:
        incident.globalReachabilityPercent,

      domesticReachabilityPercent:
        incident.domesticReachabilityPercent,

      affectedTargets:
        incident.affectedTargets,

      criticalFailures:
        incident.criticalFailures,

      signals:
        this.toIncidentSignals(
          incident.signals,
        ),

      notes:
        this.toNotes(
          incident.notes,
        ),
    };
  }

  private toJsonValue(
    value: unknown,
  ): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify(value),
    ) as Prisma.InputJsonValue;
  }

  private toPhase(
    value: string,
  ): NetworkIncident["phase"] {
    const allowed = [
      "BEFORE",
      "DURING",
      "RECOVERY",
      "RESOLVED",
    ] as const;

    if (
      allowed.includes(
        value as (typeof allowed)[number],
      )
    ) {
      return value as NetworkIncident["phase"];
    }

    return "RESOLVED";
  }

  private toSeverity(
    value: string,
  ): NetworkIncident["severity"] {
    const allowed = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ] as const;

    if (
      allowed.includes(
        value as (typeof allowed)[number],
      )
    ) {
      return value as NetworkIncident["severity"];
    }

    return "LOW";
  }

  private toIncidentSignals(
    value: unknown,
  ): NetworkIncident["signals"] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (
        item,
      ): item is NetworkIncident["signals"][number] => {
        if (
          typeof item !== "object" ||
          item === null
        ) {
          return false;
        }

        const signal =
          item as Record<
            string,
            unknown
          >;

        return (
          typeof signal.name ===
            "string" &&
          typeof signal.value ===
            "number" &&
          typeof signal.source ===
            "string" &&
          typeof signal.observedAt ===
            "string" &&
          typeof signal.confidence ===
            "number"
        );
      },
    );
  }

  private toNotes(
    value: unknown,
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is string =>
        typeof item === "string",
    );
  }
}