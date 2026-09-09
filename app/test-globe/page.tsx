"use client";

import { useEffect, useRef } from "react";

const CESIUM_URL =
  "https://cesium.com/downloads/cesiumjs/releases/1.145/Build/Cesium/Cesium.js";

export default function TestGlobe() {
  const mapRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    console.log("CESIUM_TEST_EFFECT_STARTED");
    let viewer: any = null;
    let script: HTMLScriptElement | null = null;

    const loadCesium = () =>
      new Promise<any>((resolve, reject) => {
        const existing = (window as any).Cesium;

        if (existing) {
          resolve(existing);
          return;
        }

        script = document.createElement("script");
        script.src = CESIUM_URL;
        script.async = true;

        script.onload = () => {
          const Cesium = (window as any).Cesium;

          if (!Cesium) {
            reject(new Error("Cesium script loaded but window.Cesium is missing"));
            return;
          }

          resolve(Cesium);
        };

        script.onerror = () => {
          reject(new Error(Failed to load Cesium from ));
        };

        document.head.appendChild(script);
      });

    const init = async () => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;
      if (!mapRef.current) return;

      try {
        const Cesium = await loadCesium();
        Cesium.Ion.defaultAccessToken =
          process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;

        if (!mapRef.current) return;

        viewer = new Cesium.Viewer(mapRef.current, {
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
            20000000,
          ),
          duration: 0,
        });

        viewer.scene.requestRender();
      } catch (error) {
        console.error("CESIUM_INIT_ERROR:", error);
      }
    };

    init();

    return () => {
      if (viewer) {
        viewer.destroy();
        viewer = null;
      }

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
      }}
    />
  );
}
