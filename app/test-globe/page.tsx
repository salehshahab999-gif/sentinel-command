"use client";

import { useEffect, useRef, useState } from "react";

type LayerMode = "map" | "satellite-labels" | "satellite-clean";

type TestStatus = {
  engine: "READY" | "ERROR";
  imagery: "OFF" | "LOADING" | "READY" | "ERROR";
  error?: string;
};

declare global {
  interface Window {
    Cesium?: any;
    CESIUM_BASE_URL?: string;
    __SENTINEL_TEST_GLOBE__?: TestStatus;
  }
}

const CESIUM_VERSION = "1.145";
const STREET_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const IMAGERY_TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_MAX_LEVEL = 20;
const IMAGERY_MAX_LEVEL = 20;

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
    script.onload = () =>
      window.Cesium
        ? resolve(window.Cesium)
        : reject(
            new Error("Cesium loaded but window.Cesium is unavailable"),
          );
    script.onerror = () =>
      reject(new Error("Failed to load CesiumJS"));
    document.head.appendChild(script);
  });
}

function setTestStatus(status: TestStatus): void {
  window.__SENTINEL_TEST_GLOBE__ = status;
}

function createRasterProvider(
  Cesium: any,
  url: string,
  maximumLevel: number,
  credit: string,
): any {
  return new Cesium.UrlTemplateImageryProvider({
    url,
    maximumLevel,
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    credit,
  });
}

