import { MARITIME_PROVIDERS } from "../../../core/maritime/maritime-providers";
import type { VesselRecord } from "../../../core/maritime/maritime-contracts";

const LIVE_ENABLED = process.env.SENTINEL_LIVE_MARITIME === "true";

const skeletonVessels: VesselRecord[] = [
  { id: "SK-GULF-01", mmsi: 636019001, name: "SENTINEL TANKER 01", type: "TANKER", flag: "LIBERIA", source: "AISSTREAM", dataMode: "SKELETON", latitude: 26.42, longitude: 50.63, speedKnots: 10.8, courseDeg: 286, headingDeg: 284, destination: "FUJAIRAH", state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-GULF-02", mmsi: 636019002, name: "SENTINEL TANKER 02", type: "TANKER", flag: "MARSHALL ISLANDS", source: "VESSELFINDER", dataMode: "SKELETON", latitude: 27.12, longitude: 53.14, speedKnots: 12.3, courseDeg: 82, headingDeg: 84, destination: "SINGAPORE", state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-GULF-03", mmsi: 636019003, name: "SENTINEL CONTAINER 03", type: "CONTAINER", flag: "PANAMA", source: "AISSTREAM", dataMode: "SKELETON", latitude: 25.91, longitude: 56.08, speedKnots: 15.1, courseDeg: 248, headingDeg: 250, destination: "JEBEL ALI", state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-GULF-04", mmsi: 636019004, name: "SENTINEL TANKER 04", type: "TANKER", flag: "MALTA", source: "TANKERTRACKERS", dataMode: "SKELETON", latitude: 26.09, longitude: 56.49, speedKnots: 4.1, courseDeg: 140, headingDeg: 142, destination: "UNKNOWN", state: "SLOW", lastUpdate: "SKELETON" },
  { id: "SK-GULF-05", mmsi: 636019005, name: "SENTINEL CARGO 05", type: "CARGO", flag: "SINGAPORE", source: "AISSTREAM", dataMode: "SKELETON", latitude: 25.63, longitude: 54.62, speedKnots: 13.7, courseDeg: 278, headingDeg: 279, destination: "SALALAH", state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-GULF-06", mmsi: 636019006, name: "SENTINEL TANKER 06", type: "TANKER", flag: "GREECE", source: "VESSELFINDER", dataMode: "SKELETON", latitude: 24.78, longitude: 58.23, speedKnots: 11.4, courseDeg: 128, headingDeg: 126, destination: "DUQM", state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-GULF-07", mmsi: 636019007, name: "SENTINEL SUPPLY 07", type: "SERVICE", flag: "UAE", source: "AISSTREAM", dataMode: "SKELETON", latitude: 25.18, longitude: 55.22, speedKnots: 1.8, courseDeg: 32, headingDeg: 35, destination: "JEBEL ALI", state: "SLOW", lastUpdate: "SKELETON" },
  { id: "SK-GULF-08", mmsi: 636019008, name: "SENTINEL TANKER 08", type: "TANKER", flag: "BAHAMAS", source: "TANKERTRACKERS", dataMode: "SKELETON", latitude: 26.82, longitude: 57.34, speedKnots: 9.9, courseDeg: 202, headingDeg: 201, destination: "OMAN", state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-GULF-09", mmsi: 636019009, name: "SENTINEL CARGO 09", type: "CARGO", flag: "CYPRUS", source: "AISSTREAM", dataMode: "SKELETON", latitude: 27.64, longitude: 50.94, speedKnots: 0, courseDeg: 0, headingDeg: 511, destination: "DAMMAM", state: "ANCHORED", lastUpdate: "SKELETON" },
  { id: "SK-GULF-10", mmsi: 636019010, name: "SENTINEL TANKER 10", type: "TANKER", flag: "HONG KONG", source: "VESSELFINDER", dataMode: "SKELETON", latitude: 25.48, longitude: 57.74, speedKnots: 14.2, courseDeg: 95, headingDeg: 97, destination: "INDIA", state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-GULF-11", mmsi: 636019011, name: "SENTINEL GAS 11", type: "LNG", flag: "JAPAN", source: "AISSTREAM", dataMode: "SKELETON", latitude: 26.51, longitude: 51.52, speedKnots: 16.0, courseDeg: 74, headingDeg: 76, destination: "RAS LAFFAN", state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-GULF-12", mmsi: 636019012, name: "SENTINEL TANKER 12", type: "TANKER", flag: "NORWAY", source: "TANKERTRACKERS", dataMode: "SKELETON", latitude: 26.28, longitude: 54.12, speedKnots: 0.4, courseDeg: 240, headingDeg: 239, destination: "UNKNOWN", state: "ANCHORED", lastUpdate: "SKELETON" },
  { id: "SK-RED-01", name: "RED SEA TRADER 01", type: "CONTAINER", source: "AISSTREAM", dataMode: "SKELETON", latitude: 15.82, longitude: 41.52, speedKnots: 18.3, courseDeg: 154, state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-RED-02", name: "RED SEA TANKER 02", type: "TANKER", source: "VESSELFINDER", dataMode: "SKELETON", latitude: 19.14, longitude: 38.86, speedKnots: 12.1, courseDeg: 338, state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-RED-03", name: "RED SEA CARGO 03", type: "CARGO", source: "AISSTREAM", dataMode: "SKELETON", latitude: 12.72, longitude: 43.18, speedKnots: 8.6, courseDeg: 78, state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-MED-01", name: "MED FREIGHT 01", type: "CONTAINER", source: "SHIPFINDER", dataMode: "SKELETON", latitude: 35.44, longitude: 18.26, speedKnots: 14.2, courseDeg: 92, state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-IND-01", name: "INDIAN OCEAN TANKER 01", type: "TANKER", source: "TANKERTRACKERS", dataMode: "SKELETON", latitude: 10.82, longitude: 67.24, speedKnots: 13.5, courseDeg: 285, state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-SEA-01", name: "MALACCA CARRIER 01", type: "CARGO", source: "AISSTREAM", dataMode: "SKELETON", latitude: 2.52, longitude: 101.82, speedKnots: 12.7, courseDeg: 146, state: "MOVING", lastUpdate: "SKELETON" },
  { id: "SK-ATL-01", name: "ATLANTIC TANKER 01", type: "TANKER", source: "VESSELFINDER", dataMode: "SKELETON", latitude: 33.12, longitude: -24.62, speedKnots: 10.9, courseDeg: 262, state: "MOVING", lastUpdate: "SKELETON" },
];

export async function GET() {
  return Response.json({
    mode: LIVE_ENABLED ? "LIVE_READY" : "SKELETON",
    liveEnabled: LIVE_ENABLED,
    vessels: skeletonVessels,
    providers: MARITIME_PROVIDERS.map((provider) => ({
      ...provider,
      status: LIVE_ENABLED && provider.liveAvailable ? "READY" : "POWERED_OFF",
    })),
    timestamp: new Date().toISOString(),
  });
}
