"use client";

import { useMemo, useState } from "react";

const SHIPS = Array.from({ length: 24 }, (_, index) => ({
  id: `S-${String(index + 1).padStart(2, "0")}`,
  x: 8 + ((index * 17) % 84),
  y: 18 + ((index * 29) % 64),
  speed: 7 + (index % 8),
  tanker: index % 4 === 0,
}));

export default function MaritimeSkeletonOverlay() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedShip = useMemo(() => SHIPS.find((ship) => ship.id === selected) ?? null, [selected]);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-44 bg-gradient-to-t from-[#020607] via-[#020607]/55 to-transparent" />

      <div className="absolute right-4 top-[15rem] z-40 w-[250px] rounded-2xl border border-amber-950/80 bg-[#03090c]/85 p-3 shadow-2xl backdrop-blur-xl md:right-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-bold tracking-[0.28em] text-amber-500">MARITIME BUS</p>
            <p className="mt-1 text-[10px] text-slate-400">OPEN WATERS WIRED • LIVE OFF</p>
          </div>
          <span className="flex items-center gap-1 text-[8px] font-bold text-amber-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
            POWER 8%
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[8px]">
          {[
            ["Open Waters", "WIRED"],
            ["AISStream", "WIRED"],
            ["AIS-catcher", "WIRED"],
            ["VesselFinder", "SLOT"],
            ["TankerTrackers", "OSINT"],
            ["GFW", "WIRED"],
            ["OpenSky", "WIRED"],
            ["FR24", "SLOT"],
          ].map(([name, state]) => (
            <div key={name} className="rounded-lg border border-slate-900 bg-black/20 px-2 py-1.5">
              <div className="text-slate-500">{name}</div>
              <div className={state === "WIRED" ? "text-emerald-400" : state === "OSINT" ? "text-violet-400" : "text-slate-600"}>{state}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-[23%] bottom-[11%] top-[27%] z-20 pointer-events-none hidden">
        {SHIPS.map((ship, index) => {
          const selectedShip = ship.id === selected;
          return (
            <button
              key={ship.id}
              type="button"
              aria-label={`Skeleton vessel ${ship.id}`}
              className={`pointer-events-auto absolute h-2.5 w-2.5 rotate-45 border transition ${
                selectedShip
                  ? "scale-150 border-white bg-white shadow-[0_0_18px_rgba(255,255,255,.9)]"
                  : ship.tanker
                    ? "border-amber-200 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,.8)]"
                    : "border-cyan-200 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.65)]"
              }`}
              style={{
                left: `${ship.x}%`,
                top: `${ship.y}%`,
                animation: `sentinel-ship-drift ${6 + (index % 5)}s ease-in-out ${index * -0.37}s infinite alternate`,
              }}
              onClick={() => setSelected((value) => (value === ship.id ? null : ship.id))}
            />
          );
        })}
      </div>

      {selectedShip && (
        <aside className="absolute bottom-24 right-4 z-50 w-[235px] rounded-2xl border border-amber-900/70 bg-[#03090c]/95 p-3 shadow-2xl backdrop-blur-xl md:right-6">
          <p className="text-[8px] font-bold tracking-[0.28em] text-amber-500">VESSEL OBJECT</p>
          <h2 className="mt-1 text-sm font-semibold text-amber-100">{selectedShip.tanker ? "TANKER" : "MERCHANT"} {selectedShip.id}</h2>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px]">
            <div className="rounded bg-white/[0.03] p-2"><span className="text-slate-600">SPEED</span><br />{selectedShip.speed} kn</div>
            <div className="rounded bg-white/[0.03] p-2"><span className="text-slate-600">STATE</span><br />MOVING</div>
            <div className="rounded bg-white/[0.03] p-2"><span className="text-slate-600">SOURCE</span><br />SKELETON</div>
            <div className="rounded bg-white/[0.03] p-2"><span className="text-slate-600">AIS</span><br />WIRED</div>
          </div>
          <div className="mt-2 rounded border border-amber-900/50 bg-amber-950/15 px-2 py-1.5 text-[8px] text-amber-400">DEMO OBJECT • NOT LIVE</div>
        </aside>
      )}

      <style jsx>{`
        @keyframes sentinel-ship-drift {
          from { transform: translate3d(-7px, 2px, 0) rotate(45deg); }
          to { transform: translate3d(9px, -2px, 0) rotate(45deg); }
        }
      `}</style>
    </>
  );
}
