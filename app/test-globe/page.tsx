"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Cesium?: any;
    CESIUM_BASE_URL?: string;
  }
}

const CESIUM_VERSION = "1.145";

const CESIUM_SCRIPT =
  `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Cesium.js`;

const CESIUM_CSS =
  `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/Widgets/widgets.css`;

const CESIUM_BASE_URL =
  `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;

function loadCesium(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) {
      resolve(window.Cesium);
      return;
    }

    // مهم: این باید قبل از اجرای Cesium تنظیم شود
    window.CESIUM_BASE_URL = CESIUM_BASE_URL;

    // CSS
    if (!document.querySelector('link[data-cesium-css="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CESIUM_CSS;
      link.dataset.cesiumCss = "true";
      document.head.appendChild(link);
    }

    const existing = document.querySelector(
      'script[data-cesium-script="true"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(window.Cesium));
      existing.addEventListener("error", () =>
        reject(new Error("Cesium script failed to load"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = CESIUM_SCRIPT;
    script.async = true;
    script.dataset.cesiumScript = "true";

    script.onload = () => {
      if (!window.Cesium) {
        reject(new Error("Cesium loaded but window.Cesium is unavailable"));
        return;
      }

      resolve(window.Cesium);
    };

    script.onerror = () => {
      reject(new Error("Failed to load CesiumJS"));
    };

    document.head.appendChild(script);
  });
}

export default function TestGlobePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let viewer: any = null;
    let destroyed = false;

    async function init() {
      try {
        const Cesium = await loadCesium();

        if (destroyed || !containerRef.current) return;

        const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;

        if (token) {
          Cesium.Ion.defaultAccessToken = token;
        }

        viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,

          // مهم: جلوی imagery پیش‌فرض Ion را می‌گیرد
          baseLayer: false,

          // کره خام Cesium
          terrain: Cesium.Terrain.fromWorldTerrain
            ? undefined
            : undefined,

          scene3DOnly: true,
          shouldAnimate: false,
        });

        viewer.scene.globe.show = true;

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            35,
            25,
            20000000
          ),
        });

        viewer.scene.requestRender();

        console.log("CESIUM TEST GLOBE: READY");
      } catch (error) {
        console.error("CESIUM_INIT_ERROR:", error);
      }
    }

    init();

    return () => {
      destroyed = true;

      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
      }}
    />
  );
}