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

const STARFIELD = Array.from({ length: 72 }, (_, index) => ({
  left: (index * 37) % 100,
  top: (index * 61) % 100,
  size: 1 + (index % 3),
  delay: (index % 9) * -0.7,
  duration: 3 + (index % 5),
}));

export default function SatelliteIntelligence() {
  const [enabledLayers, setEnabledLayers] = useState<Record<SatelliteLayerId, boolean>>(
    () => Object.fromEntries(
      SATELLITE_LAYERS.map((layer) => [layer.id, layer.defaultEnabled]),
    ) as Record<SatelliteLayerId, boolean>,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: -8, y: -18 });
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef({ active: false, x: 0, y: 0, baseX: -8, baseY: -18 });

  const selected = useMemo(
    () => SKELETON_SATELLITES.find((satellite) => satellite.id === selectedId) ?? null,
    [selectedId],
  );

  const toggleLayer = (id: SatelliteLayerId) => {
    setEnabledLayers((current) => ({ ...current, [id]: !current[id] }));
  };

  const beginDrag = (clientX: number, clientY: number) => {
    dragRef.current = { active: true, x: clientX, y: clientY, baseX: rotation.x, baseY: rotation.y };
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

  const endDrag = () => { dragRef.current.active = false; };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#010305] text-white select-none"
      onPointerMove={(event) => moveDrag(event.clientX, event.clientY)}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(18,74,95,.34),transparent_32%),radial-gradient(circle_at_20%_20%,rgba(34,211,238,.08),transparent_24%),linear-gradient(180deg,#010306,#020507 60%,#000102)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(34,211,238,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.07)_1px,transparent_1px)] [background-size:64px_64px]" />

      {STARFIELD.map((star, index) => (
        <span
          key={`star-${index}`}
          className="absolute rounded-full bg-cyan-100/70"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `sentinel-star ${star.duration}s ease-in-out ${star.delay}s infinite alternate`,
          }}
        />
      ))}

      <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4 md:p-6">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/55 px-4 py-3 shadow-[0_0_40px_rgba(34,211,238,.05)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.9)]" />
            <p className="text-[9px] font-bold tracking-[0.38em] text-cyan-400">SENTINEL COMMAND CENTER</p>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">GLOBAL INTELLIGENCE / SPACE</h1>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-slate-500">VISUAL TEST SHELL • LIVE SOURCES OFF</p>
        </div>
        <div className="rounded-full border border-amber-900/70 bg-black/65 px-3 py-2 text-[9px] font-bold tracking-[0.18em] text-amber-300 backdrop-blur-xl">POWER 12% • SKELETON</div>
      </header>

      <aside className="absolute left-4 top-28 z-30 hidden w-[205px] md:block">
        <div className="rounded-2xl border border-cyan-950/80 bg-black/55 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-bold tracking-[0.26em] text-slate-500">LAYERS</p>
            <span className="text-[8px] text-slate-700">{Object.values(enabledLayers).filter(Boolean).length} ACTIVE</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SATELLITE_LAYERS.map((layer) => (
              <button key={layer.id} type="button" onClick={() => toggleLayer(layer.id)} className={`rounded-md border px-2 py-1 text-[9px] font-medium transition duration-200 hover:-translate-y-0.5 ${enabledLayers[layer.id] ? `${layerAccent[layer.id]} bg-white/[0.04] shadow-[0_0_12px_rgba(34,211,238,.05)]` : "border-slate-900 text-slate-700"}`}>
                {layer.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-violet-950/60 bg-black/50 p-3 backdrop-blur-xl">
          <p className="text-[8px] font-bold tracking-[0.25em] text-violet-400">VIEWPORT</p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={() => setZoom((value) => Math.min(1.32, value + 0.08))} className="rounded-lg border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white">+</button>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-900"><div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${((zoom - 0.72) / 0.6) * 100}%` }} /></div>
            <button type="button" onClick={() => setZoom((value) => Math.max(0.72, value - 0.08))} className="rounded-lg border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white">−</button>
          </div>
          <p className="mt-2 text-[8px] tracking-[0.18em] text-slate-600">+ / − = ZOOM • DRAG = ROTATE</p>
        </div>
      </aside>

      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 [perspective:1400px]">
        <div className="relative" style={{ width: `${Math.min(790, Math.max(410, 58 * 10)) * zoom}px`, height: `${Math.min(790, Math.max(410, 58 * 10)) * zoom}px` }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); beginDrag(event.clientX, event.clientY); }}>
          <div className="absolute inset-[-9%] rounded-full border border-cyan-300/[0.08] shadow-[0_0_100px_rgba(34,211,238,.10)]" />
          <div className="absolute inset-[-14%] rounded-full border border-violet-300/[0.05]" style={{ animation: "sentinel-orbit-a 18s linear infinite" }} />
          <div className="absolute inset-[-20%] rounded-full border border-cyan-300/[0.04]" style={{ animation: "sentinel-orbit-b 28s linear infinite reverse" }} />
          <div className="relative h-full w-full overflow-hidden rounded-full border border-cyan-200/25 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,.28),transparent_10%),radial-gradient(circle_at_42%_40%,#1b6670_0%,#0d3d49_27%,#072630_53%,#021017_76%,#000409_100%)] shadow-[0_0_140px_rgba(34,211,238,.18),inset_-90px_-60px_120px_rgba(0,0,0,.92),inset_35px_20px_70px_rgba(255,255,255,.04)] [transform-style:preserve-3d]" style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
            <div className="absolute inset-[6%] rounded-full border border-cyan-100/[0.08]" />
            <div className="absolute inset-[17%] rounded-full border border-cyan-100/[0.05]" />
            <div className="absolute inset-[28%] rounded-full border border-cyan-100/[0.04]" />
            <div className="absolute left-1/2 top-[-8%] h-[116%] w-px -translate-x-1/2 rotate-[20deg] bg-cyan-50/[0.06]" />
            <div className="absolute left-1/2 top-[-8%] h-[116%] w-px -translate-x-1/2 -rotate-[33deg] bg-cyan-50/[0.045]" />
            <div className="absolute left-[-8%] top-1/2 h-px w-[116%] -translate-y-1/2 rotate-[10deg] bg-cyan-50/[0.045]" />

            {enabledLayers.geography && <div className="absolute inset-[9%] rounded-full opacity-75 [background-image:radial-gradient(circle_at_18%_32%,rgba(34,197,94,.14),transparent_9%),radial-gradient(circle_at_62%_25%,rgba(34,197,94,.10),transparent_10%),radial-gradient(circle_at_73%_62%,rgba(34,197,94,.11),transparent_11%),radial-gradient(circle_at_34%_70%,rgba(34,197,94,.08),transparent_12%)]" />}

            {enabledLayers.orbits && <>
              <div className="absolute left-[-11%] top-[26%] h-[45%] w-[122%] rotate-[18deg] rounded-[50%] border border-violet-300/30" />
              <div className="absolute left-[-11%] top-[30%] h-[39%] w-[122%] -rotate-[27deg] rounded-[50%] border border-violet-300/20" />
            </>}

            {enabledLayers.satellites && SKELETON_SATELLITES.map((satellite, index) => {
              const angle = (index / SKELETON_SATELLITES.length) * Math.PI * 2;
              const radius = 31 + (index % 5) * 7;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius * 0.64;
              const isSelected = selectedId === satellite.id;
              return (
                <button key={satellite.id} type="button" aria-label={`Satellite ${index + 1}`} onClick={(event) => { event.stopPropagation(); setSelectedId(isSelected ? null : satellite.id); }} className={`absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 border transition-all duration-200 ${isSelected ? "h-5 w-5 border-white bg-cyan-100 shadow-[0_0_28px_rgba(103,232,249,1)]" : "border-cyan-300 bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.8)]"}`} style={{ left: `${x}%`, top: `${y}%` }} />
              );
            })}

            <div className="pointer-events-none absolute inset-[8%] rounded-full border border-white/[0.03]" style={{ animation: "sentinel-scan 7s linear infinite" }} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[760px] -translate-x-1/2 rounded-2xl border border-cyan-950/80 bg-black/60 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[8px] tracking-[0.18em]">
          <span className="text-cyan-400">● VISUAL SIMULATION</span>
          <span className="text-emerald-400">● SATELLITE CATALOG READY</span>
          <span className="text-amber-400">● MARITIME WIRED</span>
          <span className="text-slate-500">● LIVE COLLECTION OFF</span>
        </div>
      </div>

      {selected && <aside className="absolute right-4 top-28 z-40 w-[285px] rounded-2xl border border-cyan-900/80 bg-[#02090c]/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,.45)] backdrop-blur-xl md:right-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold tracking-[0.28em] text-cyan-500">SELECTED OBJECT</p>
            <h2 className="mt-1 text-lg font-semibold text-cyan-100">{selected.name}</h2>
            <p className="text-[10px] text-slate-600">{selected.id} • NORAD {selected.noradId ?? "pending"}</p>
          </div>
          <button type="button" onClick={() => setSelectedId(null)} className="rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-500 hover:text-white">×</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-lg bg-white/[0.035] p-2"><span className="text-slate-600">SOURCE</span><br /><span className="text-cyan-300">{selected.source}</span></div>
          <div className="rounded-lg bg-white/[0.035] p-2"><span className="text-slate-600">MODE</span><br /><span className="text-amber-300">{selected.dataMode}</span></div>
          <div className="rounded-lg bg-white/[0.035] p-2"><span className="text-slate-600">ALTITUDE</span><br /><span className="text-slate-300">{selected.altitudeKm.toLocaleString()} km</span></div>
          <div className="rounded-lg bg-white/[0.035] p-2"><span className="text-slate-600">MISSION</span><br /><span className="text-slate-300">{selected.mission}</span></div>
        </div>
        <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/10 px-3 py-2 text-[9px] leading-relaxed text-amber-300">TEST DATA ONLY • NO LIVE POSITION</div>
      </aside>}

      <style jsx>{`
        @keyframes sentinel-star { from { opacity: .18; transform: scale(.7); } to { opacity: .85; transform: scale(1.35); } }
        @keyframes sentinel-orbit-a { from { transform: rotate(0deg) scaleY(.58); } to { transform: rotate(360deg) scaleY(.58); } }
        @keyframes sentinel-orbit-b { from { transform: rotate(0deg) scaleY(.72); } to { transform: rotate(360deg) scaleY(.72); } }
        @keyframes sentinel-scan { 0% { transform: translateX(-120%) rotate(18deg); opacity: 0; } 18% { opacity: .35; } 50% { opacity: .1; } 100% { transform: translateX(120%) rotate(18deg); opacity: 0; } }
      `}</style>
    </main>
  );
}
