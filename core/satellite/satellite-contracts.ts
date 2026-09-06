export type SatelliteDataMode = "SKELETON" | "LIVE" | "DEGRADED";

export type SatelliteStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

export type SatelliteSourceKind =
  | "CELESTRAK"
  | "COPERNICUS"
  | "NASA"
  | "NOAA"
  | "SATNOGS"
  | "AIS"
  | "OTHER";

export type SatelliteReferenceFrame = "ITRF" | "WGS84" | "TEME" | "GCRS";

export type SatelliteRecord = {
  id: string;
  name: string;
  noradId?: number;
  operator?: string;
  mission?: string;
  source: SatelliteSourceKind;
  status: SatelliteStatus;
  dataMode: SatelliteDataMode;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  inclinationDeg: number;
  raanDeg: number;
  speedKmS?: number;
  speedKmH?: number;
  headingDeg?: number;
  elevationDeg?: number;
  phaseDeg?: number;
  groundTrackLatitudeDeg?: number;
  groundTrackLongitudeDeg?: number;
  ecefXKm?: number;
  ecefYKm?: number;
  ecefZKm?: number;
  velocityXKmS?: number;
  velocityYKmS?: number;
  velocityZKmS?: number;
  timestamp?: string;
  referenceFrame?: SatelliteReferenceFrame;
};

export type SatelliteLayerId =
  | "baseMap"
  | "satellites"
  | "orbits"
  | "fires"
  | "weather"
  | "clouds"
  | "ocean"
  | "ais"
  | "geography"
  | "events"
  | "alerts";

export type SatelliteLayerDefinition = {
  id: SatelliteLayerId;
  label: string;
  description: string;
  liveReady: boolean;
  defaultEnabled: boolean;
};

export type SatelliteEvent = {
  id: string;
  source: SatelliteSourceKind;
  satelliteId?: string;
  type: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  title: string;
  message: string;
  timestamp: string;
};

export type SatelliteAlertSignal = {
  id: string;
  eventId: string;
  source: SatelliteSourceKind;
  satelliteId?: string;
  severity: "WARNING" | "ERROR" | "CRITICAL";
  status: "PENDING" | "ACTIVE" | "RESOLVED";
  title: string;
  message: string;
  createdAt: string;
};

export type SatelliteWireStatus = {
  component: string;
  status: "READY" | "CONNECTED" | "OFF" | "POWERED_OFF";
  note: string;
};
