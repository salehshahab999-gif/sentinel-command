"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SATELLITE_LAYERS, SKELETON_SATELLITES } from "../../core/satellite/satellite-catalog";
import type { SatelliteLayerId, SatelliteRecord } from "../../core/satellite/satellite-contracts";
import type { MapSearchResult } from "../../core/map/map-search";
import { filterUniversalMapTargets, type UniversalMapFilter, type UniversalMapTarget } from "../../core/map/universal-filter";

const CESIUM_VERSION = "1.145";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

type ProviderFilter = "ALL" | "COPERNICUS" | "NASA" | "NOAA";
type GlobalMode = "map" | "satellite-labels" | "satellite-clean";

declare global {
  interface Window { Cesium?: any; CESIUM_BASE_URL?: string; }
}

const providerFilters: Array<{ id: ProviderFilter; label: string }> = [
  { id: "ALL", label: "ALL" },
  { id: "COPERNICUS", label: "COPERNICUS" },
  { id: "NASA", label: "NASA" },
  { id: "NOAA", label: "NOAA" },
];

const layerAccent: Record<SatelliteLayerId, string> = {
  baseMap: "border-cyan-800 text-cyan-300",
  satellites: "border-emerald-800 text-emerald-300",
  orbits: "border-violet-800 text-violet-300",
  fires: "border-orange-800 text-orange-300",
  weather: "border-blue-800 text-blue-300",
  clouds: "border-slate-700 text-slate-300",
  ocean: "border-teal-800 text-teal-300",
  ais: "border-amber-800 text-amber-300",
  geography: "border-green-800 text-green-300",
  events: "border-yellow-800 text-yellow-300",
  alerts: "border-red-800 text-red-300",
};

