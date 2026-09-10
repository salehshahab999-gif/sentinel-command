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
const ROADMAP_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer";
const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
const LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer";

const CESIUM_SCRIPT = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Cesium.js`;
const CESIUM_CSS = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Widgets/widgets.css`;
const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;

function loadCesium(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) {
      resolve(window.Cesium);
      return;
    }

    window.CESIUM_BASE_URL = CESIUM_BASE_URL;

    if (!document.querySelector('link[data-cesium-css="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CESIUM_CSS;
      link.dataset.cesiumCss = "true";
      document.head.appendChild(link);
    }

    const existing = document.querySelector(
      'script[data-cesium-script="true"]',
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(window.Cesium),
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("Cesium script failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = CESIUM_SCRIPT;
    script.async = true;
    script.dataset.cesiumScript = "true";

    script.onload = () => {
      if (!window.Cesium) {
        reject(new Error("Cesium loaded but window.Cesium is unavailable"));
        return;
      }
      resolve(window.Cesium);
    };

    script.onerror = () => reject(new Error("Failed to load CesiumJS"));
    document.head.appendChild(script);
  });
}

function setTestStatus(status: Window["__SENTINEL_TEST_GLOBE__"]): void {
  window.__SENTINEL_TEST_GLOBE__ = status;
}

function createArcGisProvider(
  Cesium: any,
  url: string,
  credit: string,
): any {
  return new Cesium.ArcGisMapServerImageryProvider({
    url,
    credit,
  });
}

function modeLabel(mode: LayerMode): string {
  if (mode === "map") return "MAP + CITY LABELS";
  if (mode === "satellite-labels") return "SATELLITE + CITY LABELS";
  return "SATELLITE CLEAN";
}

