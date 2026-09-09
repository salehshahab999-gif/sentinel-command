"use client";

import { useEffect, useRef, useState } from "react";

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
const SATELLITE_ASSET_ID = 3830183;
const ROADMAP_ASSET_ID = 3830184;
const LABELS_ASSET_ID = 3830185;
const SATELLITE_PLAIN_ASSET_ID = 3830182;

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
    script.onload = () => window.Cesium
      ? resolve(window.Cesium)
      : reject(new Error("Cesium loaded but window.Cesium is unavailable"));
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
  const currentLayerRef = useRef<any>(null);
  const googleTilesetRef = useRef<any>(null);
  const [engineState, setEngineState] = useState("BOOTING");
  const [imageryState, setImageryState] = useState("LOADING");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mode, setMode] = useState("SATELLITE + LABELS");

  async function switchImagery(Cesium: any, viewer: any, nextMode: "satellite" | "map" | "labels" | "satellite-plain") {
    try {
      if (currentLayerRef.current) {
        viewer.imageryLayers.remove(currentLayerRef.current, true);
        currentLayerRef.current = null;
      }

      const assetId =
        nextMode === "map"
          ? ROADMAP_ASSET_ID
          : nextMode === "labels"
            ? LABELS_ASSET_ID
            : nextMode === "satellite-plain"
              ? SATELLITE_PLAIN_ASSET_ID
              : SATELLITE_ASSET_ID;

      const layer = Cesium.ImageryLayer.fromProviderAsync(
        Cesium.IonImageryProvider.fromAssetId(assetId),
        {
          brightness: nextMode === "map" ? 1.0 : 1.03,
          contrast: nextMode === "map" ? 1.02 : 1.12,
          saturation: nextMode === "map" ? 1.0 : 0.98,
          gamma: 1.0,
        },
      );

      currentLayerRef.current = viewer.imageryLayers.add(layer);
      viewer.scene.requestRender();

      if (nextMode === "map") setMode("ROADMAP");
      else if (nextMode === "labels") setMode("LABELS ONLY");
      else if (nextMode === "satellite-plain") setMode("SATELLITE");
      else setMode("SATELLITE + LABELS");

      setImageryState("READY");
      setTestStatus({ engine: "READY", imagery: "READY" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Imagery switch failed";
      setImageryState("ERROR");
      setTestStatus({ engine: "READY", imagery: "ERROR", error: message });
      console.error("IMAGERY_SWITCH_ERROR:", error);
    }
  }

  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        setTestStatus({ engine: "ERROR", imagery: "LOADING" });
        const Cesium = await loadCesium();
        if (destroyed || !containerRef.current) return;

        const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
        const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;
        if (googleKey && Cesium.GoogleMaps) Cesium.GoogleMaps.defaultApiKey = googleKey;

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
        viewer.scene.globe.maximumScreenSpaceError = 0.35;
        viewer.scene.globe.tileCacheSize = 400;
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
        setEngineState("READY");

        if (!googleKey) {
          setMode("SATELLITE + LABELS");
          await switchImagery(Cesium, viewer, "satellite");
          return;
        }

        try {
          setMode("GOOGLE 3D");
          const tileset = await Cesium.createGooglePhotorealistic3DTileset({
            key: googleKey,
            usingOnlyWithGoogleGeocoder: true,
          });
          if (destroyed) {
            tileset.destroy?.();
            return;
          }

          tileset.showCreditsOnScreen = true;
          tileset.maximumScreenSpaceError = 1.0;
          tileset.preloadFlightDestinations = true;
          googleTilesetRef.current = viewer.scene.primitives.add(tileset);
          setImageryState("READY");
          setTestStatus({ engine: "READY", imagery: "READY" });
          viewer.scene.requestRender();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Google Photorealistic 3D Tiles failed";
          console.warn("GOOGLE_PHOTOREALISTIC_3D_ERROR:", error);
          viewer.scene.globe.show = true;
          setMode("SATELLITE + LABELS");
          setTestStatus({ engine: "READY", imagery: "LOADING", error: message });
          await switchImagery(Cesium, viewer, "satellite");
        }
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
      googleTilesetRef.current?.destroy?.();
      googleTilesetRef.current = null;
      currentLayerRef.current = null;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

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

  const chooseMode = (nextMode: "satellite" | "map" | "labels" | "satellite-plain") => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;
    if (googleTilesetRef.current) {
      googleTilesetRef.current.show = false;
      viewer.scene.globe.show = true;
    }
    void switchImagery(Cesium, viewer, nextMode);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-slate-100">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,.12)_50%,rgba(0,0,0,.76)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/72 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[.34em] text-cyan-400">
            <span className={`h-2 w-2 rounded-full ${engineState === "READY" ? "animate-pulse bg-emerald-400" : "animate-pulse bg-amber-400"}`} />
            SENTINEL TEST GLOBE
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">EARTH VISUAL TEST</h1>
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">CESIUMJS {CESIUM_VERSION} • SATELLITE / MAP / LABELS / GOOGLE 3D</p>
        </div>

        <div className="rounded-full border border-emerald-900/80 bg-black/72 px-3 py-2 text-[9px] font-bold tracking-[.16em] text-emerald-300 backdrop-blur-xl">
          ENGINE {engineState} • {mode}
        </div>
      </header>

      <aside className="absolute left-4 top-28 z-20 w-[300px] max-w-[calc(100vw-2rem)] space-y-3 md:left-6">
        <section className="rounded-2xl border border-cyan-950/80 bg-black/72 p-3 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[9px] font-bold tracking-[.24em] text-slate-400">MAP LAYERS</span>
            <span className="text-[8px] text-cyan-500">SWITCH</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => chooseMode("satellite")} className="rounded-lg border border-cyan-900/60 bg-cyan-950/20 py-2 text-[9px] font-bold tracking-[.1em] text-cyan-200 hover:bg-cyan-900/30">SATELLITE + TEXT</button>
            <button type="button" onClick={() => chooseMode("satellite-plain")} className="rounded-lg border border-slate-800 bg-black/30 py-2 text-[9px] font-bold tracking-[.1em] text-slate-300 hover:border-cyan-900">SATELLITE</button>
            <button type="button" onClick={() => chooseMode("map")} className="rounded-lg border border-slate-800 bg-black/30 py-2 text-[9px] font-bold tracking-[.1em] text-slate-300 hover:border-cyan-900">MAP / ROAD</button>
            <button type="button" onClick={() => chooseMode("labels")} className="rounded-lg border border-slate-800 bg-black/30 py-2 text-[9px] font-bold tracking-[.1em] text-slate-300 hover:border-cyan-900">TEXT / LABELS</button>
          </div>
        </section>

        <section className="rounded-2xl border border-violet-950/80 bg-black/72 p-3 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[9px] font-bold tracking-[.24em] text-slate-400">VISUAL TEST</span>
            <span className="text-[8px] text-violet-400">3D CAMERA</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => zoom("out")} className="rounded-lg border border-slate-800 bg-black/30 py-2 text-xs text-slate-400 hover:border-cyan-900 hover:text-cyan-200">−</button>
            <button type="button" onClick={resetView} className="rounded-lg border border-slate-800 bg-black/30 py-2 text-[9px] font-bold tracking-[.12em] text-slate-400 hover:border-cyan-900 hover:text-cyan-200">RESET</button>
            <button type="button" onClick={() => zoom("in")} className="rounded-lg border border-slate-800 bg-black/30 py-2 text-xs text-slate-400 hover:border-cyan-900 hover:text-cyan-200">+</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            <div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">ZOOM</span><br /><span className="text-cyan-300">{zoomLevel}%</span></div>
            <div className="rounded-lg bg-white/[.035] p-2"><span className="text-slate-600">DATA</span><br /><span className={imageryState === "READY" ? "text-emerald-300" : imageryState === "ERROR" ? "text-red-300" : "text-amber-300"}>{imageryState}</span></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-900 bg-black/72 p-3 backdrop-blur-xl text-[9px]">
          <div className="flex justify-between"><span className="text-slate-600">GLOBAL</span><span className="text-slate-300">EARTH</span></div>
          <div className="flex justify-between"><span className="text-slate-600">ZOOM</span><span className="text-cyan-300">CITY / BUILDING</span></div>
          <div className="flex justify-between"><span className="text-slate-600">BACKGROUND</span><span className="text-slate-300">BLACK</span></div>
        </section>
      </aside>

      <div className="absolute bottom-5 inset-x-4 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-cyan-950/80 bg-black/72 px-4 py-3 text-[8px] tracking-[.16em] backdrop-blur-xl">
          <span className="text-emerald-400">● CESIUM READY</span>
          <span className="text-cyan-400">● SATELLITE + LABELS</span>
          <span className="text-violet-400">● MAP / ROAD</span>
          <span className="text-slate-500">● DB DISCONNECTED</span>
        </div>
      </div>
    </main>
  );
}
