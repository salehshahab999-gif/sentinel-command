"use client";

import { useEffect, useState } from "react";

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: "Checking...",
    ram: "Checking...",
    uptime: "Checking...",
  });

  useEffect(() => {
    async function loadMetrics() {
      const res = await fetch("/api/metrics");
      const data = await res.json();

      setMetrics(data);
    }

    loadMetrics();

    const timer = setInterval(loadMetrics, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gray-900 p-6 rounded-xl">
      <h2 className="text-xl font-bold">📊 System Metrics</h2>

      <p className="mt-3">CPU: {metrics.cpu}</p>
      <p>RAM: {metrics.ram}</p>
      <p>Uptime: {metrics.uptime}</p>
    </div>
  );
}