export default function TestGlobePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const inputHandlerRef = useRef<any>(null);
  const zoomControllerRef = useRef<any>(null);
  const activeLayersRef = useRef<any[]>([]);
  const switchingRef = useRef(false);

  const [engineState, setEngineState] = useState("BOOTING");
  const [imageryState, setImageryState] = useState("LOADING");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mode, setMode] = useState(modeLabel("satellite-labels"));

  const removeActiveLayers = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    for (const layer of activeLayersRef.current) {
      viewer.imageryLayers.remove(layer, true);
    }

    activeLayersRef.current = [];
  };

  const createModeLayers = (
    Cesium: any,
    viewer: any,
    nextMode: LayerMode,
  ) => {
    removeActiveLayers();

    const layers: any[] = [];

    if (nextMode === "map") {
      layers.push(
        viewer.imageryLayers.addImageryProvider(
          createArcGisProvider(
            Cesium,
            ROADMAP_URL,
            "© Esri © HERE © Garmin © USGS © OpenStreetMap contributors",
          ),
        ),
      );
    } else {
      const imageryLayer = viewer.imageryLayers.addImageryProvider(
        createArcGisProvider(
          Cesium,
          SATELLITE_URL,
          "© Esri Maxar Earthstar Geographics and the GIS User Community",
        ),
      );
      imageryLayer.brightness = 1.03;
      imageryLayer.contrast = 1.08;
      imageryLayer.saturation = 0.98;
      layers.push(imageryLayer);

      if (nextMode === "satellite-labels") {
        layers.push(
          viewer.imageryLayers.addImageryProvider(
            createArcGisProvider(
              Cesium,
              LABELS_URL,
              "© Esri",
            ),
          ),
        );
      }
    }

    for (const layer of layers) layer.show = true;
    activeLayersRef.current = layers;
    viewer.scene.requestRender();
    return layers;
  };

  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        setTestStatus({ engine: "ERROR", imagery: "LOADING" });
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
        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.maximumScreenSpaceError = 0.75;
        viewer.scene.globe.tileCacheSize = 300;
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
        if (viewer.scene.postProcessStages?.fxaa) {
          viewer.scene.postProcessStages.fxaa.enabled = true;
        }
        viewer.resolutionScale = Math.min(
          Math.max(window.devicePixelRatio || 1, 1),
          1.5,
        );

        const baseController = viewer.scene.screenSpaceCameraController;
        baseController.enableZoom = false;
        baseController.minimumZoomDistance = 150;
        baseController.maximumZoomDistance = 40_000_000;
        baseController.enableCollisionDetection = false;

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
        zoomControllerRef.current = zoomController;

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(35, 30, 19_000_000),
        });

        inputHandlerRef.current = new Cesium.ScreenSpaceEventHandler(
          viewer.scene.canvas,
        );

        inputHandlerRef.current.setInputAction(
          (movement: any) => {
            const ray = viewer.camera.getPickRay(movement.position);
            const cartesian = ray
              ? viewer.scene.globe.pick(ray, viewer.scene)
              : undefined;
            if (!cartesian) return;

            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const height = Math.max(
              viewer.camera.positionCartographic.height,
              12_000,
            );
            const targetHeight = Math.min(
              Math.max(height * 0.38, 1_200),
              1_800_000,
            );

            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude,
                targetHeight,
              ),
              duration: 0.55,
              maximumHeight: Math.min(
                Math.max(height * 1.1, 500_000),
                18_000_000,
              ),
            });
          },
          Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
        );

        createModeLayers(Cesium, viewer, "satellite-labels");
        setEngineState("READY");
        setMode(modeLabel("satellite-labels"));
        setImageryState("READY");
        setTestStatus({ engine: "READY", imagery: "READY" });
        viewer.scene.requestRender();
      } catch (error) {
        if (destroyed) return;
        const message =
          error instanceof Error ? error.message : "Unknown Cesium error";
        setEngineState("ERROR");
        setImageryState("ERROR");
        setMode("ENGINE ERROR");
        setTestStatus({
          engine: "ERROR",
          imagery: "ERROR",
          error: message,
        });
        console.error("CESIUM_INIT_ERROR:", error);
      }
    }

    void init();

    return () => {
      destroyed = true;
      inputHandlerRef.current?.destroy?.();
      inputHandlerRef.current = null;

      if (
        zoomControllerRef.current &&
        viewerRef.current &&
        !viewerRef.current.isDestroyed()
      ) {
        viewerRef.current.removeController(zoomControllerRef.current);
      }

      zoomControllerRef.current = null;
      activeLayersRef.current = [];
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
    };
  }, []);

  const chooseMode = (nextMode: LayerMode) => {
    if (switchingRef.current) return;

    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;

    switchingRef.current = true;
    setImageryState("LOADING");

    try {
      createModeLayers(Cesium, viewer, nextMode);
      setMode(modeLabel(nextMode));
      setImageryState("READY");
      setTestStatus({ engine: "READY", imagery: "READY" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Layer switch failed";
      setImageryState("ERROR");
      setTestStatus({ engine: "READY", imagery: "ERROR", error: message });
    } finally {
      switchingRef.current = false;
      viewer.scene.requestRender();
    }
  };

  const zoom = (direction: "in" | "out") => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (direction === "in") {
      viewer.camera.zoomIn(1_000_000);
      setZoomLevel((value) => Math.min(220, value + 15));
    } else {
      viewer.camera.zoomOut(1_000_000);
      setZoomLevel((value) => Math.max(40, value - 15));
    }

    viewer.scene.requestRender();
  };

  const resetView = () => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(35, 30, 19_000_000),
    });
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
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">CESIUMJS {CESIUM_VERSION} • 3 API-KEY-FREE MODES</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/92 px-3 py-2 text-[9px] font-bold tracking-[.14em] text-cyan-300 backdrop-blur-xl">{mode}</div>
      </header>

      <aside className="absolute left-4 top-28 z-20 w-[300px] max-w-[calc(100vw-2rem)] space-y-3 md:left-6">
        <section className="rounded-xl border border-gray-800 bg-gray-900/92 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[.22em] text-cyan-400">MAP SOURCES</span>
            <span className="text-[9px] text-slate-500">ARCGIS ONLINE</span>
          </div>
          <div className="space-y-2">
            <button data-testid="global-mode-map" type="button" onClick={() => chooseMode("map")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200"><span>MAP + CITY LABELS</span><span className="text-cyan-400">MAP</span></button>
            <button data-testid="global-mode-satellite-labels" type="button" onClick={() => chooseMode("satellite-labels")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200"><span>SATELLITE + CITY LABELS</span><span className="text-emerald-400">HYBRID</span></button>
            <button data-testid="global-mode-satellite-clean" type="button" onClick={() => chooseMode("satellite-clean")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200"><span>SATELLITE CLEAN</span><span className="text-violet-400">SAT</span></button>
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
