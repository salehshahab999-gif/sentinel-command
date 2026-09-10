const sourceCards = [
  {
    title: "SENTINEL OFFLINE MAP",
    status: "READY",
    detail: "LOCAL CACHE + ONLINE FALLBACK",
    sources: "CARTO / ESRI / OSM",
    tone: "cyan",
  },
  {
    title: "NASA",
    status: "WIRED / OFF",
    detail: "FIRMS / CMR / GIBS / EONET",
    sources: "NASA EARTHDATA STACK",
    tone: "lime",
  },
  {
    title: "COPERNICUS",
    status: "WIRED / OFF",
    detail: "SENTINEL-1 / 2 / 3 / 5P",
    sources: "COPERNICUS CATALOG",
    tone: "violet",
  },
  {
    title: "NOAA",
    status: "WIRED / OFF",
    detail: "NOAA-20 / 21 / GOES-19",
    sources: "NOAA PROVIDER",
    tone: "amber",
  },
  {
    title: "DEV STACK",
    status: "CURRENT",
    detail: "CESIUMJS 1.145 / URL TILES",
    sources: "GITHUB / CESIUM FORUM / CODE",
    tone: "emerald",
  },
] as const;

const toneClasses = {
  cyan: "border-cyan-900/70 text-cyan-300",
  lime: "border-lime-900/70 text-lime-300",
  violet: "border-violet-900/70 text-violet-300",
  amber: "border-amber-900/70 text-amber-300",
  emerald: "border-emerald-900/70 text-emerald-300",
} as const;

export default function GlobalSourceCards() {
  return (
    <section className="pointer-events-auto absolute bottom-20 left-4 right-4 z-30 md:left-6 md:right-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {sourceCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border bg-black/78 px-3 py-2.5 backdrop-blur-xl ${toneClasses[card.tone]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[8px] font-bold tracking-[.14em]">
                {card.title}
              </span>
              <span className="text-[7px] text-slate-500">
                {card.status}
              </span>
            </div>
            <p className="mt-1 text-[7px] tracking-[.1em] text-slate-500">
              {card.detail}
            </p>
            <p className="mt-1 text-[7px] tracking-[.08em] text-slate-600">
              {card.sources}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
