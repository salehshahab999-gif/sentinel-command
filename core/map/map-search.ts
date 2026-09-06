export type MapSearchSource = "LOCAL" | "ONLINE";

export interface MapSearchResult {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  source: MapSearchSource;
  type: string;
  openMapsUrl: string;
}

const LOCAL_PLACES: MapSearchResult[] = [
  ["tehran", "Tehran", "Tehran, Iran", 35.6892, 51.389, "city"],
  ["shiraz", "Shiraz", "Shiraz, Iran", 29.5918, 52.5837, "city"],
  ["isfahan", "Isfahan", "Isfahan, Iran", 32.6539, 51.666],
  ["mashhad", "Mashhad", "Mashhad, Iran", 36.2605, 59.6168, "city"],
  ["tabriz", "Tabriz", "Tabriz, Iran", 38.0962, 46.2738, "city"],
  ["qom", "Qom", "Qom, Iran", 34.6416, 50.8746, "city"],
  ["bandar-abbas", "Bandar Abbas", "Bandar Abbas, Iran", 27.1832, 56.2666, "city"],
  ["bushehr", "Bushehr", "Bushehr, Iran", 28.9234, 50.8203, "city"],
  ["berlin", "Berlin", "Berlin, Germany", 52.52, 13.405, "city"],
  ["frankfurt", "Frankfurt", "Frankfurt, Germany", 50.1109, 8.6821, "city"],
  ["london", "London", "London, United Kingdom", 51.5074, -0.1278, "city"],
  ["washington", "Washington", "Washington, D.C., USA", 38.9072, -77.0369, "city"],
  ["moscow", "Moscow", "Moscow, Russia", 55.7558, 37.6173, "city"],
  ["beijing", "Beijing", "Beijing, China", 39.9042, 116.4074, "city"],
  ["tokyo", "Tokyo", "Tokyo, Japan", 35.6762, 139.6503, "city"],
  ["dubai", "Dubai", "Dubai, United Arab Emirates", 25.2048, 55.2708, "city"],
  ["doha", "Doha", "Doha, Qatar", 25.2854, 51.531, "city"],
  ["riyadh", "Riyadh", "Riyadh, Saudi Arabia", 24.7136, 46.6753, "city"],
  ["cairo", "Cairo", "Cairo, Egypt", 30.0444, 31.2357, "city"],
  ["suez", "Suez", "Suez, Egypt", 29.9668, 32.5498, "city"],
  ["aden", "Aden", "Aden, Yemen", 12.7855, 45.0187, "city"],
  ["jeddah", "Jeddah", "Jeddah, Saudi Arabia", 21.5433, 39.1728, "city"],
].map(([id, name, displayName, latitude, longitude, type = "place"]) => ({
  id,
  name,
  displayName,
  latitude,
  longitude,
  source: "LOCAL" as const,
  type,
  openMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
}));

export function parseCoordinates(query: string): { latitude: number; longitude: number } | null {
  const normalized = query
    .trim()
    .replace(/[،;]/g, ",")
    .replace(/\s+/g, " ");

  const match = normalized.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export function searchLocalPlaces(query: string): MapSearchResult[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];

  const coordinates = parseCoordinates(query);
  if (coordinates) {
    return [
      {
        id: `coord-${coordinates.latitude}-${coordinates.longitude}`,
        name: "Coordinates",
        displayName: `${coordinates.latitude}, ${coordinates.longitude}`,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        source: "LOCAL",
        type: "coordinate",
        openMapsUrl: `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`,
      },
    ];
  }

  return LOCAL_PLACES.filter((place) =>
    `${place.name} ${place.displayName}`.toLocaleLowerCase().includes(q),
  ).slice(0, 8);
}

export function createCoordinateResult(latitude: number, longitude: number): MapSearchResult {
  return {
    id: `coord-${latitude}-${longitude}`,
    name: "Coordinates",
    displayName: `${latitude}, ${longitude}`,
    latitude,
    longitude,
    source: "LOCAL",
    type: "coordinate",
    openMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  };
}
