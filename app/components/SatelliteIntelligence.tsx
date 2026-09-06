"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MARITIME_PROVIDERS } from "../../core/maritime/maritime-providers";
import type { VesselRecord } from "../../core/maritime/maritime-contracts";
import { SATELLITE_LAYERS } from "../../core/satellite/satellite-catalog";
import type { SatelliteLayerId } from "../../core/satellite/satellite-contracts";

type CesiumNamespace = {
  Viewer: new (container: HTMLElement, options?: Record<string, unknown>) => CesiumViewer;
  Cartesian3: { fromDegrees: (longitude: number, latitude: number, height?: number) => unknown };
  Color: Record<string, unknown> & {
    fromCssColorString: (value: string) => unknown;
    YELLOW: unknown;
    CYAN: unknown;
    WHITE: unknown;
  };
  HorizontalOrigin: Record<string, unknown>;
  VerticalOrigin: Record<string, unknown>;
  ScreenSpaceEventHandler: new (canvas: HTMLCanvasElement) => { setInputAction: (handler: (event: { position: unknown }) => void, type: unknown) => void; destroy: () => void };
  ScreenSpaceEventType: Record<string, unknown>;
  Math: { toDegrees: (radians: number) => number };
};

type CesiumViewer = {
  scene: {
    primitives: { add: (collection: unknown) => unknown };
    globe: { enableLighting: boolean };
    postRender: { addEventListener: (handler: () => void) => void };
  };
  camera: { positionCartographic: { longitude: number; latitude: number; height: number } };
  destroy: () => void;
  cesiumWidget: { creditContainer: HTMLElement };
};

type CesiumPointCollection = {
  add: (options: Record<string, unknown>) => unknown;
};

type CesiumPoint = {
  position?: unknown;
  pixelSize?: number;
  color?: unknown;
};

declare global {
  interface Window {
    Cesium?: CesiumNamespace;
  }
}

const layerAccent: Record<SatelliteLayerId, string> = {
  baseMap: "border-cyan-700 text-cyan-300",
  satellites: "border-emerald-700 text-emerald-300",
  orbits: "border-violet-700 text-violet-300",
  fires: "border-orange-700 text-orange-300",
  weather: "border-blue-700 text-blue-300",
  clouds: "border-slate-600 text-slate-300",
  ocean: "border-teal-700 text-teal-300",
  ais: "border-amber-700 text-amber-300",
  geography: "border-green-700 text-green-300",
  events: "border-yellow-700 text-yellow-300",
  alerts: "border-red-700 text-red-300",
};

const mapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const CESIUM_VERSION = "1.145";

function loadCesium(): Promise<CesiumNamespace> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) {
      resolve(window.Cesium);
      return;
    }

    const scriptId = "sentinel-cesium-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => window.Cesium && resolve(window.Cesium));
      existing.addEventListener("error", () => reject(new Error("CesiumJS failed to load")));
      return;
    }

    const baseUrl = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;
    (window as unknown as { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = baseUrl;

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `${baseUrl}Widgets/widgets.css`;
    css.id = "sentinel-cesium-css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `${baseUrl}Cesium.js`;
    script.async = true;
    script.onload = () => window.Cesium ? resolve(window.Cesium) : reject(new Error("CesiumJS global missing"));
    script.onerror = () => reject(new Error("CesiumJS failed to load"));
    document.head.appendChild(script);
  });
}

function createSkeletonVessels(): VesselRecord[] {
  const centers = [
    [26.2, 54.1], [25.7, 55.0], [27.0, 50.9], [24.9, 56.3], [26.7, 52.0],
    [25.3, 57.1], [28.1, 51.5], [24.4, 53.2], [26.0, 58.0], [25.1, 54.8],
    [27.4, 54.4], [24.8, 55.9], [15.9, 41.4], [18.7, 39.0], [13.1, 43.6],
    [34.7, 17.9], [10.2, 67.8], [2.3, 101.4], [33.1, -24.6], [29.4, 34.8],
  ];

  return centers.map(([latitude, longitude], index) => ({
    id: `VIS-SHIP-${String(index + 1).padStart(2, "0")}`,
    mmsi: 700000000 + index,
    name: index < 12 ? `GULF VESSEL ${String(index + 1).padStart(2, "0")}` : `GLOBAL VESSEL ${String(index + 1).padStart(2, "0")}`,
    type: index % 3 === 0 ? "TANKER" : index % 3 === 1 ? "CONTAINER" : "CARGO",
    source: index % 4 === 0 ? "TANKERTRACKERS" : index % 3 === 0 ? "VESSELFINDER" : "AISSTREAM",
    dataMode: "SKELETON",
    latitude,
    longitude,
    speedKnots: 7 + (index % 9),
    courseDeg: (40 + index * 27) % 360,
    headingDeg: (42 + index * 27) % 360,
    destination: index % 2 === 0 ? "FUJAIRAH" : "GLOBAL",
    state: index % 5 === 0 ? "SLOW" : "MOVING",
    lastUpdate: "SKELETON",
  }));
}

