"use client";

import { useEffect, useState } from "react";

type Metrics = {
  cpu: string;
  memory: string;
  gpu: string;
  diskC: string;
};

const INITIAL_METRICS: Metrics = {
  cpu: "Checking...",
  memory: "Checking...",
  gpu: "Checking...",
  diskC: "Checking...",
};

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch("/api/metrics", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Metrics unavailable");
        }

        const data = await response.json();

        setMetrics({
          cpu: data.cpu || "N/A",
          memory: data.memory || "N/A",
          gpu: data.gpu || "N/A",
          diskC: data.diskC || "N/A",
        });
      } catch {
        setMetrics({
          cpu: "N/A",
          memory: "N/A",
          gpu: "N/A",
          diskC: "N/A",
        });
      }
    };

    loadMetrics();

    const interval = setInterval(loadMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
      <h2 className="text-xl font-bold text-indigo-400">📊 System Metrics</h2>

      <div className="mt-3 space-y-2 text-sm">
        <p>
          CPU: <span className="text-gray-300">{metrics.cpu}</span>
        </p>

        <p>
          Memory: <span className="text-gray-300">{metrics.memory}</span>
        </p>

        <p>
          GPU: <span className="text-gray-300">{metrics.gpu}</span>
        </p>

        <p>
          Disk C: <span className="text-gray-300">{metrics.diskC}</span>
        </p>
      </div>
    </div>
  );
}