export default function TestGlobePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const inputHandlerRef = useRef<any>(null);
  const zoomControllerRef = useRef<any>(null);
  const layersRef = useRef<{
    map: any;
    imagery: any;
    labels: any;
  }>({
    map: null,
    imagery: null,
    labels: null,
  });

  const [engineState, setEngineState] = useState("BOOTING");
  const [imageryState, setImageryState] = useState("LOADING");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mode, setMode] = useState("SATELLITE + CITY LABELS");

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

        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.maximumScreenSpaceError = 1.0;
        viewer.scene.globe.tileCacheSize = 300;
        viewer.scene.globe.preloadSiblings = true;
        viewer.scene.globe.preloadAncestors = true;
        viewer.scene.globe.backFaceCulling = true;
        viewer.scene.globe.depthTestAgainstTerrain = false;
        viewer.scene.fog.enabled = false;
        viewer.scene.skyAtmosphere.show = false;
        viewer.scene.skyBox.show = false;
        viewer.scene.sun.show = false;
        viewer.scene.moon.show = false;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        viewer.scene.postProcessStages.fxaa.enabled = true;
        viewer.resolutionScale = Math.min(
          Math.max(window.devicePixelRatio || 1, 1) * 1.25,
          1.75,
        );

        const controller = viewer.scene.screenSpaceCameraController;
        controller.enableCollisionDetection = false;
        controller.minimumZoomDistance = 300;
        controller.maximumZoomDistance = 40000000;
        controller.enableZoom = false;

        const zoomController = new Cesium.ScreenSpaceZoomCameraController();
        zoomController.usePointerPosition = true;
        zoomController.zoomSensitivity = 0.095;
        zoomController.zoomDistanceRatio = 0.28;
        zoomController.maximumZoomVelocity = 1.15;
        zoomController.dampingEnabled = true;
        zoomController.inertiaEnabled = true;
        zoomController.inertialDecay = 7.5;
        zoomController.zoomAnimationDuration = 0.28;
        viewer.addController(zoomController);
        zoomControllerRef.current = zoomController;

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(35, 30, 19000000),
        });

        const mapLayer = viewer.imageryLayers.addImageryProvider(
          createRasterProvider(
            Cesium,
            STREET_TILE_URL,
            STREET_MAX_LEVEL,
            "Esri World Street Map / OpenStreetMap contributors",
          ),
        );

        const imageryLayer = viewer.imageryLayers.addImageryProvider(
          createRasterProvider(
            Cesium,
            IMAGERY_TILE_URL,
            IMAGERY_MAX_LEVEL,
            "Esri World Imagery",
          ),
        );

        const labelsLayer = viewer.imageryLayers.addImageryProvider(
          createRasterProvider(
            Cesium,
            STREET_TILE_URL,
            STREET_MAX_LEVEL,
            "Esri World Street Map labels",
          ),
        );

        mapLayer.show = false;
        imageryLayer.show = true;
        labelsLayer.show = true;
        labelsLayer.alpha = 0.42;

        layersRef.current = {
          map: mapLayer,
          imagery: imageryLayer,
          labels: labelsLayer,
        };

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
              12000,
            );
            const targetHeight = Math.min(
              Math.max(height * 0.38, 1200),
              1800000,
            );

            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude,
                targetHeight,
              ),
              duration: 0.55,
            });
          },
          Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
        );

        viewerRef.current = viewer;
        setEngineState("READY");
        setImageryState("READY");
        setMode("SATELLITE + CITY LABELS");
        setTestStatus({ engine: "READY", imagery: "READY" });
        viewer.scene.requestRender();
      } catch (error) {
        if (destroyed) return;
        const message =
          error instanceof Error ? error.message : "Unknown Cesium error";
        setEngineState("ERROR");
        setImageryState("ERROR");
        setMode("ENGINE ERROR");
        setTestStatus({ engine: "ERROR", imagery: "ERROR", error: message });
        console.error("CESIUM_INIT_ERROR:", error);
      }
    }

    void init();

    return () => {
      destroyed = true;
      inputHandlerRef.current?.destroy();
      inputHandlerRef.current = null;

      if (
        zoomControllerRef.current &&
        viewerRef.current &&
        !viewerRef.current.isDestroyed()
      ) {
        viewerRef.current.removeController(zoomControllerRef.current);
      }

      zoomControllerRef.current = null;
      viewerRef.current?.destroy();
      viewerRef.current = null;
      layersRef.current = { map: null, imagery: null, labels: null };
    };
  }, []);

  const chooseMode = (nextMode: LayerMode) => {
    const layers = layersRef.current;
    const viewer = viewerRef.current;
    if (!viewer || !layers.map || !layers.imagery || !layers.labels) return;

    setImageryState("LOADING");

    layers.map.show = nextMode === "map";
    layers.imagery.show = nextMode !== "map";
    layers.labels.show = nextMode === "satellite-labels";
    layers.labels.alpha = 0.42;

    setMode(
      nextMode === "map"
        ? "MAP + CITY LABELS"
        : nextMode === "satellite-labels"
          ? "SATELLITE + CITY LABELS"
          : "SATELLITE CLEAN",
    );

    setImageryState("READY");
    setTestStatus({ engine: "READY", imagery: "READY" });
    viewer.scene.requestRender();
  };

  const zoom = (direction: "in" | "out") => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (direction === "in") {
      viewer.camera.zoomIn(900000);
      setZoomLevel((value) => Math.min(240, value + 15));
    } else {
      viewer.camera.zoomOut(900000);
      setZoomLevel((value) => Math.max(40, value - 15));
    }

    viewer.scene.requestRender();
  };

  const resetView = () => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(35, 30, 19000000),
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
          <div className="text-[9px] font-bold tracking-[.34em] text-cyan-400">
            SENTINEL TEST GLOBE
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            EARTH VISUAL TEST
          </h1>
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">
            CESIUMJS {CESIUM_VERSION} • NO ION API KEY • 3 STABLE MAP MODES
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/92 px-3 py-2 text-[9px] font-bold tracking-[.14em] text-cyan-300 backdrop-blur-xl">
          {mode}
        </div>
      </header>

      <aside className="absolute left-4 top-28 z-20 w-[300px] max-w-[calc(100vw-2rem)] space-y-3 md:left-6">
        <section className="rounded-xl border border-gray-800 bg-gray-900/92 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[.22em] text-cyan-400">
              MAP SOURCES
            </span>
            <span className="text-[9px] text-emerald-400">3 ONLINE</span>
          </div>
          <div className="space-y-2">
            <button type="button" onClick={() => chooseMode("map")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200">
              <span>MAP + CITY LABELS</span>
              <span className="text-cyan-400">STREET</span>
            </button>
            <button type="button" onClick={() => chooseMode("satellite-labels")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200">
              <span>SATELLITE + CITY LABELS</span>
              <span className="text-emerald-400">HYBRID</span>
            </button>
            <button type="button" onClick={() => chooseMode("satellite-clean")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200">
              <span>SATELLITE CLEAN</span>
              <span className="text-violet-400">IMAGERY</span>
            </button>
          </div>
          <p className="mt-3 text-[8px] leading-relaxed text-slate-600">
            Esri public raster services are used directly for this smoke test.
            No Cesium Ion imagery and no local tile proxy are involved.
          </p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/92 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 text-[10px] font-bold tracking-[.22em] text-slate-400">VIEW</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => zoom("out")} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-xs text-slate-400 hover:border-cyan-900">−</button>
            <button type="button" onClick={resetView} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-[9px] font-bold tracking-[.12em] text-slate-400 hover:border-cyan-900">RESET</button>
            <button type="button" onClick={() => zoom("in")} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-xs text-slate-400 hover:border-cyan-900">+</button>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            ZOOM <span className="text-cyan-300">{zoomLevel}%</span>
            <span className="ml-3">{imageryState}</span>
          </div>
          <div className="mt-1 text-[8px] text-slate-600">
            ENGINE {engineState} • NO API KEY
          </div>
        </section>
      </aside>

      <div className="absolute bottom-5 inset-x-4 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-gray-800 bg-gray-900/92 px-4 py-3 text-[8px] tracking-[.16em] backdrop-blur-xl">
          <span className="text-cyan-400">● STREET MAP</span>
          <span className="text-emerald-400">● SATELLITE + LABELS</span>
          <span className="text-violet-400">● SATELLITE CLEAN</span>
          <span className="text-slate-500">● NO ION KEY</span>
        </div>
      </div>
    </main>
  );
}
