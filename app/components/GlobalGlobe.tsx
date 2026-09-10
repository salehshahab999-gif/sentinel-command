"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GlobalMode = "map" | "satellite-labels" | "satellite-clean";
type LayerKind = "map" | "imagery" | "labels";

declare global {
  interface Window {
    Cesium?: any;
    CESIUM_BASE_URL?: string;
    __SENTINEL_GLOBAL_DEBUG__?: {
      ready: boolean;
      mode: GlobalMode;
      mapVisible: boolean;
      imageryVisible: boolean;
      labelsVisible: boolean;
      layerCount: number;
    };
  }
}

const CESIUM_VERSION = "1.145";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

const SOURCES = {
  map: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
  imagery: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
  labels: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",
} as const;

const MODE_LABELS: Record<GlobalMode, string> = {
  map: "MAP + CITY LABELS",
  "satellite-labels": "SATELLITE + CITY LABELS",
  "satellite-clean": "SATELLITE CLEAN",
};

function loadCesium(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) {
      resolve(window.Cesium);
      return;
    }

    window.CESIUM_BASE_URL = `${CESIUM_BASE}/`;

    if (!document.querySelector('link[data-sentinel-global-cesium="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${CESIUM_BASE}/Widgets/widgets.css`;
      link.dataset.sentinelGlobalCesium = "true";
      document.head.appendChild(link);
    }

    const existing = document.querySelector(
      'script[data-sentinel-global-cesium="true"]',
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
    script.src = `${CESIUM_BASE}/Cesium.js`;
    script.async = true;
    script.dataset.sentinelGlobalCesium = "true";
    script.onload = () => {
      if (window.Cesium) resolve(window.Cesium);
      else reject(new Error("Cesium global unavailable"));
    };
    script.onerror = () => reject(new Error("Failed to load CesiumJS"));
    document.head.appendChild(script);
  });
}

function modeKinds(mode: GlobalMode): LayerKind[] {
  if (mode === "map") return ["map", "labels"];
  if (mode === "satellite-labels") return ["imagery", "labels"];
  return ["imagery"];
}

function providerUrl(kind: LayerKind) {
  if (kind === "map") return SOURCES.map;
  if (kind === "imagery") return SOURCES.imagery;
  return SOURCES.labels;
}

