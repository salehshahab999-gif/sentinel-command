"use client";

import { useMemo, useRef, useState } from "react";
import { SATELLITE_LAYERS, SKELETON_SATELLITES } from "../../core/satellite/satellite-catalog";
import type { SatelliteLayerId } from "../../core/satellite/satellite-contracts";

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

export default function SatelliteIntelligence() {
  const [enabledLayers, setEnabledLayers] = useState<Record<SatelliteLayerId, boolean>>(
    () => Object.fromEntries(
      SATELLITE_LAYERS.map((layer) => [layer.id, layer.defaultEnabled]),
    ) as Record<SatelliteLayerId, boolean>,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: -8, y: -18 });
  const dragRef = useRef({ active: false, x: 0, y: 0, baseX: -8, baseY: -18 });

  const selected = useMemo(
    () => SKELETON_SATELLITES.find((satellite) => satellite.id === selectedId) ?? null,
    [selectedId],
  );

  const toggleLayer = (id: SatelliteLayerId) => {
    setEnabledLayers((current) => ({ ...current, [id]: !current[id] }));
  };

  const beginDrag = (clientX: number, clientY: number) => {
    dragRef.current = {
      active: true,
      x: clientX,
      y: clientY,
      baseX: rotation.x,
      baseY: rotation.y,
    };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragRef.current.active) return;
    const dx = clientX - dragRef.current.x;
    const dy = clientY - dragRef.current.y;
    setRotation({
      x: Math.max(-70, Math.min(70, dragRef.current.baseX - dy * 0.22)),
      y: dragRef.current.baseY + dx * 0.22,
    });
  };

  const endDrag = () => {
    dragRef.current.active = false;
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#020607] text-white select-none"
      onPointerMove={(event) => moveDrag(event.clientX, event.clientY)}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(18,57,70,.42),transparent_38%),radial-gradient(circle_at_12%_78%,rgba(25,192,186,.07),transparent_30%),linear-gradient(180deg,#020607,#010304)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(25,192,186,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(25,192,186,.07)_1px,transparent_1px)] [background-size:56px_56px]" />

      <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4 md:p-6 pointer-events-none">
        <div className="pointer-events-auto">
          <p className="text-[9px] font-bold tracking-[0.38em] text-cyan-500">SENTINEL COMMAND CENTER</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">GLOBAL INTELLIGENCE / SPACE</h1>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-slate-600">INTERACTION TEST • LIVE SOURCES POWERED OFF</p>
        </div>

        <div className="flex pointer-events-auto items-center gap-2 rounded-full border border-amber-900/70 bg-black/60 px-3 py-2 text-[9px] font-bold tracking-[0.2em] text-amber-400 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          SKELETON
        </div>
      </header>

      <div className="absolute left-4 top-28 z-30 hidden w-[190px] pointer-events-auto md:block">
        <div className="rounded-xl border border-cyan-950/80 bg-black/55 p-2.5 backdrop-blur-md">
          <p className="mb-2 px-1 text-[9px] font-bold tracking-[0.25em] text-slate-600">LAYERS</p>
          <div className="flex flex-wrap gap-1.5">
            {SATELLITE_LAYERS.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={`rounded-md border px-2 py-1 text-[9px] font-medium transition ${
                  enabledLayers[layer.id]
                    ? `${layerAccent[layer.id]} bg-white/[0.03]`
                    : "border-slate-900 text-slate-700"
                }`}
                title={layer.description}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="absolute left-1/2 top-1/2 z-10 h-[min(78vw,78vh)] w-[min(78vw,78vh)] min-h-[320px] min-w-[320px] max-h-[760px] max-w-[760px] -translate-x-1/2 -translate-y-1/2 [perspective:1200px]"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          beginDrag(event.clientX, event.clientY);
        }}
      >
        <div
          className="relative h-full w-full rounded-full border border-cyan-300/20 bg-[radial-gradient(circle_at_31%_27%,rgba(255,255,255,.23),transparent_11%),radial-gradient(circle_at_35%_33%,#216d76_0%,#11434f_25%,#082933_52%,#020b10_74%,#010407_100%)] shadow-[0_0_120px_rgba(25,192,186,.16),inset_-70px_-35px_100px_rgba(0,0,0,.9)] [transform-style:preserve-3d] transition-transform duration-75"
          style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
        >
          <div className="absolute inset-[7%] rounded-full border border-cyan-200/10" />
          <div className="absolute inset-[20%] rounded-full border border-cyan-200/[0.08]" />
          <div className="absolute inset-[33%] rounded-full border border-cyan-200/[0.06]" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-[17deg] bg-cyan-100/[0.08]" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 -rotate-[35deg] bg-cyan-100/[0.05]" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 rotate-[8deg] bg-cyan-100/[0.07]" />

          {enabledLayers.orbits && (
            <>
              <div className="absolute left-[-13%] top-[28%] h-[42%] w-[126%] rotate-[18deg] rounded-[50%] border border-violet-400/25 [transform:translateZ(18px)]" />
              <div className="absolute left-[-13%] top-[31%] h-[40%] w-[126%] -rotate-[29deg] rounded-[50%] border border-violet-400/15 [transform:translateZ(14px)]" />
            </>
          )}

          {enabledLayers.geography && (
            <div className="absolute inset-[12%] rounded-full border border-emerald-300/[0.05] [background-image:radial-gradient(circle_at_20%_35%,rgba(34,197,94,.08),transparent_8%),radial-gradient(circle_at_70%_58%,rgba(34,197,94,.07),transparent_10%),radial-gradient(circle_at_55%_28%,rgba(34,197,94,.05),transparent_12%)]" />
          )}

          {enabledLayers.satellites && SKELETON_SATELLITES.map((satellite, index) => {
            const angle = (index / SKELETON_SATELLITES.length) * Math.PI * 2;
            const radius = 36 + (index % 4) * 5;
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius * 0.62;
            const isSelected = selectedId === satellite.id;
            return (
              <button
                key={satellite.id}
                type="button"
                aria-label={`Satellite ${index + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(isSelected ? null : satellite.id);
                }}
                className={`absolute z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border transition-all duration-150 ${
                  isSelected
                    ? "h-4 w-4 border-white bg-cyan-100 shadow-[0_0_22px_rgba(103,232,249,.95)]"
                    : "border-cyan-300 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.75)]"
                }`}
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[680px] -translate-x-1/2">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/55 p-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] tracking-[0.16em]">
            <span className="text-cyan-500">DRAG = ROTATE</span>
            <span className="text-slate-600">CLICK A SQUARE = INSPECT</span>
            <span className="text-amber-500">LIVE COLLECTION OFF</span>
          </div>
        </div>
      </div>

      {selected && (
        <aside className="absolute right-4 top-28 z-40 w-[270px] rounded-2xl border border-cyan-900/80 bg-[#03090c]/90 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl md:right-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold tracking-[0.28em] text-cyan-500">SELECTED OBJECT</p>
              <h2 className="mt-1 text-lg font-semibold text-cyan-100">{selected.name}</h2>
              <p className="text-[10px] text-slate-600">{selected.id} • NORAD {selected.noradId ?? "pending"}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-500 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">SOURCE</span><br /><span className="text-cyan-300">{selected.source}</span></div>
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">MODE</span><br /><span className="text-amber-300">{selected.dataMode}</span></div>
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">ALTITUDE</span><br /><span className="text-slate-300">{selected.altitudeKm.toLocaleString()} km</span></div>
            <div className="rounded-lg bg-white/[0.03] p-2"><span className="text-slate-600">MISSION</span><br /><span className="text-slate-300">{selected.mission}</span></div>
          </div>
          <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/10 px-3 py-2 text-[9px] leading-relaxed text-amber-400">
            TEST DATA ONLY • NOT A LIVE POSITION
          </div>
        </aside>
      )}

      <div className="absolute bottom-20 right-4 z-30 hidden rounded-lg border border-cyan-950/80 bg-black/50 px-3 py-2 text-[9px] text-slate-600 md:block">
        3D INTERACTION SHELL • PROVIDERS POWERED OFF
      </div>
    </main>
  );
}
