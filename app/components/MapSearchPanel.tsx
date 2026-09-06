"use client";

import { useState } from "react";
import type { MapSearchResult } from "../../core/map/map-search";
import type { UniversalMapFilter } from "../../core/map/universal-filter";

type SearchMode = "OFFLINE" | "CACHE" | "ONLINE" | "";

export default function MapSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const [mode, setMode] = useState<SearchMode>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState("");
  const [type, setType] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [mapMode, setMapMode] = useState("");
  const [latMin, setLatMin] = useState("");
  const [latMax, setLatMax] = useState("");
  const [lonMin, setLonMin] = useState("");
  const [lonMax, setLonMax] = useState("");
  const [altMinKm, setAltMinKm] = useState("");
  const [altMaxKm, setAltMaxKm] = useState("");
  const [speedMinKmh, setSpeedMinKmh] = useState("");
  const [speedMaxKmh, setSpeedMaxKmh] = useState("");
  const [headingMin, setHeadingMin] = useState("");
  const [headingMax, setHeadingMax] = useState("");
  const [elevationMin, setElevationMin] = useState("");
  const [elevationMax, setElevationMax] = useState("");
  const [frame, setFrame] = useState("");

  const dispatchUniversalFilter = () => {
    const filter: UniversalMapFilter = {
      domains: domain ? [domain as NonNullable<UniversalMapFilter["domains"]>[number]] : undefined,
      types: type ? [type] : undefined,
      sources: source ? [source] : undefined,
      statuses: status ? [status] : undefined,
      modes: mapMode ? [mapMode] : undefined,
      minLatitude: latMin ? Number(latMin) : undefined,
      maxLatitude: latMax ? Number(latMax) : undefined,
      minLongitude: lonMin ? Number(lonMin) : undefined,
      maxLongitude: lonMax ? Number(lonMax) : undefined,
      minAltitudeKm: altMinKm ? Number(altMinKm) : undefined,
      maxAltitudeKm: altMaxKm ? Number(altMaxKm) : undefined,
      minSpeedKmH: speedMinKmh ? Number(speedMinKmh) : undefined,
      maxSpeedKmH: speedMaxKmh ? Number(speedMaxKmh) : undefined,
      minHeadingDeg: headingMin ? Number(headingMin) : undefined,
      maxHeadingDeg: headingMax ? Number(headingMax) : undefined,
      minElevationDeg: elevationMin ? Number(elevationMin) : undefined,
      maxElevationDeg: elevationMax ? Number(elevationMax) : undefined,
      referenceFrames: frame ? [frame] : undefined,
    };
    window.dispatchEvent(new CustomEvent<UniversalMapFilter>("sentinel-map-universal-filter", { detail: filter }));
  };

  const focus = (result: MapSearchResult) => {
    window.dispatchEvent(new CustomEvent<MapSearchResult>("sentinel-map-focus", { detail: result }));
  };

  const runSearch = async () => {
    const value = query.trim();
    dispatchUniversalFilter();
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
      const payload = (await response.json()) as { ok?: boolean; mode?: SearchMode; results?: MapSearchResult[]; error?: string };
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
    setDomain(""); setType(""); setSource(""); setStatus(""); setMapMode("");
    setLatMin(""); setLatMax(""); setLonMin(""); setLonMax("");
    setAltMinKm(""); setAltMaxKm(""); setSpeedMinKmh(""); setSpeedMaxKmh("");
    setHeadingMin(""); setHeadingMax(""); setElevationMin(""); setElevationMax(""); setFrame("");
    window.dispatchEvent(new CustomEvent<UniversalMapFilter>("sentinel-map-universal-filter", { detail: {} }));
  };

  return (
    <section className="absolute left-3 top-[calc(6rem+19rem)] z-30 w-[270px] rounded-xl border border-cyan-950/80 bg-black/80 p-3 shadow-2xl backdrop-blur-xl md:left-5 md:w-[320px]">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold tracking-[0.28em] text-slate-500">UNIVERSAL MAP FILTER</p>
        <span className={`text-[8px] font-bold ${mode === "ONLINE" ? "text-amber-300" : mode === "CACHE" ? "text-violet-300" : "text-emerald-400"}`}>{loading ? "SEARCHING" : mode || "READY"}</span>
      </div>
      <div className="mt-2 flex gap-1.5">
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runSearch(); }} placeholder="Place / satellite / aircraft / ship..." className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-black/70 px-3 py-2 text-[10px] text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-800" />
        <button type="button" onClick={() => void runSearch()} disabled={loading} className="rounded-lg border border-cyan-800 bg-cyan-950/40 px-3 py-2 text-[9px] font-bold text-cyan-300 disabled:opacity-50">🔎</button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <select value={domain} onChange={(event) => setDomain(event.target.value)} className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300"><option value="">All domains</option><option value="MAP">Map</option><option value="SATELLITE">Satellite</option><option value="AIRCRAFT">Aircraft</option><option value="MARITIME">Maritime</option><option value="EVENT">Event</option><option value="ALERT">Alert</option><option value="WEATHER">Weather</option></select>
        <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300"><option value="">All types</option><option value="city">City</option><option value="coordinate">Coordinate</option><option value="satellite">Satellite</option><option value="aircraft">Aircraft</option><option value="ship">Ship</option><option value="event">Event</option></select>
        <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Source" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300" />
        <input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="Status" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300" />
        <input value={mapMode} onChange={(event) => setMapMode(event.target.value)} placeholder="Mode" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300" />
        <input value={frame} onChange={(event) => setFrame(event.target.value)} placeholder="Frame e.g. WGS84" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300" />
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {[[latMin,setLatMin,"Lat min"],[latMax,setLatMax,"Lat max"],[lonMin,setLonMin,"Lon min"],[lonMax,setLonMax,"Lon max"],[altMinKm,setAltMinKm,"Alt min km"],[altMaxKm,setAltMaxKm,"Alt max km"],[speedMinKmh,setSpeedMinKmh,"Speed min km/h"],[speedMaxKmh,setSpeedMaxKmh,"Speed max km/h"],[headingMin,setHeadingMin,"Heading min"],[headingMax,setHeadingMax,"Heading max"],[elevationMin,setElevationMin,"Elev min"],[elevationMax,setElevationMax,"Elev max"]].map(([value,setter,placeholder]) => <input key={placeholder as string} value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} placeholder={placeholder as string} inputMode="decimal" className="rounded-md border border-slate-800 bg-black/70 px-2 py-1.5 text-[8px] text-slate-300" />)}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[7px] text-slate-600">Same filter contract for map + future live layers</span>
        <button type="button" onClick={clearFilters} className="text-[7px] font-bold tracking-[0.14em] text-slate-600 hover:text-slate-300">CLEAR</button>
      </div>
      {error && <p className="mt-2 rounded-md border border-red-950 bg-red-950/20 p-2 text-[8px] text-red-300">{error}</p>}
      {results.length > 0 && <div className="mt-2 max-h-44 space-y-1 overflow-auto pr-1">{results.map((result) => <button key={result.id} type="button" onClick={() => focus(result)} className="flex w-full items-start justify-between gap-2 rounded-lg border border-slate-900 bg-white/[0.015] px-2 py-2 text-left hover:border-cyan-900"><span className="min-w-0"><span className="block truncate text-[9px] font-medium text-slate-200">{result.name}</span><span className="mt-0.5 block truncate text-[7px] text-slate-600">{result.displayName}</span><span className="mt-0.5 block text-[7px] text-slate-700">{result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}</span></span><span className="shrink-0 text-[7px] font-bold text-emerald-500">{result.source}</span></button>)}</div>}
      {results.length > 0 && <button type="button" onClick={() => window.open(results[0].openMapsUrl, "_blank", "noopener,noreferrer")} className="mt-2 w-full rounded-md border border-slate-800 px-2 py-1.5 text-[8px] font-bold tracking-[0.12em] text-slate-500">OPEN SELECTED IN GOOGLE MAPS ↗</button>}
    </section>
  );
}
