"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export default function TestGlobe() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const Cesium = (window as any).Cesium;

      if (!Cesium || !mapRef.current) return;

      clearInterval(timer);

      const viewer = new Cesium.Viewer(mapRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
      });

      viewer.scene.globe.show = true;

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          35,
          25,
          20000000
        ),
        duration: 0,
      });

      viewer.scene.requestRender();

    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Script
        src="https://cesium.com/downloads/cesiumjs/releases/1.145/Build/Cesium/Cesium.js"
        strategy="afterInteractive"
      />

      <div
        ref={mapRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
        }}
      />
    </>
  );
}