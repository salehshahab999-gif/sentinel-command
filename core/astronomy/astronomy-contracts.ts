export type CelestialFrame = "ICRS" | "GCRS" | "CIRS" | "ITRS" | "TEME";

export type AstronomyObservation = {
  id: string;
  targetId: string;
  timestamp: string;
  frame: CelestialFrame;
  raDeg?: number;
  decDeg?: number;
  azimuthDeg?: number;
  elevationDeg?: number;
  ecefXKm?: number;
  ecefYKm?: number;
  ecefZKm?: number;
  uncertaintyArcSec?: number;
  source: "IERS" | "JPL" | "ASTROPY" | "SKYFIELD" | "OTHER";
};

export type EarthOrientationData = {
  timestamp: string;
  dut1Seconds?: number;
  polarMotionXArcSec?: number;
  polarMotionYArcSec?: number;
  source: "IERS" | "LOCAL_CACHE" | "UNKNOWN";
};

export type AstronomyWireStatus = {
  component: string;
  status: "READY" | "CONNECTED" | "OFF" | "POWERED_OFF";
  note: string;
};

export const ASTRONOMY_WIRE_STATUS: AstronomyWireStatus[] = [
  { component: "IERS EOP", status: "READY", note: "Frame/time conversion input; no live fetch until explicitly enabled." },
  { component: "ICRS/GCRS", status: "READY", note: "Celestial reference contracts are available." },
  { component: "ITRS", status: "READY", note: "Terrestrial frame endpoint for Earth-fixed solutions." },
  { component: "JPL Ephemerides", status: "READY", note: "Ephemeris adapter boundary reserved for celestial validation." },
];