export default function GlobalGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const clickHandlerRef = useRef<any>(null);
  const activeLayersRef = useRef<Array<{ layer: any; kind: LayerKind }>>([]);
  const requestIdRef = useRef(0);
  const modeRef = useRef<GlobalMode>("satellite-labels");

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<GlobalMode>("satellite-labels");
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modeText = useMemo(() => MODE_LABELS[mode], [mode]);

  const syncDebugState = () => {
    const viewer = viewerRef.current;
    const layers = activeLayersRef.current;
    window.__SENTINEL_GLOBAL_DEBUG__ = {
      ready: Boolean(viewer) && ready,
      mode: modeRef.current,
      mapVisible: layers.some(
        (item) => item.kind === "map" && item.layer?.show,
      ),
      imageryVisible: layers.some(
        (item) => item.kind === "imagery" && item.layer?.show,
      ),
      labelsVisible: layers.some(
        (item) => item.kind === "labels" && item.layer?.show,
      ),
      layerCount: viewer?.imageryLayers?.length ?? 0,
    };
  };

  const switchMode = async (nextMode: GlobalMode) => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium || switching) return;

    const requestId = ++requestIdRef.current;
    setSwitching(true);
    setError(null);

    try {
      const prepared = await Promise.all(
        modeKinds(nextMode).map(async (kind) => {
          const provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            providerUrl(kind),
            {
              enablePickFeatures: false,
            },
          );
          return { kind, provider };
        }),
      );

      if (
        requestId !== requestIdRef.current ||
        !viewerRef.current ||
        viewer.isDestroyed()
      ) {
        return;
      }

      const layers = prepared.map(({ kind, provider }) => {
        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.show = false;
        layer.alpha = 1;
        return { layer, kind };
      });

      const nextMap = layers.find((item) => item.kind === "map");
      const nextImagery = layers.find((item) => item.kind === "imagery");
      const nextLabels = layers.find((item) => item.kind === "labels");

      if (nextMap) nextMap.layer.show = true;
      if (nextImagery) nextImagery.layer.show = true;
      if (nextLabels) nextLabels.layer.show = true;

      const oldLayers = activeLayersRef.current;
      activeLayersRef.current = layers;
      modeRef.current = nextMode;
      setMode(nextMode);
      syncDebugState();

      viewer.scene.requestRender();

      for (const item of oldLayers) {
        if (item.layer && !viewer.isDestroyed()) {
          item.layer.show = false;
          viewer.imageryLayers.remove(item.layer, true);
        }
      }

      viewer.scene.requestRender();
      syncDebugState();
    } catch (cause) {
      if (requestId === requestIdRef.current) {
        setError(
          cause instanceof Error ? cause.message : "imagery switch failed",
        );
        syncDebugState();
      }
    } finally {
      if (requestId === requestIdRef.current) setSwitching(false);
    }
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
          baseLayer: false,
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
        });

        viewerRef.current = viewer;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.showGroundAtmosphere = false;
        viewer.scene.globe.maximumScreenSpaceError = 1.0;
        viewer.scene.globe.tileCacheSize = 300;
        viewer.scene.globe.preloadAncestors = true;
        viewer.scene.globe.preloadSiblings = true;
        viewer.scene.fog.enabled = false;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
        if (viewer.scene.sun) viewer.scene.sun.show = false;
        if (viewer.scene.moon) viewer.scene.moon.show = false;

        const camera = viewer.scene.screenSpaceCameraController;
        camera.minimumZoomDistance = 1500;
        camera.maximumZoomDistance = 40_000_000;
        camera.enableCollisionDetection = false;

        if (Cesium.ScreenSpaceZoomCameraController) {
          camera.enableZoom = false;
          const zoom = new Cesium.ScreenSpaceZoomCameraController({
            usePointerPosition: true,
            zoomSensitivity: 0.10,
            zoomDistanceRatio: 0.30,
            maximumZoomVelocity: 1.15,
            dampingEnabled: true,
            inertiaEnabled: true,
            inertialDecay: 7.5,
            zoomAnimationDuration: 0.28,
          });
          viewer.addController(zoom);
          viewer._sentinelZoomController = zoom;
        }

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(35, 30, 19_000_000),
        });

        setReady(true);
        modeRef.current = "satellite-labels";
        setMode("satellite-labels");

        await switchMode("satellite-labels");

        if (!destroyed) {
          setError(null);
          viewer.scene.requestRender();
        }
      } catch (cause) {
        if (destroyed) return;
        setError(
          cause instanceof Error ? cause.message : "GLOBAL INIT ERROR",
        );
        console.error("GLOBAL_CESIUM_INIT_ERROR:", cause);
      }
    }

    void init();

    return () => {
      destroyed = true;
      ++requestIdRef.current;
      clickHandlerRef.current?.destroy?.();
      clickHandlerRef.current = null;

      const viewer = viewerRef.current;
      const zoom = viewer?._sentinelZoomController;
      if (viewer && zoom) viewer.removeController?.(zoom);

      for (const item of activeLayersRef.current) {
        if (viewer && item.layer) {
          viewer.imageryLayers.remove(item.layer, true);
        }
      }

      activeLayersRef.current = [];
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      delete window.__SENTINEL_GLOBAL_DEBUG__;
    };
  }, []);

  useEffect(() => {
    const handleMapFocus = (event: Event) => {
      const result = (event as CustomEvent<{ latitude: number; longitude: number }>).detail;
      const viewer = viewerRef.current;
      const Cesium = window.Cesium;
      if (!viewer || !Cesium || !result) return;

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          result.longitude,
          result.latitude,
          1_200_000,
        ),
        duration: 0.8,
      });
    };

    window.addEventListener("sentinel-map-focus", handleMapFocus);
    return () => window.removeEventListener("sentinel-map-focus", handleMapFocus);
  }, []);

  useEffect(() => {
    syncDebugState();
  }, [ready, mode]);

  const buttons: Array<{ id: GlobalMode; label: string }> = [
    { id: "map", label: "MAP + CITY LABELS" },
    { id: "satellite-labels", label: "SATELLITE + CITY LABELS" },
    { id: "satellite-clean", label: "SATELLITE CLEAN" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-slate-100">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,.08)_45%,rgba(0,0,0,.50)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/75 px-4 py-3 backdrop-blur-xl">
          <div className="text-[9px] font-bold tracking-[.32em] text-cyan-400">
            SENTINEL COMMAND CENTER
          </div>
          <h1 className="mt-1 text-xl font-semibold md:text-2xl">
            GLOBAL INTELLIGENCE / SPACE
          </h1>
          <p className="mt-1 text-[8px] tracking-[.14em] text-slate-500">
            CESIUMJS {CESIUM_VERSION} • DIRECT ARCGIS • NO ION / NO API KEY
          </p>
        </div>

        <div
          className={`rounded-full border bg-black/75 px-3 py-2 text-[8px] font-bold tracking-[.14em] backdrop-blur-xl ${
            error
              ? "border-red-900 text-red-300"
              : switching
                ? "border-amber-900 text-amber-300"
                : "border-emerald-900 text-emerald-300"
          }`}
        >
          {error
            ? "GLOBAL ERROR"
            : switching
              ? "LOADING MODE"
              : ready
                ? modeText
                : "BOOTING GLOBAL"}
        </div>
      </header>

      <aside className="absolute left-4 top-28 z-20 w-[315px] max-w-[calc(100vw-2rem)] space-y-3 md:left-6">
        <section className="rounded-2xl border border-cyan-950/80 bg-black/78 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] font-bold tracking-[.24em] text-slate-400">
              GLOBAL MODE
            </span>
            <span className="text-[8px] text-emerald-400">
              {switching ? "SWITCHING" : "ISOLATED"}
            </span>
          </div>

          <div className="space-y-1.5">
            {buttons.map((button) => (
              <button
                key={button.id}
                data-testid={`global-mode-${button.id}`}
                type="button"
                disabled={switching || !ready}
                onClick={() => void switchMode(button.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-[9px] font-bold tracking-[.08em] transition ${
                  mode === button.id
                    ? "border-cyan-700 bg-cyan-950/40 text-cyan-200"
                    : "border-slate-900 bg-black/30 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-950/80 bg-black/78 p-3 backdrop-blur-xl">
          <div className="mb-2 text-[9px] font-bold tracking-[.24em] text-cyan-500">
            GLOBAL SOURCE BUS
          </div>
          <div className="space-y-2 text-[8px]">
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">MAP</span>
              <span className="text-cyan-300">ESRI WORLD STREET MAP</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">SATELLITE</span>
              <span className="text-emerald-300">ESRI WORLD IMAGERY</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">LABELS</span>
              <span className="text-violet-300">WORLD BOUNDARIES / PLACES</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">AUTH</span>
              <span className="text-emerald-300">NO API KEY</span>
            </div>
          </div>
        </section>
      </aside>

      {error && (
        <section className="absolute bottom-20 left-4 z-30 max-w-[calc(100vw-2rem)] rounded-xl border border-red-900/80 bg-black/85 px-3 py-2 text-[8px] text-red-300 md:left-6">
          GLOBAL IMAGERY ERROR: {error}
        </section>
      )}
    </main>
  );
}
