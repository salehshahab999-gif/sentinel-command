import GlobalGlobe from "../components/GlobalGlobe";
import GlobalSourceCards from "../components/GlobalSourceCards";
import MapSearchPanel from "../components/MapSearchPanel";
import MaritimeSkeletonOverlay from "../components/MaritimeSkeletonOverlay";

export default function SatellitePage() {
  return (
    <>
      <GlobalGlobe />
      <GlobalSourceCards />
      <MapSearchPanel />
      <MaritimeSkeletonOverlay />
    </>
  );
}
