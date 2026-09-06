export type MaritimeDataMode = "SKELETON" | "LIVE" | "DEGRADED";

export type MaritimeSourceKind =
  | "AISSTREAM"
  | "VESSELFINDER"
  | "VESSELTRAFFIC_MCP"
  | "TANKERTRACKERS"
  | "SHIPFINDER"
  | "MYSHIPTRACKING"
  | "MARINETRAFFIC"
  | "FLIGHTRADAR24"
  | "OPENSKY"
  | "OTHER";

export type VesselMotionState =
  | "MOVING"
  | "SLOW"
  | "ANCHORED"
  | "MOORED"
  | "UNKNOWN";

export type MaritimeProviderStatus = "READY" | "POWERED_OFF" | "CONNECTED" | "DEGRADED";

export type VesselRecord = {
  id: string;
  mmsi?: number;
  imo?: number;
  name: string;
  type: string;
  flag?: string;
  source: MaritimeSourceKind;
  dataMode: MaritimeDataMode;
  latitude: number;
  longitude: number;
  speedKnots: number;
  courseDeg: number;
  headingDeg?: number;
  destination?: string;
  navStatus?: string;
  state: VesselMotionState;
  lastUpdate: string;
};

export type MaritimeProvider = {
  id: MaritimeSourceKind;
  label: string;
  role: string;
  scope: string;
  liveAvailable: boolean;
  requiresKey: boolean;
  notes: string;
};

export type MaritimeSystemStatus = {
  liveEnabled: boolean;
  providerCount: number;
  activeProviderCount: number;
  lastRefresh: string;
};
