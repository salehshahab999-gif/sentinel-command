"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SATELLITE_LAYERS, SKELETON_SATELLITES } from "../../core/satellite/satellite-catalog";
import type { SatelliteLayerId, SatelliteRecord } from "../../core/satellite/satellite-contracts";
import type { MapSearchResult } from "../../core/map/map-search";
import { filterUniversalMapTargets, type UniversalMapFilter, type UniversalMapTarget } from "../../core/map/universal-filter";

const CESIUM_VERSION = "1.145";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

type ProviderFilter = "ALL" | "COPERNICUS" | "NASA" | "NOAA";

declare global {
  interface Window { Cesium?: any; }
}

const providerFilters: Array<{ id: ProviderFilter; label: string }> = [
  { id: "ALL", label: "ALL" },
  { id: "COPERNICUS", label: "COPERNICUS" },
  { id: "NASA", label: "NASA" },
  { id: "NOAA", label: "NOAA" },
];

const layerGroups: Array<{ id: SatelliteLayerId; label: string }> = [
  { id: "baseMap", label: "BASE MAP" },
  { id: "satellites", label: "SATELLITES" },
  { id: "orbits", label: "ORBITS" },
  { id: "fires", label: "NASA FIRES" },
  { id: "weather", label: "WEATHER" },
  { id: "clouds", label: "CLOUDS" },
  { id: "ocean", label: "OCEAN" },
  { id: "ais", label: "AIS / SHIPS" },
  { id: "geography", label: "GEOGRAPHY" },
  { id: "events", label: "EVENTS" },
  { id: "alerts", label: "ALERTS" },
];

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
    speedKmH: satellite.speedKmH ?? (satellite.speedKmS !== undefined ? satellite.speedKmS * 3600 : undefined),
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
  const baseLayerRef = useRef<any>(null);
  const clickHandlerRef = useRef<any>(null);

  const [cesiumReady, setCesiumReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState<ProviderFilter>("ALL");
  const [universalFilter, setUniversalFilter] = useState<UniversalMapFilter>({});
  const [enabledLayers, setEnabledLayers] = useState<Record<SatelliteLayerId, boolean>>(
    () => Object.fromEntries(SATELLITE_LAYERS.map((layer) => [layer.id, layer.defaultEnabled])) as Record<SatelliteLayerId, boolean>,
  );
  const [runtimeStatus, setRuntimeStatus] = useState("POWERED / LIVE OFF");

  const selected = useMemo(() => SKELETON_SATELLITES.find((satellite) => satellite.id === selectedId) ?? null, [selectedId]);

  const filteredSatellites = useMemo(() => {
    const query = search.trim().toLowerCase();
    const candidates = SKELETON_SATELLITES.filter((satellite) => {
      const matchesProvider = provider === "ALL" || satellite.source === provider;
      const haystack = `${satellite.name} ${satellite.id} ${satellite.operator ?? ""} ${satellite.mission ?? ""}`.toLowerCase();
      return matchesProvider && (!query || haystack.includes(query));
    });
    const targets = candidates.map(satelliteToMapTarget);
    const visibleIds = new Set(filterUniversalMapTargets(targets, universalFilter).map((target) => target.id));
    return candidates.filter((satellite) => visibleIds.has(satellite.id));
  }, [provider, search, universalFilter]);

  const requestRender = useCallback(() => { viewerRef.current?.scene?.requestRender?.(); }, []);

  const syncLayers = useCallback((layers: Record<SatelliteLayerId, boolean>) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (baseLayerRef.current) baseLayerRef.current.show = layers.baseMap;
    if (pointsRef.current) pointsRef.current.show = layers.satellites;
    if (orbitCollectionRef.current) orbitCollectionRef.current.show = layers.orbits;
    requestRender();
  }, [requestRender]);

  useEffect(() => { syncLayers(enabledLayers); }, [enabledLayers, syncLayers]);

  useEffect(() => {
    if (!cesiumReady || !containerRef.current || viewerRef.current || !window.Cesium) return;
    const Cesium = window.Cesium;
    setRuntimeStatus("POWERING GLOBE / MAP LOCAL-FIRST / LIVE OFF");

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false,
      navigationHelpButton: false, animation: false, timeline: false, fullscreenButton: false,
      vrButton: false, infoBox: false, selectionIndicator: false, scene3DOnly: true,
      shouldAnimate: false, requestRenderMode: true, maximumRenderTimeChange: Number.POSITIVE_INFINITY,
      baseLayer: false,
    });
    viewerRef.current = viewer;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#01060a");
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#061116");
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.postProcessStages.fxaa.enabled = true;

    if (enabledLayers.baseMap) {
      const localFirstProvider = new Cesium.UrlTemplateImageryProvider({ url: "/api/map/tile/{z}/{x}/{y}.png", maximumLevel: 19, credit: "© OpenStreetMap contributors" });
      baseLayerRef.current = viewer.imageryLayers.add(new Cesium.ImageryLayer(localFirstProvider));
    }

    const points = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
    points.blendOption = Cesium.BlendOption.TRANSLUCENT;
    pointsRef.current = points;
    const orbitCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
    orbitCollectionRef.current = orbitCollection;

    for (const satellite of SKELETON_SATELLITES) {
      const point = points.add({
        id: satellite.id,
        position: Cesium.Cartesian3.fromDegrees(satellite.longitude, satellite.latitude, satellite.altitudeKm * 1000),
        pixelSize: 8,
        color: providerColor(Cesium, satellite.source),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(4.0e6, 1.6, 4.0e7, 0.55),
      });
      point._sentinelSatelliteId = satellite.id;
      const orbit = orbitCollection.add({ positions: buildOrbit(Cesium, satellite), width: 1.2, material: Cesium.Material.fromType("Color", { color: providerColor(Cesium, satellite.source).withAlpha(0.34) }) });
      orbit._sentinelSatelliteId = satellite.id;
    }

    clickHandlerRef.current = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    clickHandlerRef.current.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position);
      const id = picked?.primitive?._sentinelSatelliteId ?? picked?.id;
      if (typeof id === "string") setSelectedId(id);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(35, 25, 17000000), orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-58), roll: 0 } });
    viewer.scene.requestRender();
    setRuntimeStatus("CESIUM 3D READY / UNIVERSAL FILTER / LIVE OFF");

    return () => {
      clickHandlerRef.current?.destroy?.();
      clickHandlerRef.current = null;
      if (viewerRef.current) { viewerRef.current.destroy(); viewerRef.current = null; }
      pointsRef.current = null; orbitCollectionRef.current = null; baseLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cesiumReady]);

  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;
    const visible = new Set(filteredSatellites.map((satellite) => satellite.id));
    for (let i = 0; i < points.length; i += 1) {
      const point = points.get(i);
      const satelliteId = point._sentinelSatelliteId ?? point.id;
      point.show = enabledLayers.satellites && visible.has(satelliteId);
      point.pixelSize = selectedId && satelliteId === selectedId ? 13 : 8;
    }
    requestRender();
  }, [enabledLayers.satellites, filteredSatellites, requestRender, selectedId]);

  useEffect(() => {
    const handleMapFocus = (event: Event) => {
      const result = (event as CustomEvent<MapSearchResult>).detail;
      const viewer = viewerRef.current; const Cesium = window.Cesium;
      if (!viewer || !Cesium || !result) return;
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(result.longitude, result.latitude, 1200000), duration: 0.9 });
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

  const toggleLayer = (id: SatelliteLayerId) => setEnabledLayers((current) => ({ ...current, [id]: !current[id] }));
  const focusSatellite = (satellite: SatelliteRecord) => {
    const viewer = viewerRef.current; const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;
    setSelectedId(satellite.id);
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(satellite.longitude, satellite.latitude, Math.max(2500000, satellite.altitudeKm * 5000)), duration: 0.9 });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#01060a] text-white">
      <link rel="stylesheet" href={`${CESIUM_BASE}/Widgets/widgets.css`} />
      <Script id="sentinel-cesium" src={`${CESIUM_BASE}/Cesium.js`} strategy="afterInteractive" onLoad={() => setCesiumReady(true)} onError={() => setRuntimeStatus("CESIUM LOAD ERROR")} />
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(0,0,0,.08)_42%,rgba(0,0,0,.58)_100%)]" />
      <div className="pointer-events-none absolute inset-0 border border-cyan-950/30" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 md:p-5">
        <div className="rounded-xl border border-cyan-950/80 bg-black/70 px-3 py-2 backdrop-blur-xl md:px-4 md:py-3">
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.32em] text-cyan-400"><span className="h-2 w-2 rounded-full bg-cyan-400" />SENTINEL COMMAND CENTER</div>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-100 md:text-2xl">GLOBAL INTELLIGENCE / SPACE</h1>
          <p className="mt-1 text-[9px] tracking-[0.16em] text-slate-500">REAL 3D GLOBE • LOCAL-FIRST MAP • UNIVERSAL FILTER • LIVE COLLECTORS OFF</p>
        </div>
        <div className="rounded-full border border-emerald-900/80 bg-black/70 px-3 py-2 text-[9px] font-bold tracking-[0.16em] text-emerald-300 backdrop-blur-xl">{runtimeStatus}</div>
      </header>

      <section className="absolute left-3 top-24 z-20 w-[250px] rounded-xl border border-cyan-950/80 bg-black/72 p-3 shadow-2xl backdrop-blur-xl md:left-5 md:w-[285px]">
        <div className="flex items-center justify-between"><p className="text-[9px] font-bold tracking-[0.28em] text-slate-500">SATELLITE QUERY</p><span className="text-[8px] text-cyan-500">{filteredSatellites.length}/{SKELETON_SATELLITES.length}</span></div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search satellite / mission..." className="mt-2 w-full rounded-lg border border-slate-800 bg-black/60 px-3 py-2 text-[10px] text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-800" />
        <div className="mt-2 grid grid-cols-4 gap-1">{providerFilters.map((item) => <button key={item.id} type="button" onClick={() => setProvider(item.id)} className={`rounded-md border px-1 py-1.5 text-[8px] font-bold tracking-[0.08em] ${provider === item.id ? "border-cyan-700 bg-cyan-950/50 text-cyan-300" : "border-slate-900 text-slate-600"}`}>{item.label}</button>)}</div>
        <div className="mt-3 max-h-40 space-y-1 overflow-auto pr-1">{filteredSatellites.map((satellite) => <button key={satellite.id} type="button" onClick={() => focusSatellite(satellite)} className={`flex w-full items-center justify-between rounded-lg border px-2 py-2 text-left ${selectedId === satellite.id ? "border-cyan-700 bg-cyan-950/40" : "border-slate-900 bg-white/[0.015]"}`}><span className="min-w-0"><span className="block truncate text-[10px] font-medium text-slate-200">{satellite.name}</span><span className="block truncate text-[8px] text-slate-600">{satellite.source} • {satellite.mission}</span></span><span className="ml-2 h-2 w-2 shrink-0 rounded-full" style={{ background: satellite.source === "COPERNICUS" ? "#22d3ee" : satellite.source === "NASA" ? "#84cc16" : "#fb923c" }} /></button>)}</div>
      </section>

      <section className="absolute right-3 top-24 z-20 w-[210px] rounded-xl border border-cyan-950/80 bg-black/72 p-3 shadow-2xl backdrop-blur-xl md:right-5 md:w-[245px]">
        <div className="flex items-center justify-between"><p className="text-[9px] font-bold tracking-[0.28em] text-slate-500">SYSTEM LAYERS</p><span className="text-[8px] text-slate-600">{Object.values(enabledLayers).filter(Boolean).length} ON</span></div>
        <div className="mt-2 space-y-1">{layerGroups.map((layer) => <button key={layer.id} type="button" onClick={() => toggleLayer(layer.id)} className={`flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-[8px] font-bold tracking-[0.1em] ${enabledLayers[layer.id] ? "border-cyan-900 bg-cyan-950/30 text-cyan-300" : "border-slate-900 text-slate-700"}`}><span>{layer.label}</span><span className={`h-1.5 w-1.5 rounded-full ${enabledLayers[layer.id] ? "bg-cyan-400" : "bg-slate-800"}`} /></button>)}</div>
      </section>

      {selected && <aside className="absolute bottom-4 left-4 z-20 w-[285px] rounded-xl border border-cyan-900/80 bg-black/78 p-3 shadow-2xl backdrop-blur-xl md:left-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold tracking-[0.25em] text-cyan-500">SELECTED SATELLITE</p><h2 className="mt-1 text-base font-semibold text-cyan-100">{selected.name}</h2></div><button type="button" onClick={() => setSelectedId(null)} className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-500">×</button></div><div className="mt-2 grid grid-cols-2 gap-1.5 text-[8px]"><div className="rounded-md bg-white/[0.03] p-2"><span className="text-slate-600">SOURCE</span><br /><span className="text-cyan-300">{selected.source}</span></div><div className="rounded-md bg-white/[0.03] p-2"><span className="text-slate-600">NORAD</span><br /><span className="text-slate-300">{selected.noradId ?? "PENDING"}</span></div><div className="rounded-md bg-white/[0.03] p-2"><span className="text-slate-600">ALTITUDE</span><br /><span className="text-slate-300">{selected.altitudeKm.toLocaleString()} km</span></div><div className="rounded-md bg-white/[0.03] p-2"><span className="text-slate-600">MODE</span><br /><span className="text-amber-300">{selected.dataMode}</span></div></div></aside>}

      <footer className="absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-cyan-950/80 bg-black/70 px-3 py-2 text-[8px] font-bold tracking-[0.14em] backdrop-blur-xl md:inset-x-5"><span className="text-emerald-400">● CESIUM 3D READY</span><span className="text-cyan-400">● MAP LOCAL-FIRST</span><span className="text-cyan-400">● UNIVERSAL FILTER</span><span className="text-violet-400">● ORBIT ENGINE OFF</span><span className="text-amber-400">● LIVE POWER OFF</span><span className="text-slate-500">● © OpenStreetMap contributors</span></footer>
    </main>
  );
}