function loadCesium(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) return resolve(window.Cesium);
    window.CESIUM_BASE_URL = `${CESIUM_BASE}/`;

    if (!document.querySelector('link[data-sentinel-cesium-css="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${CESIUM_BASE}/Widgets/widgets.css`;
      link.dataset.sentinelCesiumCss = "true";
      document.head.appendChild(link);
    }

    const existing = document.querySelector('script[data-sentinel-cesium="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Cesium), { once: true });
      existing.addEventListener("error", () => reject(new Error("Cesium script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `${CESIUM_BASE}/Cesium.js`;
    script.async = true;
    script.dataset.sentinelCesium = "true";
    script.onload = () => window.Cesium ? resolve(window.Cesium) : reject(new Error("Cesium global unavailable"));
    script.onerror = () => reject(new Error("Failed to load CesiumJS"));
    document.head.appendChild(script);
  });
}

function satelliteToMapTarget(satellite: SatelliteRecord): UniversalMapTarget {
  return {
    id: satellite.id,
    domain: "SATELLITE",
    name: satellite.name,
    description: `${satellite.operator ?? ""} ${satellite.mission ?? ""}`,
    source: satellite.source,
    type: "satellite",
    status: satellite.status,
    mode: satellite.dataMode,
    latitude: satellite.latitude,
    longitude: satellite.longitude,
    altitudeKm: satellite.altitudeKm,
    speedKmH: satellite.speedKmH ?? (satellite.speedKmS !== undefined ? satellite.speedKmS * 3600 : undefined),
    headingDeg: satellite.headingDeg,
    elevationDeg: satellite.elevationDeg,
    timestamp: satellite.timestamp,
    referenceFrame: satellite.referenceFrame,
  };
}

function providerColor(Cesium: any, source: string) {
  if (source === "COPERNICUS") return Cesium.Color.CYAN;
  if (source === "NASA") return Cesium.Color.LIME;
  if (source === "NOAA") return Cesium.Color.ORANGE;
  return Cesium.Color.WHITE;
}

function buildOrbit(Cesium: any, satellite: SatelliteRecord) {
  const radiusMeters = (6371 + satellite.altitudeKm) * 1000;
  const inclination = Cesium.Math.toRadians(satellite.inclinationDeg);
  const raan = Cesium.Math.toRadians(satellite.raanDeg);
  const points = [];
  for (let i = 0; i <= 96; i += 1) {
    const theta = (i / 96) * Cesium.Math.TWO_PI;
    const x = radiusMeters * Math.cos(theta);
    const y = radiusMeters * Math.sin(theta) * Math.cos(inclination);
    const z = radiusMeters * Math.sin(theta) * Math.sin(inclination);
    points.push(new Cesium.Cartesian3(
      x * Math.cos(raan) - y * Math.sin(raan),
      x * Math.sin(raan) + y * Math.cos(raan),
      z,
    ));
  }
  return points;
}

export default function SatelliteIntelligence() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const clickHandlerRef = useRef<any>(null);
  const mapLayerRef = useRef<any>(null);
  const imageryLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const pointsRef = useRef<any>(null);
  const orbitCollectionRef = useRef<any>(null);

  const [cesiumReady, setCesiumReady] = useState(false);
  const [mode, setMode] = useState<GlobalMode>("satellite-labels");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState<ProviderFilter>("ALL");
  const [universalFilter, setUniversalFilter] = useState<UniversalMapFilter>({});
  const [enabledLayers, setEnabledLayers] = useState<Record<SatelliteLayerId, boolean>>(
    () => Object.fromEntries(SATELLITE_LAYERS.map((layer) => [layer.id, layer.defaultEnabled])) as Record<SatelliteLayerId, boolean>,
  );
  const [runtimeStatus, setRuntimeStatus] = useState("BOOTING GLOBAL");

  const selected = useMemo(
    () => SKELETON_SATELLITES.find((satellite) => satellite.id === selectedId) ?? null,
    [selectedId],
  );

  const filteredSatellites = useMemo(() => {
    const query = search.trim().toLowerCase();
    const candidates = SKELETON_SATELLITES.filter((satellite) => {
      const providerMatch = provider === "ALL" || satellite.source === provider;
      const haystack = `${satellite.name} ${satellite.id} ${satellite.operator ?? ""} ${satellite.mission ?? ""}`.toLowerCase();
      return providerMatch && (!query || haystack.includes(query));
    });
    const visible = new Set(filterUniversalMapTargets(candidates.map(satelliteToMapTarget), universalFilter).map((target) => target.id));
    return candidates.filter((satellite) => visible.has(satellite.id));
  }, [provider, search, universalFilter]);

  const applyMode = (nextMode: GlobalMode) => {
    const map = mapLayerRef.current;
    const imagery = imageryLayerRef.current;
    const labels = labelsLayerRef.current;
    if (!map || !imagery || !labels) return;

    map.show = nextMode === "map" && enabledLayers.baseMap;
    imagery.show = nextMode !== "map" && enabledLayers.baseMap;
    labels.show = nextMode !== "satellite-clean" && enabledLayers.baseMap;
    setMode(nextMode);
    viewerRef.current?.scene?.requestRender?.();
  };

  useEffect(() => {
    let destroyed = false;
    async function init() {
      try {
        const Cesium = await loadCesium();
        if (destroyed || !containerRef.current) return;

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          scene3DOnly: true,
          shouldAnimate: false,
          requestRenderMode: true,
          maximumRenderTimeChange: Number.POSITIVE_INFINITY,
          baseLayer: false,
        });

        viewerRef.current = viewer;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.showGroundAtmosphere = false;
        viewer.scene.globe.maximumScreenSpaceError = 0.7;
        viewer.scene.globe.tileCacheSize = 400;
        viewer.scene.globe.preloadAncestors = true;
        viewer.scene.globe.preloadSiblings = true;
        viewer.scene.fog.enabled = false;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
        if (viewer.scene.sun) viewer.scene.sun.show = false;
        if (viewer.scene.moon) viewer.scene.moon.show = false;
        if (viewer.scene.postProcessStages?.fxaa) viewer.scene.postProcessStages.fxaa.enabled = true;
        viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(35, 30, 19000000) });

        const localProvider = (tileMode: string) => new Cesium.UrlTemplateImageryProvider({
          url: `/api/map/tile/{z}/{x}/{y}.png?mode=${tileMode}`,
          maximumLevel: 19,
          tilingScheme: new Cesium.WebMercatorTilingScheme(),
          credit: "Sentinel map service • Esri / OpenStreetMap attribution",
        });

        mapLayerRef.current = viewer.imageryLayers.addImageryProvider(localProvider("map"));
        imageryLayerRef.current = viewer.imageryLayers.addImageryProvider(localProvider("imagery"));
        labelsLayerRef.current = viewer.imageryLayers.addImageryProvider(localProvider("labels"));
        mapLayerRef.current.show = false;
        imageryLayerRef.current.show = true;
        labelsLayerRef.current.show = true;

        pointsRef.current = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        pointsRef.current.blendOption = Cesium.BlendOption.TRANSLUCENT;
        orbitCollectionRef.current = viewer.scene.primitives.add(new Cesium.PolylineCollection());

        for (const satellite of SKELETON_SATELLITES) {
          const point = pointsRef.current.add({
            id: satellite.id,
            position: Cesium.Cartesian3.fromDegrees(satellite.longitude, satellite.latitude, satellite.altitudeKm * 1000),
            pixelSize: 8,
            color: providerColor(Cesium, satellite.source),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          });
          point._sentinelSatelliteId = satellite.id;

          const orbit = orbitCollectionRef.current.add({
            positions: buildOrbit(Cesium, satellite),
            width: 1.2,
            material: Cesium.Material.fromType("Color", { color: providerColor(Cesium, satellite.source).withAlpha(0.30) }),
          });
          orbit._sentinelSatelliteId = satellite.id;
        }

        clickHandlerRef.current = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        clickHandlerRef.current.setInputAction((movement: any) => {
          const picked = viewer.scene.pick(movement.position);
          const id = picked?.primitive?._sentinelSatelliteId ?? picked?.id;
          if (typeof id === "string") setSelectedId(id);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        const controller = viewer.scene.screenSpaceCameraController;
        controller.minimumZoomDistance = 1200;
        controller.maximumZoomDistance = 40000000;
        controller.enableCollisionDetection = false;

        if (Cesium.ScreenSpaceZoomCameraController) {
          controller.enableZoom = false;
          const zoomController = new Cesium.ScreenSpaceZoomCameraController({
            usePointerPosition: true,
            zoomSensitivity: 0.12,
            zoomDistanceRatio: 0.32,
            maximumZoomVelocity: 1.4,
            dampingEnabled: true,
            inertiaEnabled: true,
            inertialDecay: 7.0,
            zoomAnimationDuration: 0.32,
          });
          viewer.addController(zoomController);
          (viewer as any)._sentinelZoomController = zoomController;
        }

        setMode("satellite-labels");
        setCesiumReady(true);
        setRuntimeStatus("GLOBAL READY / LOCAL TILES / NO ION IMAGERY");
        viewer.scene.requestRender();
      } catch (error) {
        if (destroyed) return;
        setRuntimeStatus(error instanceof Error ? `GLOBAL ERROR / ${error.message}` : "GLOBAL ERROR");
        console.error("GLOBAL_CESIUM_INIT_ERROR:", error);
      }
    }

    void init();
    return () => {
      destroyed = true;
      clickHandlerRef.current?.destroy?.();
      clickHandlerRef.current = null;
      const viewer = viewerRef.current;
      const zoomController = viewer?._sentinelZoomController;
      if (viewer && zoomController) viewer.removeController?.(zoomController);
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      mapLayerRef.current = null;
      imageryLayerRef.current = null;
      labelsLayerRef.current = null;
      pointsRef.current = null;
      orbitCollectionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const points = pointsRef.current;
    if (points) {
      const visible = new Set(filteredSatellites.map((satellite) => satellite.id));
      for (let i = 0; i < points.length; i += 1) {
        const point = points.get(i);
        const satelliteId = point._sentinelSatelliteId ?? point.id;
        point.show = enabledLayers.satellites && visible.has(satelliteId);
        point.pixelSize = selectedId === satelliteId ? 13 : 8;
      }
      points.show = enabledLayers.satellites;
    }

    if (orbitCollectionRef.current) orbitCollectionRef.current.show = enabledLayers.orbits;
    if (mapLayerRef.current) mapLayerRef.current.show = mode === "map" && enabledLayers.baseMap;
    if (imageryLayerRef.current) imageryLayerRef.current.show = mode !== "map" && enabledLayers.baseMap;
    if (labelsLayerRef.current) labelsLayerRef.current.show = mode !== "satellite-clean" && enabledLayers.baseMap;
    viewerRef.current?.scene?.requestRender?.();
  }, [enabledLayers, filteredSatellites, mode, selectedId]);

  useEffect(() => {
    const handleMapFocus = (event: Event) => {
      const result = (event as CustomEvent<MapSearchResult>).detail;
      const viewer = viewerRef.current;
      const Cesium = window.Cesium;
      if (!viewer || !Cesium || !result) return;
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(result.longitude, result.latitude, 900000), duration: 0.8 });
    };
    const handleUniversalFilter = (event: Event) => setUniversalFilter((event as CustomEvent<UniversalMapFilter>).detail ?? {});
    window.addEventListener("sentinel-map-focus", handleMapFocus);
    window.addEventListener("sentinel-map-universal-filter", handleUniversalFilter);
    return () => {
      window.removeEventListener("sentinel-map-focus", handleMapFocus);
      window.removeEventListener("sentinel-map-universal-filter", handleUniversalFilter);
    };
  }, []);

  const toggleLayer = (id: SatelliteLayerId) => setEnabledLayers((current) => ({ ...current, [id]: !current[id] }));

  const focusSatellite = (satellite: SatelliteRecord) => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;
    setSelectedId(satellite.id);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(satellite.longitude, satellite.latitude, Math.max(2500000, satellite.altitudeKm * 5000)),
      duration: 0.8,
    });
  };

  const modeLabel = mode === "map" ? "MAP + CITY LABELS" : mode === "satellite-labels" ? "SATELLITE + CITY LABELS" : "SATELLITE CLEAN";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020406] text-slate-100">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,.10)_45%,rgba(0,0,0,.62)_100%)]" />
      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/75 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[.35em] text-cyan-400"><span className={`h-2 w-2 rounded-full ${cesiumReady ? "animate-pulse bg-emerald-400" : "animate-pulse bg-amber-400"}`} />SENTINEL COMMAND CENTER</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">GLOBAL INTELLIGENCE / SPACE</h1>
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">CESIUMJS {CESIUM_VERSION} • LOCAL MAP SERVICE • GLOBAL MODE ISOLATED</p>
        </div>
        <div className="rounded-full border border-cyan-900/80 bg-black/75 px-3 py-2 text-[9px] font-bold tracking-[.14em] text-cyan-300 backdrop-blur-xl">{modeLabel} • {runtimeStatus}</div>
      </header>

      <aside className="absolute left-4 top-28 z-20 w-[315px] max-w-[calc(100vw-2rem)] space-y-3 md:left-6">
        <section className="rounded-2xl border border-cyan-950/80 bg-black/78 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.24em] text-cyan-400">GLOBAL MAP MODE</span><span className="text-[8px] text-emerald-400">3 ONLINE</span></div>
          <div className="space-y-1.5">
            {([["map", "MAP + CITY LABELS", "STREET"], ["satellite-labels", "SATELLITE + CITY LABELS", "HYBRID"], ["satellite-clean", "SATELLITE CLEAN", "IMAGERY"]] as const).map(([id, label, tag]) => <button key={id} type="button" onClick={() => applyMode(id)} data-testid={`global-mode-${id}`} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[10px] font-semibold ${mode === id ? "border-cyan-700 bg-cyan-950/30 text-cyan-200" : "border-slate-800 bg-black/30 text-slate-400"}`}><span>{label}</span><span className="text-[8px] text-slate-600">{tag}</span></button>)}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-950/80 bg-black/78 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.24em] text-slate-400">SATELLITE FILTERS</span><span className="text-[8px] text-slate-600">{filteredSatellites.length} OBJECTS</span></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search satellite..." className="mb-2 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-700" />
          <div className="grid grid-cols-4 gap-1">{providerFilters.map((item) => <button key={item.id} type="button" onClick={() => setProvider(item.id)} className={`rounded-md border px-2 py-1.5 text-[8px] font-bold ${provider === item.id ? "border-cyan-700 bg-cyan-950/40 text-cyan-300" : "border-slate-900 text-slate-600"}`}>{item.label}</button>)}</div>
        </section>

        <section className="rounded-2xl border border-cyan-950/80 bg-black/78 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.24em] text-slate-400">LAYER BUS</span><span className="text-[8px] text-emerald-500">WIRED</span></div>
          <div className="flex flex-wrap gap-1.5">{SATELLITE_LAYERS.map((layer) => <button key={layer.id} type="button" onClick={() => toggleLayer(layer.id)} className={`rounded-md border px-2 py-1.5 text-[8px] font-medium ${enabledLayers[layer.id] ? `${layerAccent[layer.id]} bg-white/[.04]` : "border-slate-900 text-slate-700"}`}>{layer.label}</button>)}</div>
        </section>
      </aside>

      <section className="absolute right-4 top-28 z-20 hidden w-[275px] md:block">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/78 p-4 backdrop-blur-xl">
          <p className="text-[8px] font-bold tracking-[.28em] text-cyan-500">GLOBAL SOURCE BUS</p>
          <div className="mt-3 space-y-2 text-[9px]">
            <div className="flex justify-between"><span className="text-slate-600">MAP</span><span className="text-cyan-400">ESRI STREET / OSM</span></div>
            <div className="flex justify-between"><span className="text-slate-600">SATELLITE</span><span className="text-emerald-400">ESRI WORLD IMAGERY</span></div>
            <div className="flex justify-between"><span className="text-slate-600">LABELS</span><span className="text-violet-400">ESRI BOUNDARIES / PLACES</span></div>
            <div className="flex justify-between"><span className="text-slate-600">LOCAL CACHE</span><span className="text-emerald-400">ENABLED</span></div>
            <div className="flex justify-between"><span className="text-slate-600">CESIUM ION IMAGERY</span><span className="text-slate-500">NOT USED</span></div>
          </div>
        </div>
      </section>

      {selected && <section className="absolute bottom-24 right-4 z-30 w-[285px] max-w-[calc(100vw-2rem)] rounded-2xl border border-cyan-900/80 bg-black/88 p-4 backdrop-blur-xl md:right-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold tracking-[.25em] text-cyan-500">SELECTED SATELLITE</p><h2 className="mt-1 text-lg font-semibold text-cyan-100">{selected.name}</h2><p className="text-[9px] text-slate-600">{selected.id} • NORAD {selected.noradId ?? "PENDING"}</p></div><button type="button" onClick={() => setSelectedId(null)} className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-500">×</button></div><div className="mt-3 grid grid-cols-2 gap-2 text-[9px]"><div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">SOURCE</span><br /><span className="text-cyan-300">{selected.source}</span></div><div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">MODE</span><br /><span className="text-amber-300">{selected.dataMode}</span></div><div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">ALTITUDE</span><br /><span className="text-slate-300">{selected.altitudeKm.toLocaleString()} km</span></div><div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">MISSION</span><br /><span className="text-slate-300">{selected.mission}</span></div></div><button type="button" onClick={() => focusSatellite(selected)} className="mt-3 w-full rounded-lg border border-cyan-900 bg-cyan-950/30 px-3 py-2 text-[9px] font-bold text-cyan-300">FOCUS SATELLITE</button></section>}

      <footer className="absolute inset-x-0 bottom-4 z-20 px-4"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-cyan-950/80 bg-black/78 px-4 py-3 text-[8px] tracking-[.16em] backdrop-blur-xl"><span className="text-emerald-400">● CESIUM GLOBE</span><span className="text-cyan-400">● LOCAL MAP CACHE</span><span className="text-violet-400">● LABEL OVERLAY</span><span className="text-slate-500">● LIVE COLLECTORS OFF</span></div></footer>
    </main>
  );
}
