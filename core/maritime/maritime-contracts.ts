export type MaritimeDataMode = "SKELETON" | "LIVE" | "DEGRADED";

export type MaritimeProviderId =
  | "OPENWATERS"
  | "AISSTREAM"
  | "AIS_CATCHER"
  | "VESSELFINDER"
  | "TANKERTRACKERS"
  | "GLOBAL_FISHING_WATCH"
  | "OPENSKY"
  | "FLIGHTRADAR24";

export type VesselState = "MOVING" | "SLOW" | "ANCHORED" | "UNKNOWN";
export type VesselType = "TANKER" | "CONTAINER" | "CARGO" | "FISHING" | "PASSENGER" | "OTHER" | "UNKNOWN";

export interface VesselRecord {
  id: string;
  mmsi?: number;
  imo?: number;
  name: string;
  type: VesselType;
  source: MaritimeProviderId;
  dataMode: MaritimeDataMode;
  latitude: number;
  longitude: number;
  speedKnots?: number;
  courseDeg?: number;
  headingDeg?: number;
  destination?: string;
  flag?: string;
  state: VesselState;
  lastUpdate: string;
}

export interface MaritimeProviderDefinition {
  id: MaritimeProviderId;
  label: string;
  kind: "AIS" | "TANKER" | "FISHING" | "AIR";
  access: "FREE" | "FREE_TOKEN" | "PAID_API" | "PUBLIC_OSINT";
  liveCapable: boolean;
  enabledByDefault: boolean;
  endpoint?: string;
  note: string;
}

export interface MaritimeWireStatus {
  component: string;
  status: "READY" | "CONNECTED" | "OFF" | "POWERED_OFF";
  note: string;
}

export interface MaritimeSnapshot {
  mode: MaritimeDataMode;
  liveEnabled: boolean;
  timestamp: string;
  vesselCount: number;
  providers: MaritimeWireStatus[];
  vessels: VesselRecord[];
}
