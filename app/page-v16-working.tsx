"use client";

import { useEffect, useState } from "react";
import SystemMetrics from "./components/SystemMetrics";
type Target = {
  id: string;
  name: string;
  address: string;
  createdAt?: string;
};

type NetworkInfo = {
  internet: string;
  vpn: string;
  latency: string;
  api: string;
  database: string;
  time: string;
};

export default function Home() {
  const [time, setTime] = useState("");

  const [logs, setLogs] = useState("");

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    internet: "Checking...",
    vpn: "Checking...",
    latency: "Checking...",
    api: "Checking...",
    database: "Checking...",
    time: "",
  });
  const [targets, setTargets] = useState<Target[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<{
    status?: string;
    database?: string;
    targets?: Target[];
  } | null>(null);

  const [apiInfo, setApiInfo] = useState<{
    status?: string;
    service?: string;
    database?: string;
    time?: string;
  } | null>(null);

  async function loadData() {
    try {
      const net = await fetch("/api/network");
      const netData = await net.json();
      setNetworkInfo(netData);

      const db = await fetch("/api/database");

      const dbData = await db.json();

      setDatabaseInfo(dbData);
      setTargets(dbData.targets || []);

      const api = await fetch("/api/status");
      const apiData = await api.json();

      setApiInfo(apiData);
      const log = await fetch("/api/logs");
      const logData = await log.json();

      setLogs(logData.logs || "");
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const start = async () => {
      await loadData();
    };

    start();

    const refresh = setInterval(loadData, 30000);

    return () => clearInterval(refresh);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-GB"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold">Sentinel Command Center V1.6</h1>

      <p className="mt-3 text-gray-400">
        Global Monitoring & Intelligence Dashboard
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🟢 Database</h2>

          <p className="mt-3">Status: {databaseInfo?.status || "Loading"}</p>

          <p>Engine: {databaseInfo?.database || "Loading"}</p>

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

          <p className="mt-2 text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <SystemMetrics />
        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🟢 System Status</h2>

          <p className="mt-3">Online</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🟢 API Gateway</h2>

          <p className="mt-3">Status: {apiInfo?.status || "Loading"}</p>

          <p>Service: {apiInfo?.service || "Loading"}</p>

          <p>Database: {apiInfo?.database || "Loading"}</p>

          <p className="text-sm text-gray-400 mt-2">
            Last Check: {apiInfo?.time || "Loading"}
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🤖 AI Core</h2>

          <p className="mt-3">Active</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">📝 Logger Center</h2>

          <p className="mt-3">Logs: {logs.split("\n").length - 1}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">🔔 Alert Center</h2>

          <p className="mt-3">No Active Alerts</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold">📡 Network Monitor</h2>

          <p className="mt-3">Internet: 🟢 {networkInfo.internet}</p>

          <p>VPN: 🟢 {networkInfo.vpn}</p>

          <p>Latency: {networkInfo.latency}</p>

          <p>API: 🟢 {networkInfo.api}</p>

          <p>Database: 🟢 {networkInfo.database}</p>

          <p>Last Check: {networkInfo.time}</p>
        </div>
      </div>
    </main>
  );
}
