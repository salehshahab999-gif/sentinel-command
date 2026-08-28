export type IncidentPhase =
  | "BEFORE"
  | "DURING"
  | "RECOVERY"
  | "RESOLVED";

export type IncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface IncidentSignal {
  name: string;
  value: number;
  source: string;
  observedAt: string;
  confidence: number;
}

export interface NetworkIncident {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  phase: IncidentPhase;
  severity: IncidentSeverity;

  globalReachabilityPercent: number | null;
  domesticReachabilityPercent: number | null;

  affectedTargets: number;
  criticalFailures: number;

  signals: IncidentSignal[];

  notes: string[];
}

export interface IncidentPatternMatch {
  incidentId: string;
  incidentName: string;
  similarityScore: number;
  matchingSignals: string[];
  confidence: number;
}

export interface IncidentMemorySummary {
  totalIncidents: number;
  activeIncidents: number;
  criticalIncidents: number;
  latestIncidentAt: string | null;
}

export class IncidentMemory {
  private readonly incidents = new Map<
    string,
    NetworkIncident
  >();

  public recordIncident(
    incident: NetworkIncident,
  ): void {
    this.incidents.set(
      incident.id,
      incident,
    );
  }

  public getIncident(
    incidentId: string,
  ): NetworkIncident | null {
    return (
      this.incidents.get(incidentId) ??
      null
    );
  }

  public getAllIncidents(): NetworkIncident[] {
    return Array.from(
      this.incidents.values(),
    ).sort(
      (a, b) =>
        new Date(b.startedAt).getTime() -
        new Date(a.startedAt).getTime(),
    );
  }

  public getActiveIncidents(): NetworkIncident[] {
    return this.getAllIncidents().filter(
      (incident) =>
        incident.endedAt === null &&
        incident.phase !== "RESOLVED",
    );
  }

  public summarize(): IncidentMemorySummary {
    const incidents =
      this.getAllIncidents();

    const activeIncidents =
      incidents.filter(
        (incident) =>
          incident.endedAt === null &&
          incident.phase !== "RESOLVED",
      ).length;

    const criticalIncidents =
      incidents.filter(
        (incident) =>
          incident.severity === "CRITICAL",
      ).length;

    return {
      totalIncidents: incidents.length,
      activeIncidents,
      criticalIncidents,
      latestIncidentAt:
        incidents.length > 0
          ? incidents[0].startedAt
          : null,
    };
  }

  public matchPattern(
    signals: IncidentSignal[],
    minimumSimilarity = 0.3,
  ): IncidentPatternMatch[] {
    const matches: IncidentPatternMatch[] = [];

    for (const incident of this.incidents.values()) {
      if (incident.signals.length === 0) {
        continue;
      }

      const matchingSignals: string[] = [];

      for (const historicalSignal of incident.signals) {
        const currentSignal =
          signals.find(
            (signal) =>
              signal.name ===
              historicalSignal.name,
          );

        if (!currentSignal) {
          continue;
        }

        const valueDifference =
          Math.abs(
            currentSignal.value -
              historicalSignal.value,
          );

        const referenceValue =
          Math.max(
            Math.abs(
              historicalSignal.value,
            ),
            1,
          );

        const similarity =
          1 -
          Math.min(
            valueDifference /
              referenceValue,
            1,
          );

        if (similarity >= 0.7) {
          matchingSignals.push(
            historicalSignal.name,
          );
        }
      }

      const similarityScore =
        incident.signals.length > 0
          ? matchingSignals.length /
            incident.signals.length
          : 0;

      if (
        similarityScore >=
        minimumSimilarity
      ) {
        const confidence =
          this.calculateConfidence(
            incident,
            signals,
            matchingSignals,
          );

        matches.push({
          incidentId: incident.id,
          incidentName: incident.name,
          similarityScore: Number(
            (
              similarityScore * 100
            ).toFixed(2),
          ),
          matchingSignals,
          confidence,
        });
      }
    }

    return matches.sort(
      (a, b) =>
        b.similarityScore -
        a.similarityScore,
    );
  }

  public clear(): void {
    this.incidents.clear();
  }

  private calculateConfidence(
    incident: NetworkIncident,
    currentSignals: IncidentSignal[],
    matchingSignals: string[],
  ): number {
    if (
      matchingSignals.length === 0
    ) {
      return 0;
    }

    const historicalConfidence =
      incident.signals
        .filter((signal) =>
          matchingSignals.includes(
            signal.name,
          ),
        )
        .reduce(
          (sum, signal) =>
            sum + signal.confidence,
          0,
        ) /
      matchingSignals.length;

    const currentConfidence =
      currentSignals
        .filter((signal) =>
          matchingSignals.includes(
            signal.name,
          ),
        )
        .reduce(
          (sum, signal) =>
            sum + signal.confidence,
          0,
        ) /
      matchingSignals.length;

    const confidence =
      (
        historicalConfidence +
        currentConfidence
      ) /
      2;

    return Number(
      Math.min(
        Math.max(confidence, 0),
        1,
      ).toFixed(2),
    );
  }
}