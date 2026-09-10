"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  SATELLITE_LAYERS,
  SKELETON_SATELLITES,
} from "../../core/satellite/satellite-catalog";
import type {
  SatelliteLayerId,
  SatelliteRecord,
} from "../../core/satellite/satellite-contracts";
import type { MapSearchResult } from "../../core/map/map-search";
import {
  filterUniversalMapTargets,
  type UniversalMapFilter,
  type UniversalMapTarget,
} from "../../core/map/universal-filter";

const CESIUM_VERSION = "1.145";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

type ProviderFilter = "ALL" | "COPERNICUS" | "NASA" | "NOAA";

declare global {
  interface Window {
    Cesium?: any;
    __SENTINEL_GLOBAL_VIEWER__?: any;
  }
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
    const rx = x * Math.cos(raan) - y * Math.sin(raan);
    const ry = x * Math.sin(raan) + y * Math.cos(raan);
    points.push(new Cesium.Cartesian3(rx, ry, z));
  }

  return points;
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
    speedKmH:
      satellite.speedKmH ??
      (satellite.speedKmS !== undefined ? satellite.speedKmS * 3600 : undefined),
    headingDeg: satellite.headingDeg,
    elevationDeg: satellite.elevationDeg,
    timestamp: satellite.timestamp,
    referenceFrame: satellite.referenceFrame,
  };
}

