"use client";

import { useState } from "react";
import type { MapSearchResult } from "../../core/map/map-search";

type SearchMode = "OFFLINE" | "CACHE" | "ONLINE" | "";

export default function MapSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const [mode, setMode] = useState<SearchMode>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [source, setSource] = useState("");
  const [latMin, setLatMin] = useState("");
  const [latMax, setLatMax] = useState("");
  const [lonMin, setLonMin] = useState("");
  const [lonMax, setLonMax] = useState("");

  const focus = (result: MapSearchResult) => {
    window.dispatchEvent(new CustomEvent<MapSearchResult>("sentinel-map-focus", { detail: result }));
  };

  const runSearch = async () => {
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: value });
      if (type) params.set("type", type);
      if (source) params.set("source", source);
      if (latMin) params.set("latMin", latMin);
      if (latMax) params.set("latMax", latMax);
      if (lonMin) params.set("lonMin", lonMin);
      if (lonMax) params.set("lonMax", lonMax);

      const response = await fetch(`/api/map/search?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        ok?: boolean;
        mode?: SearchMode;
        results?: MapSearchResult[];
        error?: string;
      };

      setResults(payload.results ?? []);
      setMode(payload.mode ?? "");
      if (payload.error) setError(payload.error);
    } catch (searchError) {
      setResults([]);
      setMode("OFFLINE");
      setError(searchError instanceof Error ? searchError.message : "Map search failed");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setType("");
    setSource("");
    setLatMin("");
    setLatMax("");
    setLonMin("");
    setLonMax("");
  };

  return (
    <section className="absolute left-3 top-[calc(6rem+19rem)] z-30 w-[250px] rounded-xl border border-cyan-950/80 bg-black/78 p-3 shadow-2xl backdrop-blur-xl md:left-5 md:w-[300px]">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold tracking-[0.28em] text-slate-500">MAP SEARCH</p>
        <span className={`text-[8px] font-bold ${mode === "ONLINE" ? "text-amber-300" : mode === "CACHE" ? "text-violet-300" : "text-emerald-400"}`}>
          {loading ? "SEARCHING" : mode || "LOCAL-FIRST"}
        </span>
      </div>

      <div className="mt-2 flex gap-1.5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void runSearch();
          }}
          placeholder="City / village / coordinates..."
          className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-black/70 px-3 py-2 text-[10px] text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-800"
        />
        <button type="button" onClick={() => void runSearch()} disabled={loading} className="rounded-lg border border-cyan-800 bg-cyan-950/40 px-3 py-2 text-[9px] font-bold text-cyan-300 hover:bg-cyan-900/40 disabled:opacity-50">🔎</button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300 outline-none">
          <option value="">All types</option>
          <option value="city">City</option>
          <option value="coordinate">Coordinate</option>
          <option value="village">Village</option>
          <option value="place">Place</option>
        </select>
        <select value={source} onChange={(event) => setSource(event.target.value)} className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300 outline-none">
          <option value="">All sources</option>
          <option value="LOCAL">Local</option>
          <option value="CACHE">Cache</option>
          <option value="ONLINE">Online</option>
        </select>
      </div>

      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <input value={latMin} onChange={(event) => setLatMin(event.target.value)} placeholder="Lat min" inputMode="decimal" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300 outline-none" />
        <input value={latMax} onChange={(event) => setLatMax(event.target.value)} placeholder="Lat max" inputMode="decimal" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300 outline-none" />
        <input value={lonMin} onChange={(event) => setLonMin(event.target.value)} placeholder="Lon min" inputMode="decimal" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300 outline-none" />
        <input value={lonMax} onChange={(event) => setLonMax(event.target.value)} placeholder="Lon max" inputMode="decimal" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300 outline-none" />
      </div>

      <button type="button" onClick={clearFilters} className="mt-1.5 text-[7px] font-bold tracking-[0.14em] text-slate-600 hover:text-slate-300">CLEAR FILTERS</button>

      <p className="mt-2 text-[8px] leading-4 text-slate-600">
        مثال: Tehran • روستا • 35.6892, 51.3890
      </p>

      {error && <p className="mt-2 rounded-md border border-red-950 bg-red-950/20 p-2 text-[8px] text-red-300">{error}</p>}

      {results.length > 0 && (
        <div className="mt-2 max-h-52 space-y-1 overflow-auto pr-1">
          {results.map((result) => (
            <button key={result.id} type="button" onClick={() => focus(result)} className="flex w-full items-start justify-between gap-2 rounded-lg border border-slate-900 bg-white/[0.015] px-2 py-2 text-left hover:border-cyan-900">
              <span className="min-w-0">
                <span className="block truncate text-[9px] font-medium text-slate-200">{result.name}</span>
                <span className="mt-0.5 block truncate text-[7px] text-slate-600">{result.displayName}</span>
                <span className="mt-0.5 block text-[7px] text-slate-700">{result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}</span>
              </span>
              <span className="shrink-0 text-[7px] font-bold text-emerald-500">{result.source}</span>
            </button>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <button type="button" onClick={() => window.open(results[0].openMapsUrl, "_blank", "noopener,noreferrer")} className="mt-2 w-full rounded-md border border-slate-800 px-2 py-1.5 text-[8px] font-bold tracking-[0.12em] text-slate-500 hover:border-slate-700 hover:text-slate-200">OPEN SELECTED IN GOOGLE MAPS ↗</button>
      )}
    </section>
  );
}
