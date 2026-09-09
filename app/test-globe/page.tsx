"use client";

import { useEffect, useRef, useState } from "react";

type LayerMode = "map" | "satellite-labels" | "satellite-clean";

declare global {
  interface Window {
    Cesium?: any;
    CESIUM_BASE_URL?: string;
    __SENTINEL_TEST_GLOBE__?: {
      engine: "READY" | "ERROR";
      imagery: "OFF" | "LOADING" | "READY" | "ERROR";
      error?: string;
    };
  }
}

const CESIUM_VERSION = "1.145";
const ROADMAP_ASSET_ID = 3830184;
const SATELLITE_LABELS_ASSET_ID = 3830183;
const SATELLITE_CLEAN_ASSET_ID = 3830182;

const CESIUM_SCRIPT = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Cesium.js`;
const CESIUM_CSS = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Widgets/widgets.css`;
const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;

function loadCesium(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) return resolve(window.Cesium);
    window.CESIUM_BASE_URL = CESIUM_BASE_URL;

    if (!document.querySelector('link[data-cesium-css="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CESIUM_CSS;
      link.dataset.cesiumCss = "true";
      document.head.appendChild(link);
    }

    const existing = document.querySelector('script[data-cesium-script="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Cesium), { once: true });
      existing.addEventListener("error", () => reject(new Error("Cesium script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = CESIUM_SCRIPT;
    script.async = true;
    script.dataset.cesiumScript = "true";
    script.onload = () => window.Cesium ? resolve(window.Cesium) : reject(new Error("Cesium loaded but window.Cesium is unavailable"));
    script.onerror = () => reject(new Error("Failed to load CesiumJS"));
    document.head.appendChild(script);
  });
}

function setTestStatus(status: Window["__SENTINEL_TEST_GLOBE__"]): void {
  window.__SENTINEL_TEST_GLOBE__ = status;
}

export default function TestGlobePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const layersRef = useRef<Record<LayerMode, any>>({
    map: null,
    "satellite-labels": null,
    "satellite-clean": null,
  });
  const [engineState, setEngineState] = useState("BOOTING");
  const [imageryState, setImageryState] = useState("LOADING");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mode, setMode] = useState("SATELLITE + LABELS");

  useEffect(() => {
    let destroyed = false;

    async function createLayer(Cesium: any, viewer: any, mode: LayerMode) {
      if (layersRef.current[mode]) return layersRef.current[mode];

      const assetId = mode === "map" ? ROADMAP_ASSET_ID : mode === "satellite-labels" ? SATELLITE_LABELS_ASSET_ID : SATELLITE_CLEAN_ASSET_ID;
      const provider = await Cesium.IonImageryProvider.fromAssetId(assetId);
      const layer = viewer.imageryLayers.add(provider);
      layer.show = false;

      if (mode === "satellite-labels") {
        layer.brightness = 1.03;
        layer.contrast = 1.12;
        layer.saturation = 0.98;
      }

      layersRef.current[mode] = layer;
      return layer;
    }

    async function init() {
      try {
        setTestStatus({ engine: "ERROR", imagery: "LOADING" });
        const Cesium = await loadCesium();
        if (destroyed || !containerRef.current) return;

        const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
        if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;

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

        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.maximumScreenSpaceError = 0.5;
        viewer.scene.globe.tileCacheSize = 500;
        viewer.scene.globe.preloadSiblings = true;
        viewer.scene.globe.preloadAncestors = true;
        viewer.scene.globe.backFaceCulling = true;
        viewer.scene.globe.depthTestAgainstTerrain = false;
        viewer.scene.fog.enabled = false;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
        if (viewer.scene.sun) viewer.scene.sun.show = false;
        if (viewer.scene.moon) viewer.scene.moon.show = false;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        if (viewer.scene.postProcessStages?.fxaa) viewer.scene.postProcessStages.fxaa.enabled = true;
        viewer.resolutionScale = Math.min(Math.max(window.devicePixelRatio || 1, 1) * 1.5, 2.0);
        viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(35, 30, 19000000) });
        viewerRef.current = viewer;

        await Promise.all([
          createLayer(Cesium, viewer, "map"),
          createLayer(Cesium, viewer, "satellite-labels"),
          createLayer(Cesium, viewer, "satellite-clean"),
        ]);

        const initial = layersRef.current["satellite-labels"];
        initial.show = true;
        setEngineState("READY");
        setMode("SATELLITE + LABELS");
        setImageryState("READY");
        setTestStatus({ engine: "READY", imagery: "READY" });
        viewer.scene.requestRender();
      } catch (error) {
        if (destroyed) return;
        const message = error instanceof Error ? error.message : "Unknown Cesium error";
        setEngineState("ERROR");
        setImageryState("ERROR");
        setMode("ENGINE ERROR");
        setTestStatus({ engine: "ERROR", imagery: "ERROR", error: message });
        console.error("CESIUM_INIT_ERROR:", error);
      }
    }

    init();

    return () => {
      destroyed = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
      layersRef.current = { map: null, "satellite-labels": null, "satellite-clean": null };
    };
  }, []);

  const chooseMode = async (nextMode: LayerMode) => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;

    setImageryState("LOADING");
    try {
      const layer = layersRef.current[nextMode] || await (async () => {
        const assetId = nextMode === "map" ? ROADMAP_ASSET_ID : nextMode === "satellite-labels" ? SATELLITE_LABELS_ASSET_ID : SATELLITE_CLEAN_ASSET_ID;
        const created = viewer.imageryLayers.add(
          await Cesium.IonImageryProvider.fromAssetId(assetId),
        );
        created.show = false;
        layersRef.current[nextMode] = created;
        return created;
      })();

      Object.values(layersRef.current).forEach((item) => { if (item) item.show = false; });
      viewer.scene.globe.show = true;
      layer.show = true;

      if (nextMode === "satellite-labels") {
        layer.brightness = 1.03;
        layer.contrast = 1.12;
        layer.saturation = 0.98;
      }

      setMode(nextMode === "map" ? "MAP + CITY LABELS" : nextMode === "satellite-labels" ? "SATELLITE + CITY LABELS" : "SATELLITE CLEAN");
      setImageryState("READY");
      setTestStatus({ engine: "READY", imagery: "READY" });
      viewer.scene.requestRender();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Layer switch failed";
      setImageryState("ERROR");
      setTestStatus({ engine: "READY", imagery: "ERROR", error: message });
    }
  };

  const zoom = (direction: "in" | "out") => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    direction === "in" ? viewer.camera.zoomIn(1_500_000) : viewer.camera.zoomOut(1_500_000);
    setZoomLevel((value) => direction === "in" ? Math.min(180, value + 15) : Math.max(40, value - 15));
    viewer.scene.requestRender();
  };

  const resetView = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const Cesium = window.Cesium;
    viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(35, 30, 19000000) });
    setZoomLevel(100);
    viewer.scene.requestRender();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-slate-100">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,.12)_50%,rgba(0,0,0,.76)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900/92 px-4 py-3 shadow-lg backdrop-blur-xl">
          <div className="text-[9px] font-bold tracking-[.34em] text-cyan-400">SENTINEL TEST GLOBE</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">EARTH VISUAL TEST</h1>
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">CESIUMJS {CESIUM_VERSION} • 3 MAP MODES</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/92 px-3 py-2 text-[9px] font-bold tracking-[.14em] text-cyan-300 backdrop-blur-xl">{mode}</div>
      </header>

      <aside className="absolute left-4 top-28 z-20 w-[300px] max-w-[calc(100vw-2rem)] space-y-3 md:left-6">
        <section className="rounded-xl border border-gray-800 bg-gray-900/92 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[.22em] text-cyan-400">MAP SOURCES</span>
            <span className="text-[9px] text-slate-500">3 ONLINE</span>
          </div>
          <div className="space-y-2">
            <button type="button" onClick={() => void chooseMode("map")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200"><span>MAP + CITY LABELS</span><span className="text-cyan-400">MAP</span></button>
            <button type="button" onClick={() => void chooseMode("satellite-labels")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200"><span>SATELLITE + CITY LABELS</span><span className="text-emerald-400">HYBRID</span></button>
            <button type="button" onClick={() => void chooseMode("satellite-clean")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200"><span>SATELLITE CLEAN</span><span className="text-violet-400">SAT</span></button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/92 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 text-[10px] font-bold tracking-[.22em] text-slate-400">VIEW</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => zoom("out")} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-xs text-slate-400 hover:border-cyan-900">−</button>
            <button type="button" onClick={resetView} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-[9px] font-bold tracking-[.12em] text-slate-400 hover:border-cyan-900">RESET</button>
            <button type="button" onClick={() => zoom("in")} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-xs text-slate-400 hover:border-cyan-900">+</button>
          </div>
          <div className="mt-3 text-xs text-slate-500">ZOOM <span className="text-cyan-300">{zoomLevel}%</span> <span className="ml-3">{imageryState}</span></div>
        </section>
      </aside>

      <div className="absolute bottom-5 inset-x-4 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-gray-800 bg-gray-900/92 px-4 py-3 text-[8px] tracking-[.16em] backdrop-blur-xl">
          <span className="text-cyan-400">● MAP + LABELS</span>
          <span className="text-emerald-400">● SATELLITE + LABELS</span>
          <span className="text-violet-400">● SATELLITE CLEAN</span>
        </div>
      </div>
    </main>
  );
}
