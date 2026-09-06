export type MapSearchSource = "LOCAL" | "ONLINE" | "CACHE";

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

type LocalPlace = Omit<MapSearchResult, "source" | "openMapsUrl">;

const LOCAL_PLACES: LocalPlace[] = [
  { id: "tehran", name: "Tehran", displayName: "Tehran, Iran", latitude: 35.6892, longitude: 51.389, type: "city" },
  { id: "shiraz", name: "Shiraz", displayName: "Shiraz, Iran", latitude: 29.5918, longitude: 52.5837, type: "city" },
  { id: "isfahan", name: "Isfahan", displayName: "Isfahan, Iran", latitude: 32.6539, longitude: 51.666, type: "city" },
  { id: "mashhad", name: "Mashhad", displayName: "Mashhad, Iran", latitude: 36.2605, longitude: 59.6168, type: "city" },
  { id: "tabriz", name: "Tabriz", displayName: "Tabriz, Iran", latitude: 38.0962, longitude: 46.2738, type: "city" },
  { id: "qom", name: "Qom", displayName: "Qom, Iran", latitude: 34.6416, longitude: 50.8746, type: "city" },
  { id: "bandar-abbas", name: "Bandar Abbas", displayName: "Bandar Abbas, Iran", latitude: 27.1832, longitude: 56.2666, type: "city" },
  { id: "bushehr", name: "Bushehr", displayName: "Bushehr, Iran", latitude: 28.9234, longitude: 50.8203, type: "city" },
  { id: "berlin", name: "Berlin", displayName: "Berlin, Germany", latitude: 52.52, longitude: 13.405, type: "city" },
  { id: "frankfurt", name: "Frankfurt", displayName: "Frankfurt, Germany", latitude: 50.1109, longitude: 8.6821, type: "city" },
  { id: "london", name: "London", displayName: "London, United Kingdom", latitude: 51.5074, longitude: -0.1278, type: "city" },
  { id: "washington", name: "Washington", displayName: "Washington, D.C., USA", latitude: 38.9072, longitude: -77.0369, type: "city" },
  { id: "moscow", name: "Moscow", displayName: "Moscow, Russia", latitude: 55.7558, longitude: 37.6173, type: "city" },
  { id: "beijing", name: "Beijing", displayName: "Beijing, China", latitude: 39.9042, longitude: 116.4074, type: "city" },
  { id: "tokyo", name: "Tokyo", displayName: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503, type: "city" },
  { id: "dubai", name: "Dubai", displayName: "Dubai, United Arab Emirates", latitude: 25.2048, longitude: 55.2708, type: "city" },
  { id: "doha", name: "Doha", displayName: "Doha, Qatar", latitude: 25.2854, longitude: 51.531, type: "city" },
  { id: "riyadh", name: "Riyadh", displayName: "Riyadh, Saudi Arabia", latitude: 24.7136, longitude: 46.6753, type: "city" },
  { id: "cairo", name: "Cairo", displayName: "Cairo, Egypt", latitude: 30.0444, longitude: 31.2357, type: "city" },
  { id: "suez", name: "Suez", displayName: "Suez, Egypt", latitude: 29.9668, longitude: 32.5498, type: "city" },
  { id: "aden", name: "Aden", displayName: "Aden, Yemen", latitude: 12.7855, longitude: 45.0187, type: "city" },
  { id: "jeddah", name: "Jeddah", displayName: "Jeddah, Saudi Arabia", latitude: 21.5433, longitude: 39.1728, type: "city" },
];

function withGoogleMapsUrl(result: Omit<MapSearchResult, "openMapsUrl">): MapSearchResult {
  return {
    ...result,
    openMapsUrl: `https://www.google.com/maps/search/?api=1&query=${result.latitude},${result.longitude}`,
  };
}

export function parseCoordinates(query: string): { latitude: number; longitude: number } | null {
  const normalized = query.trim().replace(/[،;]/g, ",").replace(/\s+/g, " ");
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
    return [withGoogleMapsUrl({
      id: `coord-${coordinates.latitude}-${coordinates.longitude}`,
      name: "Coordinates",
      displayName: `${coordinates.latitude}, ${coordinates.longitude}`,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      source: "LOCAL",
      type: "coordinate",
    })];
  }

  return LOCAL_PLACES
    .filter((place) => `${place.name} ${place.displayName}`.toLocaleLowerCase().includes(q))
    .slice(0, 8)
    .map((place) => withGoogleMapsUrl({ ...place, source: "LOCAL" }));
}

export function createCoordinateResult(latitude: number, longitude: number): MapSearchResult {
  return withGoogleMapsUrl({
    id: `coord-${latitude}-${longitude}`,
    name: "Coordinates",
    displayName: `${latitude}, ${longitude}`,
    latitude,
    longitude,
    source: "LOCAL",
    type: "coordinate",
  });
}
