"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Cesium?: any;
    CESIUM_BASE_URL?: string;
  }
}

const VERSION = "1.145";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${VERSION}/Build/Cesium/`;
const SCRIPT_URL = CESIUM_BASE + "Cesium.js";
const CSS_URL = CESIUM_BASE + "Widgets/widgets.css";

type ResearchPoint = {
  id: string;
  title: string;
  category: "ARCHAEOLOGY" | "HISTORICAL IMAGE LEAD" | "3D MODEL";
  lon: number;
  lat: number;
  note: string;
  url: string;
  certainty: "DOCUMENTED SITE" | "APPROXIMATE SEARCH AREA" | "EXTERNAL MODEL";
};

const POINTS: ResearchPoint[] = [
  {
    id: "st-peters",
    title: "St Peter's Basilica digital twin",
    category: "3D MODEL",
    lon: 12.4539,
    lat: 41.9022,
    note: "External digital twin focused on the basilica. It is not a complete 3D model of the entire Vatican City State.",
    url: "https://virtual.basilicasanpietro.va/en",
    certainty: "EXTERNAL MODEL",
  },
  {
    id: "necropolis",
    title: "Necropolis beneath St Peter's Basilica",
    category: "ARCHAEOLOGY",
    lon: 12.4537,
    lat: 41.9019,
    note: "Documented archaeological site. The marker is a surface reference point, not a survey of the underground extent.",
    url: "https://www.basilicasanpietro.va/en/san-pietro/the-necropolis",
    certainty: "DOCUMENTED SITE",
  },
  {
    id: "triumphalis",
    title: "Via Triumphalis cemetery",
    category: "ARCHAEOLOGY",
    lon: 12.4528,
    lat: 41.9072,
    note: "Documented archaeological area. The point is indicative and does not represent the full footprint.",
    url: "https://www.turismoroma.it/en/node/1093",
    certainty: "DOCUMENTED SITE",
  },
  {
    id: "aerial-1928",
    title: "1928 aerial photograph: St Peter's and Vatican",
    category: "HISTORICAL IMAGE LEAD",
    lon: 12.4539,
    lat: 41.9022,
    note: "A catalogued historical aerial photograph from the ETH-Bibliothek / Walter Mittelholzer Mediterranean flight collection. The point marks the subject area only: the scanned photograph has not yet been georeferenced or aligned as an image overlay.",
    url: "https://commons.wikimedia.org/wiki/Category:ETH-BIB_Mittelholzer-Mediterranean_flight_1928",
    certainty: "APPROXIMATE SEARCH AREA",
  },
  {
    id: "photo-1900",
    title: "Historical view from St Peter's dome (1900)",
    category: "HISTORICAL IMAGE LEAD",
    lon: 12.4539,
    lat: 41.9022,
    note: "USF archival record catalogued January 1900. This is an elevated panorama from the dome, not an aerial photograph. The marker identifies the subject area only.",
    url: "https://digitalcommons.usf.edu/howry/142/",
    certainty: "APPROXIMATE SEARCH AREA",
  },
  {
    id: "nistri-1919",
    title: "Umberto Nistri aerial representation of Rome (1919)",
    category: "HISTORICAL IMAGE LEAD",
    lon: 12.4539,
    lat: 41.9022,
    note: "The Italian National Aerial Photo Archive describes a 1919 global representation of Rome. The exact frame and Vatican coverage still need confirmation.",
    url: "https://iccd.cultura.gov.it/it/fotografia/aerofototecanazionale",
    certainty: "APPROXIMATE SEARCH AREA",
  },
  {
    id: "allied-1943",
    title: "Allied aerial reconnaissance archive (1943–1945)",
    category: "HISTORICAL IMAGE LEAD",
    lon: 12.4539,
    lat: 41.9022,
    note: "The national archive confirms a collection of Allied reconnaissance imagery from 1943–1945. This is a search lead, not proof a specific frame covers the Vatican.",
    url: "https://iccd.cultura.gov.it/it/fotografia/aerofototecanazionale",
    certainty: "APPROXIMATE SEARCH AREA",
  },
  {
    id: "afn",
    title: "AFN National Aerial Photo Archive",
    category: "HISTORICAL IMAGE LEAD",
    lon: 12.4522,
    lat: 41.9037,
    note: "Search area only. No matching archive frame has been downloaded or georeferenced yet.",
    url: "https://afn.cultura.gov.it/webgis/",
    certainty: "APPROXIMATE SEARCH AREA",
  },
  {
    id: "igm",
    title: "IGM aerial photography archive",
    category: "HISTORICAL IMAGE LEAD",
    lon: 12.4551,
    lat: 41.9044,
    note: "Search area only. IGM's large national archive covers Italy, not exclusively Vatican City.",
    url: "https://igmi.esercito.difesa.it/descrizione-prodotti/foto-aeree/",
    certainty: "APPROXIMATE SEARCH AREA",
  },
  {
    id: "rome-aerial",
    title: "Rome municipal aerial photo archive",
    category: "HISTORICAL IMAGE LEAD",
    lon: 12.4508,
    lat: 41.9008,
    note: "Search lead only. Individual image dates, footprints, and coverage still need validation.",
    url: "https://geoportale.comune.roma.it/aerofototeca/",
    certainty: "APPROXIMATE SEARCH AREA",
  },
];

function loadCesium(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) return resolve(window.Cesium);
    window.CESIUM_BASE_URL = CESIUM_BASE;
    if (!document.querySelector('link[data-vatican-cesium="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      link.dataset.vaticanCesium = "true";
      document.head.appendChild(link);
    }
    const existing = document.querySelector('script[data-vatican-cesium="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => window.Cesium ? resolve(window.Cesium) : reject(new Error("Cesium unavailable")), { once: true });
      existing.addEventListener("error", () => reject(new Error("Cesium failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.dataset.vaticanCesium = "true";
    script.onload = () => window.Cesium ? resolve(window.Cesium) : reject(new Error("Cesium unavailable"));
    script.onerror = () => reject(new Error("Cesium failed to load"));
    document.head.appendChild(script);
  });
}

export default function VaticanResearchPage() {
  const host = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [engine, setEngine] = useState("LOADING 3D ENGINE");
  const [imagery, setImagery] = useState<"MAP" | "SATELLITE">("MAP");
  const [showArchaeology, setShowArchaeology] = useState(true);
  const [showHistoricalLeads, setShowHistoricalLeads] = useState(true);
  const [showModel, setShowModel] = useState(true);
  const [selected, setSelected] = useState<string>("afn");

  useEffect(() => {
    let disposed = false;
    let entities: any[] = [];
    async function init() {
      try {
        const Cesium = await loadCesium();
        if (disposed || !host.current) return;
        const viewer = new Cesium.Viewer(host.current, {
          animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
          homeButton: false, sceneModePicker: false, navigationHelpButton: false,
          fullscreenButton: false, infoBox: false, selectionIndicator: false,
          scene3DOnly: true, shouldAnimate: false, baseLayer: false, terrain: false,
          requestRenderMode: true, maximumRenderTimeChange: Number.POSITIVE_INFINITY,
        });
        viewerRef.current = viewer;
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1720");
        viewer.scene.globe.enableLighting = false;
        viewer.scene.skyBox.show = false;
        viewer.scene.skyAtmosphere.show = false;
        viewer.scene.fog.enabled = false;
        viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(12.4539, 41.9022, 4500) });
        const imageryLayer = viewer.imageryLayers;
        const layer = imageryLayer.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          maximumLevel: 19,
          tilingScheme: new Cesium.WebMercatorTilingScheme(),
          credit: "© OpenStreetMap contributors",
        }));
        (viewer as any).__vaticanBaseLayer = layer;
        for (const p of POINTS) {
          const color = p.category === "ARCHAEOLOGY" ? Cesium.Color.ORANGE : p.category === "3D MODEL" ? Cesium.Color.CYAN : Cesium.Color.YELLOW;
          const entity = viewer.entities.add({
            id: p.id,
            name: p.title,
            position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 25),
            point: { pixelSize: p.category === "ARCHAEOLOGY" ? 11 : 9, color, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: { text: p.title, font: "12px sans-serif", fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 3, style: Cesium.LabelStyle.FILL_AND_OUTLINE, pixelOffset: new Cesium.Cartesian2(0, -18), disableDepthTestDistance: Number.POSITIVE_INFINITY },
            properties: { researchPointId: p.id },
          });
          entities.push(entity);
        }
        viewer.selectedEntityChanged.addEventListener((entity: any) => {
          const id = entity?.properties?.researchPointId?.getValue?.();
          if (id) setSelected(id);
        });
        setEngine("3D ENGINE READY");
      } catch (error) {
        setEngine("3D ENGINE ERROR: " + (error instanceof Error ? error.message : String(error)));
      }
    }
    init();
    return () => {
      disposed = true;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) viewerRef.current.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium) return;
    const old = (viewer as any).__vaticanBaseLayer;
    if (old) viewer.imageryLayers.remove(old, true);
    const url = imagery === "MAP"
      ? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      : "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";
    const layer = viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url, maximumLevel: imagery === "MAP" ? 19 : 9,
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      credit: imagery === "MAP" ? "© OpenStreetMap contributors" : "NASA GIBS MODIS Terra",
    }));
    (viewer as any).__vaticanBaseLayer = layer;
  }, [imagery]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    for (const p of POINTS) {
      const entity = viewer.entities.getById(p.id);
      if (entity) entity.show = p.category === "ARCHAEOLOGY" ? showArchaeology : p.category === "HISTORICAL IMAGE LEAD" ? showHistoricalLeads : showModel;
    }
  }, [showArchaeology, showHistoricalLeads, showModel, engine]);

  const current = POINTS.find(p => p.id === selected) ?? POINTS[0];

  return (
    <main style={{ minHeight: "100vh", background: "#071018", color: "#e5eef5", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <div style={{ color: "#5dd6d0", fontSize: 12, letterSpacing: 2 }}>SENTINEL COMMAND CENTER / RESEARCH MODULE</div>
          <h1 style={{ margin: "8px 0", fontSize: 27 }}>Vatican 3D Map Research</h1>
          <p style={{ maxWidth: 850, color: "#aab9c6", lineHeight: 1.5, margin: 0 }}>A source-linked research view for Vatican City. Historical archive markers are approximate search areas, not verified photo footprints.</p>
        </div>
        <div style={{ fontSize: 12, border: "1px solid #31505f", borderRadius: 8, padding: "9px 12px", color: "#f5d88b" }}>{engine}</div>
      </header>
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 330px", gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 9 }}>
            <button onClick={() => setImagery("MAP")} style={buttonStyle(imagery === "MAP")}>STREET MAP</button>
            <button onClick={() => setImagery("SATELLITE")} style={buttonStyle(imagery === "SATELLITE")}>NASA SATELLITE</button>
            <button onClick={() => setShowArchaeology(v => !v)} style={buttonStyle(showArchaeology)}>ARCHAEOLOGY {showArchaeology ? "ON" : "OFF"}</button>
            <button onClick={() => setShowHistoricalLeads(v => !v)} style={buttonStyle(showHistoricalLeads)}>ARCHIVE LEADS {showHistoricalLeads ? "ON" : "OFF"}</button>
            <button onClick={() => setShowModel(v => !v)} style={buttonStyle(showModel)}>3D MODEL LINK {showModel ? "ON" : "OFF"}</button>
            <button onClick={() => viewerRef.current?.camera.flyTo({ destination: window.Cesium.Cartesian3.fromDegrees(12.4539, 41.9022, 4500), duration: 1.2 })} style={buttonStyle(false)}>RESET VIEW</button>
          </div>
          <div ref={host} style={{ width: "100%", height: "min(72vh, 760px)", minHeight: 460, border: "1px solid #27404e", borderRadius: 10, overflow: "hidden", background: "#0b1720" }} />
          <p style={{ color: "#8195a5", fontSize: 12, lineHeight: 1.5 }}>Map tiles load from external providers. The NASA MODIS layer is regional/coarse-resolution imagery, not a high-resolution historical photo of the Vatican.</p>
        </div>
        <aside style={{ border: "1px solid #27404e", borderRadius: 10, padding: 14, alignSelf: "start" }}>
          <h2 style={{ marginTop: 0, fontSize: 17 }}>Evidence & source records</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {POINTS.map(p => <button key={p.id} onClick={() => { setSelected(p.id); viewerRef.current?.camera.flyTo({ destination: window.Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.category === "ARCHAEOLOGY" ? 1200 : 3000), duration: 1.1 }); }} style={{ textAlign: "left", padding: 10, borderRadius: 8, border: p.id === selected ? "1px solid #5dd6d0" : "1px solid #2a414e", background: p.id === selected ? "#102b34" : "#0b1720", color: "#e5eef5", cursor: "pointer" }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: p.category === "ARCHAEOLOGY" ? "#ffb86b" : p.category === "3D MODEL" ? "#5dd6d0" : "#f4d26e" }}>{p.category}</div>
              <div style={{ fontSize: 13, fontWeight: 700, margin: "5px 0" }}>{p.title}</div>
              <div style={{ fontSize: 11, color: "#aab9c6", lineHeight: 1.45 }}>{p.certainty}</div>
            </button>)}
          </div>
          <hr style={{ borderColor: "#27404e", margin: "14px 0" }} />
          <h3 style={{ fontSize: 14 }}>{current.title}</h3>
          <p style={{ color: "#aab9c6", fontSize: 12, lineHeight: 1.55 }}>{current.note}</p>
          <a href={current.url} target="_blank" rel="noreferrer" style={{ color: "#5dd6d0", fontSize: 12, overflowWrap: "anywhere" }}>Open source ↗</a>
          <hr style={{ borderColor: "#27404e", margin: "14px 0" }} />
          <h3 style={{ fontSize: 14 }}>Source catalogue</h3>
          <ul style={{ paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: "#b8c7d2" }}>
            <li><a href="https://unlocked.microsoft.com/vatican/" target="_blank" rel="noreferrer">Microsoft project overview</a></li>
            <li><a href="https://afn.cultura.gov.it/webgis/" target="_blank" rel="noreferrer">Italian National Aerial Photo Archive</a></li>
            <li><a href="https://igmi.esercito.difesa.it/descrizione-prodotti/foto-aeree/" target="_blank" rel="noreferrer">IGM aerial photography</a></li>
            <li><a href="https://geoportale.comune.roma.it/aerofototeca/" target="_blank" rel="noreferrer">Rome municipal aerial archive</a></li>
            <li><a href="https://www.esa.int/ESA_Multimedia/Images/2015/03/Vatican_heights_detected_by_satellite_radar" target="_blank" rel="noreferrer">ESA COSMO-SkyMed</a></li>
            <li><a href="https://science.nasa.gov/photojournal/vatican-city/" target="_blank" rel="noreferrer">NASA ASTER</a></li>
            <li><a href="https://www.isprambiente.gov.it/en/news/map-of-underground-cavities-of-rome-2026" target="_blank" rel="noreferrer">ISPRA underground cavities map</a></li>
            <li><a href="https://digitalcommons.usf.edu/howry/142/" target="_blank" rel="noreferrer">1900: St Peter's Square panorama, USF archive</a></li>
            <li><a href="https://archive.ipa-agency.net/eng/front/item-creative?id=565544090" target="_blank" rel="noreferrer">1900s: archival Rome / St Peter's Square photo record</a></li>
            <li><a href="https://nav.biblhertz.it/browse/BOX_04074" target="_blank" rel="noreferrer">Bibliotheca Hertziana: aerial-photo catalogue, 1890–1960</a></li>
            <li><a href="https://iccd.cultura.gov.it/it/fotografia/aerofototecanazionale" target="_blank" rel="noreferrer">Aerofototeca Nazionale: 1919 and Allied 1943–45 image leads</a></li>
            <li><a href="https://www.e-perimetron.org/Vol_19_3/Baiocchi_et_al.pdf" target="_blank" rel="noreferrer">Academic source: Rome historical aerial coverage timeline</a></li>
            <li><a href="https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/tour-virtuali-elenco.html" target="_blank" rel="noreferrer">Vatican Museums: official indoor virtual tours</a></li>
            <li><a href="https://virtual.basilicasanpietro.va/en" target="_blank" rel="noreferrer">Latest official St Peter's Basilica 3D digital twin</a></li>
            <li><a href="https://commons.wikimedia.org/wiki/Category:Aerial_photographs_of_the_Vatican_City" target="_blank" rel="noreferrer">Wikimedia Commons: aerial photographs (6 files)</a></li>
            <li><a href="https://commons.wikimedia.org/wiki/Category:Historical_images_of_the_Vatican_City" target="_blank" rel="noreferrer">Wikimedia Commons: historical image catalogue</a></li>
            <li><a href="https://www.youtube.com/watch?v=5dQI_TXYJbU" target="_blank" rel="noreferrer">Microsoft: St Peter's Basilica digital twin video</a></li>
            <li><a href="https://www.reddit.com/r/MapPorn/comments/jfj1mw/high_definition_map_of_vatican_city/" target="_blank" rel="noreferrer">Community discussion: high-definition Vatican map</a></li>
            <li><a href="https://www.reddit.com/r/Maps/comments/w9d4rq/where_can_i_find_old_aerial_imagery_middle_east/" target="_blank" rel="noreferrer">Community discussion: finding historical aerial imagery</a></li>
            <li><a href="https://www.reddit.com/r/ancientrome/comments/1972c8z/aerial_view_of_ancient_rome_with_labels/" target="_blank" rel="noreferrer">Community discussion: aerial view and historical map comparison</a></li>
          </ul>
          <hr style={{ borderColor: "#27404e", margin: "14px 0" }} />
          <h3 style={{ fontSize: 14 }}>Historical image previews</h3>
          <p style={{ color: "#aab9c6", fontSize: 11, lineHeight: 1.5 }}>Archival aerial photos from the 1928 ETH-Bibliothek / Walter Mittelholzer collection. These are source previews, not georeferenced map overlays.</p>
          <a href="https://commons.wikimedia.org/wiki/Category:ETH-BIB_Mittelholzer-Mediterranean_flight_1928" target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: 10 }}>
            <img loading="lazy" alt="1928 archival aerial photograph of St Peter's Basilica and Vatican, ETH-Bibliothek collection" src="https://commons.wikimedia.org/wiki/Special:FilePath/ETH-BIB-Petersdom%20und%20Vatikan%20in%20Rom-Mittelmeerflug%201928-LBS%20MH02-04-0190.tif?width=420" style={{ width: "100%", borderRadius: 7, border: "1px solid #2a414e" }} />
            <span style={{ display: "block", fontSize: 11, marginTop: 4 }}>St Peter's and Vatican, 1928 collection (open archive)</span>
          </a>
          <a href="https://commons.wikimedia.org/wiki/Category:ETH-BIB_Mittelholzer-Mediterranean_flight_1928" target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: 10 }}>
            <img loading="lazy" alt="1928 archival aerial photograph of St Peter's Basilica, ETH-Bibliothek collection" src="https://commons.wikimedia.org/wiki/Special:FilePath/ETH-BIB-Petersdom%20in%20Rom-Mittelmeerflug%201928-LBS%20MH02-04-0191.tif?width=420" style={{ width: "100%", borderRadius: 7, border: "1px solid #2a414e" }} />
            <span style={{ display: "block", fontSize: 11, marginTop: 4 }}>St Peter's Basilica, 1928 collection (open archive)</span>
          </a>
          <p style={{ color: "#f4d26e", fontSize: 11, lineHeight: 1.5 }}>No unverified tunnel is drawn as fact. The historical archive search markers must be replaced by actual archive footprints once identified.</p>
        </aside>
      </section>
      <style jsx>{`a { color: #5dd6d0; } button { font-family: inherit; } @media (max-width: 900px) { main section { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
    </main>
  );
}

function buttonStyle(active: boolean): React.CSSProperties {
  return { padding: "8px 10px", borderRadius: 7, border: active ? "1px solid #5dd6d0" : "1px solid #2a414e", background: active ? "#102b34" : "#0b1720", color: active ? "#8ff5ec" : "#c6d2db", cursor: "pointer", fontSize: 11, fontWeight: 700 };
}
