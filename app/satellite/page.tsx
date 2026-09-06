import MaritimeSkeletonOverlay from "../components/MaritimeSkeletonOverlay";
import MapSearchPanel from "../components/MapSearchPanel";
import SatelliteIntelligence from "../components/SatelliteIntelligence";

export default function SatellitePage() {
  return (
    <>
      <SatelliteIntelligence />
      <MapSearchPanel />
      <MaritimeSkeletonOverlay />
    </>
  );
}
