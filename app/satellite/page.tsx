import GlobalSourceCards from "../components/GlobalSourceCards";
import MaritimeSkeletonOverlay from "../components/MaritimeSkeletonOverlay";
import MapSearchPanel from "../components/MapSearchPanel";
import SatelliteIntelligence from "../components/SatelliteIntelligence";

export default function SatellitePage() {
  return (
    <>
      <SatelliteIntelligence />
      <GlobalSourceCards />
      <MapSearchPanel />
      <MaritimeSkeletonOverlay />
    </>
  );
}