export default function SatelliteIntelligence() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const pointsRef = useRef<any>(null);
  const orbitCollectionRef = useRef<any>(null);
  const customMapLayerRef = useRef<any>(null);
  const clickHandlerRef = useRef<any>(null);

  const [cesiumReady, setCesiumReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState<ProviderFilter>("ALL");
  const [universalFilter, setUniversalFilter] = useState<UniversalMapFilter>({});

  const [enabledLayers, setEnabledLayers] = useState<Record<SatelliteLayerId, boolean>>(
    () =>
      Object.fromEntries(
        SATELLITE_LAYERS.map((layer) => [layer.id, layer.defaultEnabled]),
      ) as Record<SatelliteLayerId, boolean>,
  );

  const [runtimeStatus, setRuntimeStatus] = useState("BOOTING GLOBAL");

  const selected = useMemo(
    () => SKELETON_SATELLITES.find((satellite) => satellite.id === selectedId) ?? null,
    [selectedId],
  );

  const filteredSatellites = useMemo(() => {
    const query = search.trim().toLowerCase();
    const candidates = SKELETON_SATELLITES.filter((satellite) => {
      const matchesProvider = provider === "ALL" || satellite.source === provider;
      const haystack =
        `${satellite.name} ${satellite.id} ${satellite.operator ?? ""} ${satellite.mission ?? ""}`.toLowerCase();
      return matchesProvider && (!query || haystack.includes(query));
    });

    const visibleIds = new Set(
      filterUniversalMapTargets(
        candidates.map(satelliteToMapTarget),
        universalFilter,
      ).map((target) => target.id),
    );

    return candidates.filter((satellite) => visibleIds.has(satellite.id));
  }, [provider, search, universalFilter]);

  useEffect(() => {
    if (!cesiumReady || !containerRef.current || viewerRef.current || !window.Cesium) {
      return;
    }

    const Cesium = window.Cesium;
    setRuntimeStatus("POWERING GLOBAL / MAP ONLY");

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
    });

    viewerRef.current = viewer;
    window.__SENTINEL_GLOBAL_VIEWER__ = viewer;

    viewer.scene.globe.show = true;
    viewer.scene.skyBox.show = false;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.sun.show = false;
    viewer.scene.moon.show = false;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0a1620");
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.postProcessStages.fxaa.enabled = true;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(35, 25, 20_000_000),
    });

    // Cesium's default wheel zoom is disabled so one dedicated zoom controller owns the wheel.
    viewer.scene.screenSpaceCameraController.enableZoom = false;
    const zoomController = new Cesium.ScreenSpaceZoomCameraController();
    zoomController.usePointerPosition = true;
    zoomController.zoomSensitivity = 0.12;
    zoomController.zoomDistanceRatio = 0.32;
    zoomController.maximumZoomVelocity = 1.4;
    zoomController.dampingEnabled = true;
    zoomController.inertiaEnabled = true;
    zoomController.inertialDecay = 7.0;
    zoomController.zoomAnimationDuration = 0.32;
    viewer.addController(zoomController);

    // Global MAP is deliberately street/cartographic only. Satellite imagery is a separate future layer.
    const customProvider = new Cesium.UrlTemplateImageryProvider({
      url: "/api/map/tile/{z}/{x}/{y}.png",
      maximumLevel: 19,
      credit: "© Esri World Street Map / © OpenStreetMap contributors",
      enablePickFeatures: false,
    });

    customMapLayerRef.current = viewer.imageryLayers.addImageryProvider(customProvider);
    customMapLayerRef.current.show = enabledLayers.baseMap;

    const points = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
    points.blendOption = Cesium.BlendOption.TRANSLUCENT;
    pointsRef.current = points;

    const orbitCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
    orbitCollectionRef.current = orbitCollection;

    for (const satellite of SKELETON_SATELLITES) {
      const point = points.add({
        id: satellite.id,
        position: Cesium.Cartesian3.fromDegrees(
          satellite.longitude,
          satellite.latitude,
          satellite.altitudeKm * 1000,
        ),
        pixelSize: 8,
        color: providerColor(Cesium, satellite.source),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(4.0e6, 1.6, 4.0e7, 0.55),
      });
      point._sentinelSatelliteId = satellite.id;

      const orbit = orbitCollection.add({
        positions: buildOrbit(Cesium, satellite),
        width: 1.2,
        material: Cesium.Material.fromType("Color", {
          color: providerColor(Cesium, satellite.source).withAlpha(0.34),
        }),
      });
      orbit._sentinelSatelliteId = satellite.id;
    }

    clickHandlerRef.current = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    clickHandlerRef.current.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position);
      const id = picked?.primitive?._sentinelSatelliteId ?? picked?.id;
      if (typeof id === "string") setSelectedId(id);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewer.scene.requestRender();
    setRuntimeStatus("GLOBAL READY / STREET MAP / ZOOM READY");

    return () => {
      clickHandlerRef.current?.destroy?.();
      clickHandlerRef.current = null;
      window.__SENTINEL_GLOBAL_VIEWER__ = undefined;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      pointsRef.current = null;
      orbitCollectionRef.current = null;
      customMapLayerRef.current = null;
    };
  }, [cesiumReady]);

  useEffect(() => {
    const points = pointsRef.current;
    const customMapLayer = customMapLayerRef.current;
    if (!points) return;

    const visible = new Set(filteredSatellites.map((satellite) => satellite.id));
    for (let i = 0; i < points.length; i += 1) {
      const point = points.get(i);
      const satelliteId = point._sentinelSatelliteId ?? point.id;
      point.show = enabledLayers.satellites && visible.has(satelliteId);
      point.pixelSize = selectedId && satelliteId === selectedId ? 13 : 8;
    }

    points.show = enabledLayers.satellites;
    if (orbitCollectionRef.current) orbitCollectionRef.current.show = enabledLayers.orbits;
    if (customMapLayer) customMapLayer.show = enabledLayers.baseMap;
    viewerRef.current?.scene?.requestRender?.();
  }, [enabledLayers, filteredSatellites, selectedId]);

  useEffect(() => {
    const handleMapFocus = (event: Event) => {
      const result = (event as CustomEvent<MapSearchResult>).detail;
      const viewer = viewerRef.current;
      const Cesium = window.Cesium;
      if (!viewer || !Cesium || !result) return;

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(result.longitude, result.latitude, 300_000),
        duration: 0.7,
      });
    };

    const handleUniversalFilter = (event: Event) => {
      const filter = (event as CustomEvent<UniversalMapFilter>).detail;
      setUniversalFilter(filter ?? {});
    };

    window.addEventListener("sentinel-map-focus", handleMapFocus);
    window.addEventListener("sentinel-map-universal-filter", handleUniversalFilter);
    return () => {
      window.removeEventListener("sentinel-map-focus", handleMapFocus);
      window.removeEventListener("sentinel-map-universal-filter", handleUniversalFilter);
    };
  }, []);

  const toggleLayer = (id: SatelliteLayerId) => {
    setEnabledLayers((current) => ({ ...current, [id]: !current[id] }));
  };

  const focusSatellite = (satellite: SatelliteRecord) => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;
    setSelectedId(satellite.id);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        satellite.longitude,
        satellite.latitude,
        Math.max(2_500_000, satellite.altitudeKm * 5000),
      ),
      duration: 0.9,
    });
  };

  const zoomCamera = (direction: "in" | "out") => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;

    const cartographic = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC);
    const height = Math.max(cartographic?.height ?? 1_000_000, 100);
    const distance = direction === "in"
      ? Math.max(height * 0.38, 150)
      : Math.max(height * 0.65, 500);

    if (direction === "in") viewer.camera.zoomIn(distance);
    else viewer.camera.zoomOut(distance);

    viewer.scene.requestRender();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020406] text-slate-100">
      <link rel="stylesheet" href={`${CESIUM_BASE}/Widgets/widgets.css`} />
      <Script
        id="sentinel-cesium"
        src={`${CESIUM_BASE}/Cesium.js`}
        strategy="afterInteractive"
        onLoad={() => setCesiumReady(true)}
        onError={() => setRuntimeStatus("CESIUM LOAD ERROR")}
      />

      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,.08)_45%,rgba(0,0,0,.52)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/70 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[.35em] text-cyan-400">
            <span className={`h-2 w-2 rounded-full ${cesiumReady ? "animate-pulse bg-emerald-400" : "animate-pulse bg-amber-400"}`} />
            SENTINEL COMMAND CENTER
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">GLOBAL INTELLIGENCE / SPACE</h1>
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">CESIUMJS {CESIUM_VERSION} • STREET MAP • LIVE SATELLITE FEEDS OFF</p>
        </div>
        <div className="rounded-full border border-emerald-900/80 bg-black/70 px-3 py-2 text-[9px] font-bold tracking-[.16em] text-emerald-300 backdrop-blur-xl">{runtimeStatus}</div>
      </header>

      <div className="absolute right-4 top-28 z-30 flex flex-col gap-1 rounded-xl border border-cyan-950/80 bg-black/80 p-1.5 shadow-2xl backdrop-blur-xl md:right-6">
        <button data-testid="global-zoom-in" type="button" onClick={() => zoomCamera("in")} className="h-10 w-10 rounded-lg border border-cyan-900 bg-cyan-950/30 text-xl text-cyan-300 hover:bg-cyan-900/40" aria-label="Zoom in">+</button>
        <button data-testid="global-zoom-out" type="button" onClick={() => zoomCamera("out")} className="h-10 w-10 rounded-lg border border-slate-800 bg-slate-950/60 text-xl text-slate-300 hover:bg-slate-900" aria-label="Zoom out">−</button>
      </div>

      <aside className="absolute left-4 top-28 z-20 w-[290px] max-w-[calc(100vw-5rem)] space-y-3 md:left-6">
        <section className="rounded-2xl border border-cyan-950/80 bg-black/75 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.24em] text-slate-400">SATELLITE FILTERS</span><span className="text-[8px] text-slate-600">{filteredSatellites.length} OBJECTS</span></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search satellite..." className="mb-2 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-900" />
          <div className="grid grid-cols-4 gap-1">
            {providerFilters.map((item) => (
              <button key={item.id} type="button" onClick={() => setProvider(item.id)} className={`rounded-md border px-2 py-1.5 text-[8px] font-bold tracking-[.08em] ${provider === item.id ? "border-cyan-700 bg-cyan-950/40 text-cyan-300" : "border-slate-900 text-slate-600"}`}>{item.label}</button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-950/80 bg-black/75 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.24em] text-slate-400">LAYER BUS</span><span className="text-[8px] text-emerald-500">WIRED</span></div>
          <div className="flex flex-wrap gap-1.5">
            {SATELLITE_LAYERS.map((layer) => (
              <button key={layer.id} type="button" onClick={() => toggleLayer(layer.id)} className={`rounded-md border px-2 py-1.5 text-[8px] font-medium ${enabledLayers[layer.id] ? `${layerAccent[layer.id]} bg-white/[.04]` : "border-slate-900 text-slate-700"}`}>{layer.label}</button>
            ))}
          </div>
          <p className="mt-2 text-[8px] leading-relaxed text-slate-600">Global keeps one Street Map imagery layer. Satellite points and orbit overlays remain separate.</p>
        </section>
      </aside>

      <section className="absolute right-4 top-28 z-20 hidden w-[260px] md:right-20 md:block">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/75 p-4 backdrop-blur-xl">
          <p className="text-[8px] font-bold tracking-[.28em] text-cyan-500">GLOBAL PIPELINE</p>
          <div className="mt-3 space-y-2 text-[9px]">
            <div className="flex justify-between"><span className="text-slate-600">GLOBE</span><span className="text-emerald-400">READY</span></div>
            <div className="flex justify-between"><span className="text-slate-600">MAP</span><span className="text-cyan-400">ESRI STREET / OSM</span></div>
            <div className="flex justify-between"><span className="text-slate-600">MAP CACHE</span><span className="text-emerald-400">LOCAL-FIRST</span></div>
            <div className="flex justify-between"><span className="text-slate-600">ZOOM</span><span className="text-emerald-400">WHEEL + / −</span></div>
            <div className="flex justify-between"><span className="text-slate-600">SATELLITE IMAGERY</span><span className="text-slate-500">SEPARATE</span></div>
          </div>
        </div>
      </section>

      {selected && (
        <section className="absolute bottom-20 right-4 z-30 w-[285px] max-w-[calc(100vw-2rem)] rounded-2xl border border-cyan-900/80 bg-black/85 p-4 backdrop-blur-xl md:right-6">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold tracking-[.25em] text-cyan-500">SELECTED SATELLITE</p><h2 className="mt-1 text-lg font-semibold text-cyan-100">{selected.name}</h2><p className="text-[9px] text-slate-600">{selected.id} • NORAD {selected.noradId ?? "PENDING"}</p></div><button type="button" onClick={() => setSelectedId(null)} className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-500 hover:text-white">×</button></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            <div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">SOURCE</span><br /><span className="text-cyan-300">{selected.source}</span></div>
            <div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">MODE</span><br /><span className="text-amber-300">{selected.dataMode}</span></div>
            <div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">ALTITUDE</span><br /><span className="text-slate-300">{selected.altitudeKm.toLocaleString()} km</span></div>
            <div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">MISSION</span><br /><span className="text-slate-300">{selected.mission}</span></div>
          </div>
          <button type="button" onClick={() => focusSatellite(selected)} className="mt-3 w-full rounded-lg border border-cyan-900 bg-cyan-950/30 px-3 py-2 text-[9px] font-bold tracking-[.12em] text-cyan-300 hover:bg-cyan-950/50">FOCUS SATELLITE</button>
        </section>
      )}

      <footer className="absolute inset-x-0 bottom-4 z-20 px-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-cyan-950/80 bg-black/75 px-4 py-3 text-[8px] tracking-[.16em] backdrop-blur-xl">
          <span className="text-emerald-400">● CESIUM GLOBE</span>
          <span className="text-cyan-400">● STREET MAP</span>
          <span className="text-violet-400">● FILTER BUS WIRED</span>
          <span className="text-cyan-300">● WHEEL ZOOM</span>
          <span className="text-slate-500">● LIVE DATA OFF</span>
        </div>
      </footer>
    </main>
  );
}
