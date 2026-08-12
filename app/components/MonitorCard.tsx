"use client";

import { useEffect, useState } from "react";

export default function MonitorCard() {
  const [monitor, setMonitor] = useState<any>(null);

  useEffect(() => {
    fetch("/api/monitor")
      .then((res) => res.json())
      .then((data) => setMonitor(data))
      .catch(() => setMonitor(null));
  }, []);

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
      <h2 className="text-xl font-bold text-cyan-400">
        🖥️ Monitor Core
      </h2>

      <div className="mt-3 space-y-2 text-sm">
        <p>
          Status:
          <span className="text-green-400 ml-2">
            {monitor?.state?.[0]?.status || "Checking..."}
          </span>
        </p>

        <p>
          Collectors:
          <span className="text-gray-300 ml-2">
            {monitor?.collectors?.length || 0}
          </span>
        </p>

        <p>
          Health:
          <span className="text-green-400 ml-2">
            {monitor?.health?.filter(
              (item: any) => item.status === "HEALTHY"
            ).length || 0}
            /5
          </span>
        </p>
      </div>
    </div>
  );
}