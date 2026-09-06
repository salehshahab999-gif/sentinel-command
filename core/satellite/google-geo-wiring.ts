export type GoogleGeoProviderStatus = "POWERED_OFF" | "READY";

export type GoogleGeoProviderWire = {
  id: "maps" | "photorealistic3d" | "satellite";
  label: string;
  status: GoogleGeoProviderStatus;
  requiresKey: boolean;
  requiresBilling: boolean;
  purpose: string;
  note: string;
};

export const GOOGLE_GEO_WIRES: GoogleGeoProviderWire[] = [
  {
    id: "photorealistic3d",
    label: "Google Photorealistic 3D Tiles",
    status: "POWERED_OFF",
    requiresKey: true,
    requiresBilling: true,
    purpose: "Optional high-detail 3D terrain/building imagery",
    note: "Enable explicitly only after configuring a restricted Google Maps API key and quota budget.",
  },
  {
    id: "maps",
    label: "Google Maps WebGL",
    status: "POWERED_OFF",
    requiresKey: true,
    requiresBilling: true,
    purpose: "Optional vector-map/WebGL overlay source",
    note: "Can host synchronized 2D/3D overlays; not used implicitly by Sentinel.",
  },
  {
    id: "satellite",
    label: "Google Satellite Imagery",
    status: "POWERED_OFF",
    requiresKey: true,
    requiresBilling: true,
    purpose: "Optional visual reference imagery",
    note: "Use official Google Maps Platform APIs only; never scrape Google Earth imagery.",
  },
];

export const GOOGLE_GEO_POLICY = {
  defaultEnabled: false,
  neverScrape: true,
  requiresExplicitCredential: true,
  preferCesiumBaseMapWhenUnconfigured: true,
};
