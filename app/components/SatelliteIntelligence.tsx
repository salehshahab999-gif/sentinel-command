"use client";

import { useMemo, useState } from "react";
import { SATELLITE_LAYERS, SATELLITE_WIRE_STATUS, SKELETON_SATELLITES } from "../../core/satellite/satellite-catalog";
import type { SatelliteLayerId } from "../../core/satellite/satellite-contracts";

const layerColors: Record<SatelliteLayerId, string> = {
  baseMap: "text-cyan-300",
  satellites: "text-green-300",
  orbits: "text-violet-300",
  fires: "text-orange-300",
  weather: "text-blue-300",
  clouds: "text-slate-300",
  ocean: "text-teal-300",
  ais: "text-amber-300",
  geography: "text-emerald-300",
  events: "text-yellow-300",
  alerts: "text-red-300",
};

export default function SatelliteIntelligence() {
  const [enabledLayers, setEnabledLayers] = useState<Record<SatelliteLayerId, boolean>>(
    () => Object.fromEntries(SATELLITE_LAYERS.map((layer) => [layer.id, layer.defaultEnabled])) as Record<SatelliteLayerId, boolean>,
  );
  const [selectedId, setSelectedId] = useState("SAT-01");

  const selected = useMemo(
    () => SKELETON_SATELLITES.find((satellite) => satellite.id === selectedId) ?? SKELETON_SATELLITES[0],
    [selectedId],
  );

  const toggleLayer = (id: SatelliteLayerId) => {
    setEnabledLayers((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <section className="col-span-1 lg:col-span-3 overflow-hidden rounded-2xl border border-cyan-950 bg-[#050b10] shadow-2xl shadow-cyan-950/20">
      <div className="flex flex-col gap-4 border-b border-cyan-950/80 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.35em] text-cyan-500">GLOBAL INTELLIGENCE / SPACE LAYER</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-cyan-100">🛰 SATELLITE INTELLIGENCE</h2>
          <p className="mt-1 text-xs text-slate-500">3D globe skeleton • providers wired • live collection POWERED OFF</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          SKELETON MODE
        </div>
      </div>

      <div className="grid min-h-[680px] lg:grid-cols-[230px_minmax(0,1fr)_270px]">
        <aside className="border-b border-cyan-950/70 p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-[10px] font-bold tracking-[0.25em] text-slate-500">LAYERS</p>
          <div className="space-y-1.5">
            {SATELLITE_LAYERS.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-xs transition hover:border-cyan-900 hover:bg-cyan-950/30"
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${enabledLayers[layer.id] ? "border-cyan-500 bg-cyan-500/20 text-cyan-300" : "border-slate-700 text-transparent"}`}>✓</span>
                <span className={enabledLayers[layer.id] ? layerColors[layer.id] : "text-slate-500"}>{layer.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="relative min-h-[520px] overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(9,68,82,0.35),transparent_38%),linear-gradient(135deg,#02070b,#06131a_50%,#020509)]">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="absolute left-4 top-4 z-10 rounded border border-cyan-900 bg-black/70 px-3 py-2 text-[10px] text-cyan-400">
            ONLINE BASE MAP • 3D GLOBE ENGINE READY
          </div>
          <div className="absolute right-4 top-4 z-10 flex gap-2 text-[10px] text-slate-500">
            <span>ZOOM + / −</span><span>•</span><span>ROTATE</span>
          </div>

          <div className="absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20 bg-[radial-gradient(circle_at_35%_28%,#2c8994_0%,#12515c_24%,#06252f_52%,#020a0f_76%)] shadow-[0_0_90px_rgba(34,211,238,.18),inset_-45px_-25px_80px_rgba(0,0,0,.8)] md:h-[470px] md:w-[470px]">
            <div className="absolute inset-[12%] rounded-full border border-cyan-300/10" />
            <div className="absolute inset-[25%] rounded-full border border-cyan-300/10" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/10" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-300/10" />

            {enabledLayers.satellites && SKELETON_SATELLITES.map((satellite, index) => {
              const angle = (index / SKELETON_SATELLITES.length) * Math.PI * 2;
              const radius = 39 + (index % 3) * 7;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius * 0.62;
              return (
                <button
                  key={satellite.id}
                  type="button"
                  onClick={() => setSelectedId(satellite.id)}
                  title={satellite.name}
                  className={`absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border transition ${selectedId === satellite.id ? "scale-150 border-white bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,.95)]" : "border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.7)]"}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              );
            })}

            {enabledLayers.orbits && <>
              <div className="absolute left-[-8%] top-[30%] h-[42%] w-[116%] rotate-[22deg] rounded-[50%] border border-violet-400/30" />
              <div className="absolute left-[-8%] top-[31%] h-[42%] w-[116%] rotate-[-24deg] rounded-[50%] border border-violet-400/20" />
            </>}
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2">
            <span className="rounded border border-green-900 bg-black/70 px-2 py-1 text-[10px] text-green-400">10 SATELLITE SLOTS</span>
            <span className="rounded border border-cyan-900 bg-black/70 px-2 py-1 text-[10px] text-cyan-400">LIVE MAP READY</span>
            <span className="rounded border border-amber-900 bg-black/70 px-2 py-1 text-[10px] text-amber-400">LIVE SOURCES OFF</span>
          </div>
        </div>

        <aside className="border-t border-cyan-950/70 bg-black/20 p-4 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-bold tracking-[0.25em] text-slate-500">OPEN / SELECTED</p>
          <div className="mt-3 rounded-xl border border-cyan-900/80 bg-cyan-950/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-cyan-100">{selected.name}</p>
                <p className="text-[10px] text-slate-500">{selected.id} • NORAD {selected.noradId ?? "pending"}</p>
              </div>
              <span className="rounded bg-green-950/60 px-2 py-1 text-[9px] text-green-400">{selected.status}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded bg-black/40 p-2"><span className="text-slate-600">SOURCE</span><br /><span className="text-cyan-300">{selected.source}</span></div>
              <div className="rounded bg-black/40 p-2"><span className="text-slate-600">MODE</span><br /><span className="text-amber-300">{selected.dataMode}</span></div>
              <div className="rounded bg-black/40 p-2"><span className="text-slate-600">ALT</span><br /><span className="text-slate-300">{selected.altitudeKm.toLocaleString()} km</span></div>
              <div className="rounded bg-black/40 p-2"><span className="text-slate-600">MISSION</span><br /><span className="text-slate-300">{selected.mission}</span></div>
            </div>
          </div>

          <p className="mb-2 mt-6 text-[10px] font-bold tracking-[0.25em] text-slate-500">WIRE STATUS</p>
          <div className="space-y-1.5">
            {SATELLITE_WIRE_STATUS.map((wire) => (
              <div key={wire.component} className="rounded-lg border border-slate-900 bg-black/30 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-slate-300">{wire.component}</span>
                  <span className={wire.status === "POWERED_OFF" ? "text-amber-500" : wire.status === "READY" ? "text-green-500" : "text-slate-500"}>{wire.status}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
