"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const CESIUM_VERSION = "1.145";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const LOCAL_CACHE_URL = "/api/map/tile/{z}/{x}/{y}.png";

declare global {
  interface Window {
    Cesium?: any;
    __SENTINEL_GLOBAL_VIEWER__?: any;
  }
}

export default function GlobalStreetMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cesiumReady, setCesiumReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [status, setStatus] = useState("BOOTING GLOBAL MAP");

  useEffect(() => {
    const updateOnline = () => setOnline(window.navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!cesiumReady || !containerRef.current || !window.Cesium) return;

    const Cesium = window.Cesium;
    const previous = window.__SENTINEL_GLOBAL_VIEWER__;
    if (previous && !previous.isDestroyed?.()) previous.destroy();

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

    window.__SENTINEL_GLOBAL_VIEWER__ = viewer;

    viewer.scene.skyBox.show = false;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.sun.show = false;
    viewer.scene.moon.show = false;
    viewer.scene.globe.show = true;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#071019");
    viewer.scene.postProcessStages.fxaa.enabled = true;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(35, 25, 20_000_000),
    });

    // Never allow stale imagery layers to accumulate across remounts/HMR.
    viewer.imageryLayers.removeAll(true);

    const onlineProvider = new Cesium.UrlTemplateImageryProvider({
      url: OSM_URL,
      maximumLevel: 19,
      credit: "© OpenStreetMap contributors",
      enablePickFeatures: false,
    });

    const localProvider = new Cesium.UrlTemplateImageryProvider({
      url: LOCAL_CACHE_URL,
      maximumLevel: 19,
      credit: "Sentinel local viewed-tile cache / © OpenStreetMap contributors",
      enablePickFeatures: false,
    });

    const onlineLayer = viewer.imageryLayers.addImageryProvider(onlineProvider);
    const localLayer = viewer.imageryLayers.addImageryProvider(localProvider);

    const applySource = (isOnline: boolean) => {
      onlineLayer.show = isOnline;
      localLayer.show = !isOnline;
      setStatus(isOnline ? "GLOBAL READY / OSM ONLINE" : "GLOBAL READY / LOCAL CACHE");
      viewer.scene.requestRender();
    };

    applySource(window.navigator.onLine);

    const onOnline = () => applySource(true);
    const onOffline = () => applySource(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

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

    const focusHandler = (event: Event) => {
      const result = (event as CustomEvent<{ latitude: number; longitude: number }>).detail;
      if (!result) return;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(result.longitude, result.latitude, 300_000),
        duration: 0.7,
      });
    };

    window.addEventListener("sentinel-map-focus", focusHandler);
    viewer.scene.requestRender();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("sentinel-map-focus", focusHandler);

      if (window.__SENTINEL_GLOBAL_VIEWER__ === viewer) {
        window.__SENTINEL_GLOBAL_VIEWER__ = undefined;
      }

      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, [cesiumReady]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020406] text-slate-100">
      <link rel="stylesheet" href={`${CESIUM_BASE}/Widgets/widgets.css`} />
      <Script
        id="sentinel-global-cesium"
        src={`${CESIUM_BASE}/Cesium.js`}
        strategy="afterInteractive"
        onLoad={() => setCesiumReady(true)}
        onError={() => setStatus("CESIUM LOAD ERROR")}
      />

      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,.08)_45%,rgba(0,0,0,.55)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/72 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[.35em] text-cyan-400">
            <span className={`h-2 w-2 rounded-full ${cesiumReady ? "animate-pulse bg-emerald-400" : "animate-pulse bg-amber-400"}`} />
            SENTINEL COMMAND CENTER
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">GLOBAL MAP</h1>
          <p className="mt-1 text-[9px] tracking-[.18em] text-slate-500">STREET MAP / CITY LABELS / SINGLE IMAGERY SOURCE</p>
        </div>

        <div className="rounded-full border border-cyan-900/80 bg-black/72 px-3 py-2 text-[8px] font-bold tracking-[.15em] text-cyan-300 backdrop-blur-xl">
          {status}
        </div>
      </header>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-slate-800/90 bg-black/72 px-3 py-2 text-[8px] tracking-[.12em] text-slate-500 backdrop-blur-xl">
        {online ? "ONLINE OSM • LOCAL CACHE READY AS FALLBACK" : "OFFLINE • LOCAL VIEWED-TILE CACHE"} • © OpenStreetMap contributors
      </div>
    </main>
  );
}
