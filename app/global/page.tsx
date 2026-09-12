import GlobalSourceCards from "../components/GlobalSourceCards";
import GlobalStreetMap from "../components/GlobalStreetMap";
import MapSearchPanel from "../components/MapSearchPanel";

export default function GlobalPage() {
  return (
    <>
      <GlobalStreetMap />
      <GlobalSourceCards />
      <MapSearchPanel />
    </>
  );
}
