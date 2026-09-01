export type PntSourceId =
  | "WINDOWS_LOCATION"
  | "WINDOWS_SATELLITE"
  | "WINDOWS_WIFI"
  | "NETWORK_IP"
  | "GNSS_RECEIVER_1"
  | "GNSS_RECEIVER_2";

export type PntSourceKind = "WINDOWS" | "GNSS" | "NETWORK";

export type PntSourceStatus =
  | "ACTIVE"
  | "AVAILABLE"
  | "DEGRADED"
  | "FAILED"
  | "STALE"
  | "UNKNOWN";

export type PntPosition = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  altitudeMeters: number | null;
  speedMetersPerSecond: number | null;
  headingDegrees: number | null;
  observedAt: string;
};

export type PntObservation = {
  sourceId: PntSourceId;
  sourceKind: PntSourceKind;
  status: PntSourceStatus;
  position: PntPosition | null;
  provider: string | null;
  satelliteCount: number | null;
  confidence: number;
  healthScore: number;
  lastSeenAt: string | null;
  error: string | null;
};

export type PntSwitchDecision = {
  activeSourceId: PntSourceId | null;
  mode: "LIVE" | "FAILOVER" | "LAST_KNOWN" | "NO_POSITION";
  confidence: number;
  position: PntPosition | null;
  reason: string;
  decidedAt: string;
};

export const PNT_SOURCE_PRIORITY: Record<PntSourceId, number> = {
  WINDOWS_LOCATION: 60,
  WINDOWS_SATELLITE: 100,
  WINDOWS_WIFI: 35,
  NETWORK_IP: 10,
  GNSS_RECEIVER_1: 100,
  GNSS_RECEIVER_2: 99,
};