export default function SatelliteIntelligence() {
  const cesiumRootRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const shipPointsRef = useRef<CesiumPointCollection | null>(null);
  const [cesiumReady, setCesiumReady] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<VesselRecord | null>(null);
  const [showShips, setShowShips] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [rotationPulse, setRotationPulse] = useState(0);
  const ships = useMemo(() => createSkeletonVessels(), []);

  useEffect(() => {
    let cancelled = false;

    loadCesium()
      .then((Cesium) => {
        if (cancelled || !cesiumRootRef.current) return;

        const viewer = new Cesium.Viewer(cesiumRootRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          homeButton: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          shouldAnimate: true,
        });

        viewer.scene.globe.enableLighting = true;
        viewer.cesiumWidget.creditContainer.style.display = "none";
        viewerRef.current = viewer;

        const points = viewer.scene.primitives.add({ add: () => undefined }) as unknown as CesiumPointCollection;
        shipPointsRef.current = points;

        const handler = new Cesium.ScreenSpaceEventHandler(cesiumRootRef.current.querySelector("canvas") as HTMLCanvasElement);
        handler.setInputAction((event) => {
          const picked = (viewer.scene as unknown as { pick?: (position: unknown) => { id?: VesselRecord } }).pick?.(event.position);
          if (picked?.id) setSelectedShip(picked.id);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        const renderShips = () => {
          if (!shipPointsRef.current || !showShips) return;
          ships.forEach((ship) => {
            const point = shipPointsRef.current?.add({
              position: Cesium.Cartesian3.fromDegrees(ship.longitude, ship.latitude, 500),
              pixelSize: 7,
              color: ship.type === "TANKER" ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1,
              id: ship,
            } as unknown as Record<string, unknown>) as CesiumPoint;
            if (point) point.pixelSize = 7;
          });
        };

        renderShips();
        setCesiumReady(true);

        return () => handler.destroy();
      })
      .catch((error: unknown) => {
        if (!cancelled) setViewerError(error instanceof Error ? error.message : "Cesium initialization failed");
      });

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
      shipPointsRef.current = null;
    };
  }, [ships, showShips]);

  useEffect(() => {
    const id = window.setInterval(() => setRotationPulse((value) => (value + 1) % 360), 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020607] text-white select-none">
      <div ref={cesiumRootRef} className="absolute inset-0 z-0" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,transparent_25%,rgba(0,0,0,.35)_72%,rgba(0,0,0,.75)_100%)]" />
      {showAtmosphere && <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_180px_rgba(34,211,238,.10)]" />}

      <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4 md:p-6">
        <div className="rounded-2xl border border-cyan-950/80 bg-[#02080a]/80 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <p className="text-[9px] font-bold tracking-[0.38em] text-cyan-500">SENTINEL COMMAND CENTER</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-100 md:text-2xl">GLOBAL INTELLIGENCE / EARTH</h1>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-slate-500">CESIUM 3D SHELL • MARITIME WIRING ARMED • LIVE COLLECTORS OFF</p>
        </div>
        <div className="rounded-full border border-emerald-900/70 bg-black/70 px-3 py-2 text-[9px] font-bold tracking-[0.2em] text-emerald-400 backdrop-blur-xl">
          <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          POWER 12% • SKELETON
        </div>
      </header>

      <aside className="absolute left-4 top-28 z-30 w-[245px] space-y-3">
        <section className="rounded-2xl border border-cyan-950/80 bg-[#02080a]/85 p-3 shadow-2xl backdrop-blur-xl">
          <p className="mb-2 text-[9px] font-bold tracking-[0.25em] text-slate-500">CONTROL DECK</p>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <button type="button" onClick={() => setShowShips((value) => !value)} className={`rounded-lg border px-2 py-2 ${showShips ? "border-emerald-800 text-emerald-300" : "border-slate-800 text-slate-600"}`}>🚢 SHIPS {showShips ? "ON" : "OFF"}</button>
            <button type="button" onClick={() => setShowAtmosphere((value) => !value)} className={`rounded-lg border px-2 py-2 ${showAtmosphere ? "border-cyan-800 text-cyan-300" : "border-slate-800 text-slate-600"}`}>🌐 ATMOS {showAtmosphere ? "ON" : "OFF"}</button>
            <button type="button" onClick={() => setShowGrid((value) => !value)} className={`rounded-lg border px-2 py-2 ${showGrid ? "border-violet-800 text-violet-300" : "border-slate-800 text-slate-600"}`}>⌗ GRID {showGrid ? "ON" : "OFF"}</button>
            <button type="button" onClick={() => viewerRef.current && (viewerRef.current.camera.positionCartographic.longitude += rotationPulse * 0.0001)} className="rounded-lg border border-amber-900/70 px-2 py-2 text-amber-300">⟲ PULSE</button>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-950/80 bg-[#02080a]/85 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-bold tracking-[0.25em] text-slate-500">SOURCE BUS</p>
            <span className="text-[8px] text-amber-400">0 LIVE</span>
          </div>
          <div className="space-y-1">
            {MARITIME_PROVIDERS.slice(0, 8).map((provider) => (
              <div key={provider.id} className="flex items-center justify-between rounded-md bg-white/[0.03] px-2 py-1.5 text-[8px]">
                <span className="text-slate-300">{provider.label}</span>
                <span className={provider.liveAvailable ? "text-amber-400" : "text-slate-700"}>{provider.requiresKey ? "KEY" : "PUBLIC"}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <aside className="absolute right-4 top-28 z-30 hidden w-[280px] space-y-3 md:block">
        <section className="rounded-2xl border border-cyan-950/80 bg-[#02080a]/85 p-3 shadow-2xl backdrop-blur-xl">
          <p className="text-[9px] font-bold tracking-[0.25em] text-slate-500">LAYER MATRIX</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SATELLITE_LAYERS.map((layer) => (
              <span key={layer.id} className={`rounded-md border px-2 py-1 text-[8px] ${layerAccent[layer.id]} bg-white/[0.02]`}>{layer.label}</span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-950/80 bg-[#02080a]/85 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold tracking-[0.25em] text-slate-500">MARITIME DISPLAY</p>
            <span className="text-[9px] font-bold text-emerald-400">{ships.length} CONTACTS</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">TANKERS</span><br /><span className="text-amber-300">{ships.filter((ship) => ship.type === "TANKER").length}</span></div>
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">MOVING</span><br /><span className="text-cyan-300">{ships.filter((ship) => ship.state === "MOVING").length}</span></div>
          </div>
          <p className="mt-2 text-[8px] leading-relaxed text-slate-600">Skeleton contacts only. Provider adapters are wired as dormant contracts and do not call remote services while LIVE is off.</p>
        </section>
      </aside>

      <div className="absolute inset-x-4 bottom-4 z-30 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-950/80 bg-[#02080a]/85 px-4 py-3 text-[9px] shadow-2xl backdrop-blur-xl md:inset-x-6">
        <div className="flex flex-wrap gap-3 tracking-[0.14em]">
          <span className={cesiumReady ? "text-emerald-400" : "text-amber-400"}>● GLOBE {cesiumReady ? "READY" : "BOOTING"}</span>
          <span className="text-cyan-400">● AIS BUS WIRED</span>
          <span className="text-violet-400">● TRACKERS WIRED</span>
          <span className="text-amber-400">● LIVE OFF</span>
        </div>
        <span className="text-slate-600">DRAG / ZOOM / TILT = CESIUM CAMERA</span>
      </div>

      {viewerError && (
        <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-red-900/80 bg-black/85 px-4 py-3 text-center text-xs text-red-300 backdrop-blur-xl">{viewerError}</div>
      )}

      {selectedShip && (
        <aside className="absolute bottom-24 right-4 z-40 w-[300px] rounded-2xl border border-amber-900/70 bg-[#02080a]/92 p-4 shadow-2xl backdrop-blur-xl md:right-6">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[8px] font-bold tracking-[0.28em] text-amber-500">MARITIME CONTACT</p><h2 className="mt-1 text-lg font-semibold text-amber-100">{selectedShip.name}</h2></div>
            <button type="button" onClick={() => setSelectedShip(null)} className="text-slate-500">×</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">SOURCE</span><br /><span className="text-cyan-300">{selectedShip.source}</span></div>
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">TYPE</span><br /><span className="text-amber-300">{selectedShip.type}</span></div>
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">SPEED</span><br /><span className="text-slate-300">{selectedShip.speedKnots.toFixed(1)} kn</span></div>
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">COURSE</span><br /><span className="text-slate-300">{selectedShip.courseDeg.toFixed(0)}°</span></div>
          </div>
          <div className="mt-3 rounded-lg border border-amber-900/60 bg-amber-950/10 px-3 py-2 text-[8px] text-amber-400">SKELETON DATA • LIVE FEED NOT CONNECTED</div>
        </aside>
      )}

      <div className="absolute left-4 top-[calc(50%-16px)] z-20 hidden w-[150px] rounded-xl border border-cyan-950/60 bg-black/45 p-2 text-[8px] text-slate-600 backdrop-blur md:block">
        <div className="text-cyan-500">BASEMAP</div>
        <div className="mt-1 break-all text-slate-700">{mapUrl}</div>
      </div>
    </main>
  );
}
