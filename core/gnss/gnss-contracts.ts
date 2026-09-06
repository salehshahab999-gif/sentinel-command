export type GnssConstellation = "GPS" | "GLONASS" | "GALILEO" | "BEIDOU" | "NAVIC";

export type GnssSignalBand = "L1" | "L2" | "L5" | "E1" | "E5" | "B1" | "B2" | "B3" | "G1" | "G2" | "S" | "OTHER";

export type GnssObservationQuality = "AUTONOMOUS" | "SBAS" | "PPP" | "RTK_FLOAT" | "RTK_FIXED" | "PRECISE_ORBIT" | "UNKNOWN";

export type GnssObservation = {
  id: string;
  targetId: string;
  constellation: GnssConstellation;
  satelliteId?: string;
  signal?: GnssSignalBand;
  timestamp: string;
  referenceFrame: "WGS84" | "ITRF" | "PZ90" | "GTRF" | "CGCS2000";
  ecefXKm: number;
  ecefYKm: number;
  ecefZKm: number;
  velocityXKmS?: number;
  velocityYKmS?: number;
  velocityZKmS?: number;
  horizontalAccuracyM?: number;
  verticalAccuracyM?: number;
  rmsAccuracyM?: number;
  quality: GnssObservationQuality;
  source: string;
};

export type GnssConstellationStatus = {
  constellation: GnssConstellation;
  enabled: boolean;
  live: boolean;
  referenceFrame: GnssObservation["referenceFrame"];
  note: string;
};

export const GNSS_CONSTELLATION_STATUS: GnssConstellationStatus[] = [
  { constellation: "GPS", enabled: true, live: false, referenceFrame: "WGS84", note: "Broadcast/precise products supported by adapter wiring." },
  { constellation: "GLONASS", enabled: true, live: false, referenceFrame: "PZ90", note: "PZ-90 family requires explicit frame normalization before fusion." },
  { constellation: "GALILEO", enabled: true, live: false, referenceFrame: "GTRF", note: "GTRF requires explicit common-frame normalization before fusion." },
  { constellation: "BEIDOU", enabled: true, live: false, referenceFrame: "CGCS2000", note: "CGCS2000 requires explicit epoch/frame handling before fusion." },
  { constellation: "NAVIC", enabled: true, live: false, referenceFrame: "ITRF", note: "NavIC adapter is wired as a dormant input." },
];
