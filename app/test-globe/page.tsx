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

const CESIUM_SCRIPT =
  `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Cesium.js`;

const CESIUM_CSS =
  `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Widgets/widgets.css`;

const CESIUM_BASE_URL =
  `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;

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

function setTestStatus(
  status: Window["__SENTINEL_TEST_GLOBE__"],
): void {
  window.__SENTINEL_TEST_GLOBE__ = status;
}

export default function TestGlobePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const satelliteLayerRef = useRef<any>(null);
  const [engineState, setEngineState] = useState("BOOTING");
  const [imageryState, setImageryState] = useState("LOADING");
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        setTestStatus({ engine: "ERROR", imagery: "LOADING" });

        const Cesium = await loadCesium();

        if (destroyed || !containerRef.current) return;

        const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;

        if (token) {
          Cesium.Ion.defaultAccessToken = token;
        }

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
        viewer.scene.globe.maximumScreenSpaceError = 1;
        viewer.scene.fog.enabled = false;

        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = false;
        }

        if (viewer.scene.skyBox) {
          viewer.scene.skyBox.show = false;
        }

        if (viewer.scene.sun) {
          viewer.scene.sun.show = false;
        }

        if (viewer.scene.moon) {
          viewer.scene.moon.show = false;
        }

        viewer.scene.backgroundColor = Cesium.Color.BLACK;

        if (viewer.scene.postProcessStages?.fxaa) {
          viewer.scene.postProcessStages.fxaa.enabled = true;
        }

        viewer.resolutionScale = Math.min(
          Math.max(window.devicePixelRatio || 1, 1) * 1.25,
          1.5,
        );

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(35, 30, 19000000),
        });

        viewerRef.current = viewer;
        setEngineState("READY");
        setTestStatus({ engine: "READY", imagery: "LOADING" });

        if (!token) {
          setImageryState("ERROR");
          setTestStatus({
            engine: "READY",
            imagery: "ERROR",
            error: "NEXT_PUBLIC_CESIUM_ION_TOKEN is not configured",
          });
          viewer.scene.requestRender();
          return;
        }

        setImageryState("LOADING");

        try {
          const satelliteLayer = Cesium.ImageryLayer.fromProviderAsync(
            Cesium.IonImageryProvider.fromAssetId(SATELLITE_ASSET_ID),
            {
              brightness: 1.0,
              contrast: 1.08,
              saturation: 0.95,
              gamma: 1.0,
            },
          );

          satelliteLayer.readyEvent.addEventListener(() => {
            if (destroyed) return;
            setImageryState("READY");
            setTestStatus({ engine: "READY", imagery: "READY" });
            viewer.scene.requestRender();
          });

          satelliteLayer.errorEvent.addEventListener((error: unknown) => {
            if (destroyed) return;
            const message =
              error instanceof Error ? error.message : "Satellite imagery failed";
            setImageryState("ERROR");
            setTestStatus({ engine: "READY", imagery: "ERROR", error: message });
            console.error("SATELLITE_IMAGERY_ERROR:", error);
            viewer.scene.requestRender();
          });

          satelliteLayerRef.current = viewer.imageryLayers.add(satelliteLayer);
          viewer.scene.requestRender();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Satellite imagery failed";
          setImageryState("ERROR");
          setTestStatus({ engine: "READY", imagery: "ERROR", error: message });
          console.error("SATELLITE_IMAGERY_INIT_ERROR:", error);
          viewer.scene.requestRender();
        }
      } catch (error) {
        if (destroyed) return;

        const message =
          error instanceof Error ? error.message : "Unknown Cesium error";
        setEngineState("ERROR");
        setImageryState("ERROR");
        setTestStatus({ engine: "ERROR", imagery: "ERROR", error: message });
        console.error("CESIUM_INIT_ERROR:", error);
      }
    }

    init();

    return () => {
      destroyed = true;
      satelliteLayerRef.current = null;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  const zoom = (direction: "in" | "out") => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (direction === "in") {
      viewer.camera.zoomIn(1_500_000);
      setZoomLevel((value) => Math.min(180, value + 15));
    } else {
      viewer.camera.zoomOut(1_500_000);
      setZoomLevel((value) => Math.max(40, value - 15));
    }

    viewer.scene.requestRender();
  };

  const resetView = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const Cesium = window.Cesium;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(35, 30, 19000000),
    });
    setZoomLevel(100);
    viewer.scene.requestRender();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#010304] text-slate-100">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,.08)_42%,rgba(0,0,0,.68)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/72 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[.34em] text-cyan-400">
            <span
              className={`h-2 w-2 rounded-full ${
                engineState === "READY"
                  ? "animate-pulse bg-emerald-400"
                  : "animate-pulse bg-amber-400"
              }`}
            />
            SENTINEL TEST GLOBE
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            SATELLITE EARTH / VISUAL TEST
          </h1>
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">
            CESIUMJS {CESIUM_VERSION} • GOOGLE SATELLITE WITH LABELS • TEST ONLY
          </p>
        </div>

        <div className="rounded-full border border-emerald-900/80 bg-black/72 px-3 py-2 text-[9px] font-bold tracking-[.16em] text-emerald-300 backdrop-blur-xl">
          ENGINE {engineState} • IMAGERY {imageryState}
        </div>
      </header>

      <aside className="absolute left-4 top-28 z-20 w-[260px] max-w-[calc(100vw-2rem)] space-y-3 md:left-6">
        <section className="rounded-2xl border border-cyan-950/80 bg-black/72 p-3 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[9px] font-bold tracking-[.24em] text-slate-400">
              VISUAL TEST
            </span>
            <span className="text-[8px] text-cyan-500">SATELLITE</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => zoom("out")}
              className="rounded-lg border border-slate-800 bg-black/30 py-2 text-xs text-slate-400 transition hover:border-cyan-900 hover:text-cyan-200"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetView}
              className="rounded-lg border border-slate-800 bg-black/30 py-2 text-[9px] font-bold tracking-[.12em] text-slate-400 transition hover:border-cyan-900 hover:text-cyan-200"
            >
              RESET
            </button>
            <button
              type="button"
              onClick={() => zoom("in")}
              className="rounded-lg border border-slate-800 bg-black/30 py-2 text-xs text-slate-400 transition hover:border-cyan-900 hover:text-cyan-200"
            >
              +
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            <div className="rounded-lg bg-white/[.035] p-2">
              <span className="text-slate-600">ZOOM</span>
              <br />
              <span className="text-cyan-300">{zoomLevel}%</span>
            </div>
            <div className="rounded-lg bg-white/[.035] p-2">
              <span className="text-slate-600">IMAGERY</span>
              <br />
              <span
                className={
                  imageryState === "READY"
                    ? "text-emerald-300"
                    : imageryState === "ERROR"
                      ? "text-red-300"
                      : "text-amber-300"
                }
              >
                {imageryState}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-violet-950/80 bg-black/72 p-3 backdrop-blur-xl">
          <p className="text-[8px] font-bold tracking-[.27em] text-violet-300">
            TEST TARGET
          </p>
          <div className="mt-2 space-y-1 text-[9px]">
            <div className="flex justify-between">
              <span className="text-slate-600">START</span>
              <span className="text-slate-300">EARTH / GLOBAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">DETAIL</span>
              <span className="text-slate-300">ZOOM → CITY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">STYLE</span>
              <span className="text-cyan-300">SATELLITE / DARK HUD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">LIVE DATA</span>
              <span className="text-slate-500">OFF</span>
            </div>
          </div>
        </section>
      </aside>

      <div className="absolute bottom-5 inset-x-4 z-20">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-cyan-950/80 bg-black/72 px-4 py-3 text-[8px] tracking-[.16em] backdrop-blur-xl">
          <span className="text-emerald-400">● CESIUM READY</span>
          <span className="text-cyan-400">● SATELLITE IMAGERY</span>
          <span className="text-violet-400">● ZOOM TEST</span>
          <span className="text-amber-400">● LIVE FEEDS OFF</span>
          <span className="text-slate-500">● DB DISCONNECTED</span>
        </div>
      </div>
    </main>
  );
}
