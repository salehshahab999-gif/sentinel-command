"use client";

import { useEffect, useState } from "react";

type Target = {
  id: string;
  name: string;
  address: string;
  createdAt?: string;
};

export default function Home() {
  const [time, setTime] = useState("");

  const [targets, setTargets] = useState<Target[]>([]);

  const [databaseInfo, setDatabaseInfo] = useState<{
    status?: string;
    database?: string;
    targets?: Target[];
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("fa-IR"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/database")
      .then((res) => res.json())
      .then((data) => {
        setDatabaseInfo(data);
        setTargets(data.targets || []);
      });
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold">Sentinel Command Center V1.5</h1>

      <p className="mt-3 text-gray-400">
        Global Monitoring & Intelligence Dashboard
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🟢 Database</h2>

          <p className="mt-3">Status: {databaseInfo?.status || "Connected"}</p>

          <p>Engine: {databaseInfo?.database || "CockroachDB"}</p>

          <p>Targets: {targets.length}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🎯 Target Intelligence</h2>

          {targets.map((target) => (
            <div
              key={target.id}
              className="mt-4 border border-gray-700 p-3 rounded-lg"
            >
              <p>Name: {target.name}</p>

              <p>ID: {target.id}</p>

              <p>Address: {target.address}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🕒 System Time</h2>

          <p className="mt-3 text-2xl">{time}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🟢 System Status</h2>

          <p className="mt-3">Online</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🟢 API Gateway</h2>

          <p className="mt-3">Status: Online</p>

          <p>Service: Sentinel API</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🤖 AI Core</h2>

          <p className="mt-3">Active</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🔔 Alert Center</h2>

          <p className="mt-3">No Active Alerts</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">📡 Network Monitor</h2>

          <p className="mt-3">Connection: Stable</p>

          <p>Latency: 24 ms</p>
        </div>
      </div>
    </main>
  );
}
