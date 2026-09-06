"use client";

import { useEffect } from "react";

export default function SatelliteOpenBridge() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const clickable = target.closest("span, button, a");

      if (!clickable || clickable.textContent?.trim() !== "OPEN") {
        return;
      }

      window.open("/satellite", "_blank", "noopener,noreferrer");
    };

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
