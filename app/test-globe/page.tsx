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
const MAP_TILE_URL = "/api/map/tile/{z}/{x}/{y}.png";
const SATELLITE_TILE_URL =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";
const MAP_MAX_LEVEL = 19;
const SATELLITE_MAX_LEVEL = 9;

const CESIUM_SCRIPT = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Cesium.js`;
const CESIUM_CSS = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Widgets/widgets.css`;
const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;

const CITY_LABELS = [
  ["London", "United Kingdom", -0.1276, 51.5072],
  ["Paris", "France", 2.3522, 48.8566],
  ["Berlin", "Germany", 13.405, 52.52],
  ["Madrid", "Spain", -3.7038, 40.4168],
  ["Rome", "Italy", 12.4964, 41.9028],
  ["Athens", "Greece", 23.7275, 37.9838],
  ["Istanbul", "Türkiye", 28.9784, 41.0082],
  ["Tehran", "Iran", 51.389, 35.6892],
  ["Cairo", "Egypt", 31.2357, 30.0444],
  ["Riyadh", "Saudi Arabia", 46.6753, 24.7136],
  ["Dubai", "UAE", 55.2708, 25.2048],
  ["New York", "United States", -74.006, 40.7128],
  ["Washington", "United States", -77.0369, 38.9072],
  ["Toronto", "Canada", -79.3832, 43.6532],
  ["Mexico City", "Mexico", -99.1332, 19.4326],
  ["Sao Paulo", "Brazil", -46.6333, -23.5505],
  ["Buenos Aires", "Argentina", -58.3816, -34.6037],
  ["Cape Town", "South Africa", 18.4241, -33.9249],
  ["Nairobi", "Kenya", 36.8219, -1.2921],
  ["Tokyo", "Japan", 139.6917, 35.6895],
  ["Seoul", "South Korea", 126.978, 37.5665],
  ["Beijing", "China", 116.4074, 39.9042],
  ["Delhi", "India", 77.1025, 28.7041],
  ["Singapore", "Singapore", 103.8198, 1.3521],
  ["Jakarta", "Indonesia", 106.8456, -6.2088],
  ["Sydney", "Australia", 151.2093, -33.8688],
  ["Auckland", "New Zealand", 174.7633, -36.8485],
  ["Reykjavik", "Iceland", -21.9426, 64.1466],
  ["Helsinki", "Finland", 24.9384, 60.1699],
  ["Moscow", "Russia", 37.6173, 55.7558],
] as const;

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
      existing.addEventListener("load", () => resolve(window.Cesium), {
        once: true,
      });
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
        : reject(new Error("Cesium loaded but window.Cesium is unavailable"));
    script.onerror = () => reject(new Error("Failed to load CesiumJS"));
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
  const activeImageryLayerRef = useRef<any>(null);
  const labelsRef = useRef<any>(null);
  const switchImageryRef = useRef<((mode: LayerMode) => void) | null>(null);

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
          terrain: false,
        });

        viewerRef.current = viewer;

        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.maximumScreenSpaceError = 1.0;
        viewer.scene.globe.tileCacheSize = 300;
        viewer.scene.globe.preloadSiblings = true;
        viewer.scene.globe.preloadAncestors = true;
        viewer.scene.globe.backFaceCulling = true;
        viewer.scene.globe.depthTestAgainstTerrain = false;
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#08131b");
        viewer.scene.fog.enabled = false;
        viewer.scene.skyAtmosphere.show = false;
        viewer.scene.skyBox.show = false;
        viewer.scene.sun.show = false;
        viewer.scene.moon.show = false;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        viewer.scene.postProcessStages.fxaa.enabled = true;
        viewer.resolutionScale = Math.min(Math.max(window.devicePixelRatio || 1, 1), 1.5);

        const controller = viewer.scene.screenSpaceCameraController;
        controller.enableCollisionDetection = false;
        controller.minimumZoomDistance = 450;
        controller.maximumZoomDistance = 40000000;
        controller.enableZoom = false;

        const zoomController = new Cesium.ScreenSpaceZoomCameraController();
        zoomController.usePointerPosition = true;
        zoomController.zoomSensitivity = 0.42;
        zoomController.zoomDistanceRatio = 0.58;
        zoomController.maximumZoomVelocity = 3.0;
        zoomController.dampingEnabled = true;
        zoomController.inertiaEnabled = true;
        zoomController.inertialDecay = 7.0;
        zoomController.zoomAnimationDuration = 0.18;
        viewer.addController(zoomController);
        zoomControllerRef.current = zoomController;

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(35, 30, 19000000),
        });

        const labels = viewer.scene.primitives.add(new Cesium.LabelCollection());
        labelsRef.current = labels;

        for (const [name, country, longitude, latitude] of CITY_LABELS) {
          labels.add({
            text: `${name}\n${country}`,
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 12000),
            font: "12px sans-serif",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(0, -8),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(2.0e6, 1.15, 1.8e7, 0.72),
          });
        }

        const switchImagery = (nextMode: LayerMode) => {
          const current = activeImageryLayerRef.current;
          if (current) {
            viewer.imageryLayers.remove(current, false);
            activeImageryLayerRef.current = null;
          }

          const isMap = nextMode === "map";
          const provider = createRasterProvider(
            Cesium,
            isMap ? MAP_TILE_URL : SATELLITE_TILE_URL,
            isMap ? MAP_MAX_LEVEL : SATELLITE_MAX_LEVEL,
            isMap
              ? "Sentinel map cache • Esri World Street / OSM fallback"
              : "NASA GIBS / MODIS Terra",
          );

          activeImageryLayerRef.current = viewer.imageryLayers.addImageryProvider(provider);
          labels.show = nextMode !== "satellite-clean";
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

        switchImageryRef.current = switchImagery;
        switchImagery("satellite-labels");

        inputHandlerRef.current = new Cesium.ScreenSpaceEventHandler(
          viewer.scene.canvas,
        );

        inputHandlerRef.current.setInputAction(
          (movement: any) => {
            const ray = viewer.camera.getPickRay(movement.position);
            const cartesian = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined;
            if (!cartesian) return;

            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const height = Math.max(viewer.camera.positionCartographic.height, 1000);
            const targetHeight = Math.min(Math.max(height * 0.42, 900), 1900000);

            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude,
                targetHeight,
              ),
              duration: 0.34,
            });
          },
          Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
        );

        setEngineState("READY");
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

    void init();

    return () => {
      destroyed = true;
      inputHandlerRef.current?.destroy();
      inputHandlerRef.current = null;
      switchImageryRef.current = null;
      activeImageryLayerRef.current = null;
      labelsRef.current = null;

      if (zoomControllerRef.current && viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.removeController(zoomControllerRef.current);
      }

      zoomControllerRef.current = null;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  const chooseMode = (nextMode: LayerMode) => {
    if (!viewerRef.current || !switchImageryRef.current) return;
    switchImageryRef.current(nextMode);
  };

  const zoom = (direction: "in" | "out") => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const height = Math.max(viewer.camera.positionCartographic.height, 900);
    const distance = Math.min(Math.max(height * 0.45, 900), 6500000);

    if (direction === "in") {
      viewer.camera.zoomIn(distance);
      setZoomLevel((value) => Math.min(240, value + 12));
    } else {
      viewer.camera.zoomOut(distance);
      setZoomLevel((value) => Math.max(20, value - 12));
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,.10)_50%,rgba(0,0,0,.76)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900/92 px-4 py-3 shadow-lg backdrop-blur-xl">
          <div className="text-[9px] font-bold tracking-[.34em] text-cyan-400">SENTINEL TEST GLOBE</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">EARTH VISUAL TEST</h1>
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">CESIUMJS {CESIUM_VERSION} • SENTINEL MAP CACHE • 3 ISOLATED MAP MODES</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/92 px-3 py-2 text-[9px] font-bold tracking-[.14em] text-cyan-300 backdrop-blur-xl">{mode}</div>
      </header>

      <aside className="absolute left-4 top-28 z-20 w-[300px] max-w-[calc(100vw-2rem)] space-y-3 md:left-6">
        <section className="rounded-xl border border-gray-800 bg-gray-900/92 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[.22em] text-cyan-400">MAP SOURCES</span>
            <span className="text-[9px] text-emerald-400">NO ION KEY</span>
          </div>
          <div className="space-y-2">
            <button type="button" onClick={() => chooseMode("map")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200">
              <span>MAP + CITY LABELS</span>
              <span className="text-cyan-400">SENTINEL CACHE</span>
            </button>
            <button type="button" onClick={() => chooseMode("satellite-labels")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200">
              <span>SATELLITE + CITY LABELS</span>
              <span className="text-emerald-400">NASA GIBS</span>
            </button>
            <button type="button" onClick={() => chooseMode("satellite-clean")} className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2.5 text-left text-xs text-gray-200 hover:border-cyan-900 hover:text-cyan-200">
              <span>SATELLITE CLEAN</span>
              <span className="text-violet-400">NASA GIBS</span>
            </button>
          </div>
          <p className="mt-3 text-[8px] leading-relaxed text-slate-600">Only one imagery layer exists at a time. Switching removes the previous provider before adding the new one.</p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/92 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 text-[10px] font-bold tracking-[.22em] text-slate-400">VIEW</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => zoom("out")} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-xs text-slate-400 hover:border-cyan-900">−</button>
            <button type="button" onClick={resetView} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-[9px] font-bold tracking-[.12em] text-slate-400 hover:border-cyan-900">RESET</button>
            <button type="button" onClick={() => zoom("in")} className="rounded-lg border border-gray-800 bg-black/30 py-2 text-xs text-slate-400 hover:border-cyan-900">+</button>
          </div>
          <div className="mt-3 text-xs text-slate-500">ZOOM <span className="text-cyan-300">{zoomLevel}%</span><span className="ml-3">{imageryState}</span></div>
          <div className="mt-1 text-[8px] text-slate-600">ENGINE {engineState} • CACHE ROUTE ACTIVE</div>
        </section>
      </aside>

      <div className="absolute bottom-5 inset-x-4 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-gray-800 bg-gray-900/92 px-4 py-3 text-[8px] tracking-[.16em] backdrop-blur-xl">
          <span className="text-cyan-400">● SENTINEL MAP CACHE</span>
          <span className="text-emerald-400">● NASA GIBS + LABELS</span>
          <span className="text-violet-400">● NASA GIBS CLEAN</span>
          <span className="text-slate-500">● NO ION KEY</span>
        </div>
      </div>
    </main>
  );
}
