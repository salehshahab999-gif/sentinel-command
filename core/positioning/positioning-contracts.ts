export type GnssConstellation =
  | "GPS"
  | "GLONASS"
  | "GALILEO"
  | "BEIDOU"
  | "NAVIC";

export type GnssProviderCountry = "US" | "RUSSIA" | "EU" | "CHINA" | "INDIA";

export type GnssReferenceFrame =
  | "WGS84"
  | "PZ90"
  | "GTRF"
  | "CGCS2000"
  | "ITRF";

export type CelestialReferenceFrame =
  | "ICRS"
  | "GCRS"
  | "CIRS"
  | "ITRS"
  | "TEME"
  | "ALT_AZ"
  | "FK5";

export interface GnssConstellationDefinition {
  constellation: GnssConstellation;
  countryOrRegion: GnssProviderCountry;
  referenceFrame: GnssReferenceFrame;
  timeScale: string;
  global: boolean;
  enabledByDefault: boolean;
  liveCapable: boolean;
}

export const GNSS_CONSTELLATIONS: GnssConstellationDefinition[] = [
  {
    constellation: "GPS",
    countryOrRegion: "US",
    referenceFrame: "WGS84",
    timeScale: "GPST",
    global: true,
    enabledByDefault: true,
    liveCapable: true,
  },
  {
    constellation: "GLONASS",
    countryOrRegion: "RUSSIA",
    referenceFrame: "PZ90",
    timeScale: "GLONASST",
    global: true,
    enabledByDefault: true,
    liveCapable: true,
  },
  {
    constellation: "GALILEO",
    countryOrRegion: "EU",
    referenceFrame: "GTRF",
    timeScale: "GST",
    global: true,
    enabledByDefault: true,
    liveCapable: true,
  },
  {
    constellation: "BEIDOU",
    countryOrRegion: "CHINA",
    referenceFrame: "CGCS2000",
    timeScale: "BDT",
    global: true,
    enabledByDefault: true,
    liveCapable: true,
  },
  {
    constellation: "NAVIC",
    countryOrRegion: "INDIA",
    referenceFrame: "WGS84",
    timeScale: "IRNSS",
    global: false,
    enabledByDefault: true,
    liveCapable: true,
  },
];

export interface GnssSatelliteState {
  id: string;
  constellation: GnssConstellation;
  svId?: string;
  latitude?: number;
  longitude?: number;
  altitudeKm?: number;
  ecefXKm?: number;
  ecefYKm?: number;
  ecefZKm?: number;
  velocityXKmS?: number;
  velocityYKmS?: number;
  velocityZKmS?: number;
  speedKmS?: number;
  speedKmH?: number;
  clockBiasNs?: number;
  clockDriftNsS?: number;
  elevationDeg?: number;
  azimuthDeg?: number;
  timestamp: string;
  referenceFrame: GnssReferenceFrame;
  source: "BROADCAST" | "PRECISE" | "RECEIVER" | "CATALOG";
}

export interface CelestialCoordinateState {
  objectId: string;
  objectName: string;
  rightAscensionDeg?: number;
  declinationDeg?: number;
  distanceAu?: number;
  azimuthDeg?: number;
  altitudeDeg?: number;
  hourAngleDeg?: number;
  raRateMasS?: number;
  decRateMasS?: number;
  observerLatitudeDeg?: number;
  observerLongitudeDeg?: number;
  observerHeightM?: number;
  obstime: string;
  frame: CelestialReferenceFrame;
  equinox?: string;
  ephemerisSource?: "JPL" | "ERFA" | "CATALOG";
  earthOrientationSource?: "IERS" | "BUILT_IN" | "NONE";
}

export interface PrecisionPositionFix {
  latitudeDeg: number;
  longitudeDeg: number;
  heightM: number;
  ecefX: number;
  ecefY: number;
  ecefZ: number;
  timestamp: string;
  referenceFrame: "ITRF" | "WGS84";
  horizontalAccuracyM?: number;
  verticalAccuracyM?: number;
  constellationCount: number;
  constellations: GnssConstellation[];
  celestialCrossCheck?: {
    enabled: boolean;
    frame: CelestialReferenceFrame;
    residualArcsec?: number;
  };
}
