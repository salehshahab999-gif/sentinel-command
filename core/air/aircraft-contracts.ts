export type AircraftDataMode = "SKELETON" | "LIVE" | "DEGRADED";
export type AircraftSourceKind = "ADSB_EXCHANGE" | "READSB" | "AIRPLANES_LIVE" | "OTHER";
export type AircraftState = "AIRBORNE" | "ON_GROUND" | "UNKNOWN";

export type AircraftRecord = {
  id: string;
  icaoHex?: string;
  registration?: string;
  callsign?: string;
  typeCode?: string;
  typeDescription?: string;
  operator?: string;
  latitude: number;
  longitude: number;
  altitudeFt?: number;
  altitudeM?: number;
  groundSpeedKnots?: number;
  groundSpeedKmh?: number;
  groundSpeedKmS?: number;
  trackDeg?: number;
  headingDeg?: number;
  verticalRateFpm?: number;
  squawk?: string;
  source: AircraftSourceKind;
  dataMode: AircraftDataMode;
  state: AircraftState;
  seenAt: string;
  positionAccuracyM?: number;
};

export type AircraftFilter = {
  icaoHex?: string;
  registration?: string;
  callsign?: string;
  typeCode?: string;
  typeDescription?: string;
  minAltitudeFt?: number;
  maxAltitudeFt?: number;
  minSpeedKnots?: number;
  maxSpeedKnots?: number;
  squawk?: string;
  state?: AircraftState;
  source?: AircraftSourceKind;
  military?: boolean;
};

export type AircraftHistoryPoint = {
  aircraftId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitudeFt?: number;
  groundSpeedKnots?: number;
  trackDeg?: number;
};

export type AircraftHistoryQuery = {
  aircraftId?: string;
  icaoHex?: string;
  registration?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
};

export type AircraftProviderDefinition = {
  id: AircraftSourceKind;
  label: string;
  liveCapable: boolean;
  enabledByDefault: boolean;
  access: "PUBLIC" | "LOCAL_RECEIVER" | "API";
  endpoint?: string;
  note: string;
};

export const AIRCRAFT_PROVIDERS: AircraftProviderDefinition[] = [
  {
    id: "ADSB_EXCHANGE",
    label: "ADS-B Exchange",
    liveCapable: true,
    enabledByDefault: false,
    access: "PUBLIC",
    endpoint: "https://globe.adsbexchange.com/",
    note: "UI/query architecture reference; Sentinel does not scrape the website.",
  },
  {
    id: "READSB",
    label: "readsb / tar1090",
    liveCapable: true,
    enabledByDefault: false,
    access: "LOCAL_RECEIVER",
    endpoint: "/data/aircraft.json",
    note: "Preferred future local receiver adapter. Live collection stays off by default.",
  },
  {
    id: "AIRPLANES_LIVE",
    label: "Airplanes.live",
    liveCapable: true,
    enabledByDefault: false,
    access: "PUBLIC",
    note: "Independent provider boundary reserved as an alternate source.",
  },
  {
    id: "OTHER",
    label: "Other aircraft source",
    liveCapable: false,
    enabledByDefault: false,
    access: "API",
    note: "Generic adapter boundary.",
  },
];
