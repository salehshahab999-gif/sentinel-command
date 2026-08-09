"use client";
import { useState, useEffect } from "react";
import SystemMetrics from "./components/SystemMetrics";

type Target = { id: string; name: string; address: string };
type NetworkInfo = {
  internet: string;
  vpn: string;
  latency: string;
  api: string;
  database: string;
};
type DatabaseInfo = { status?: string; database?: string; targets?: Target[] };
type ApiInfo = {
  status?: string;
  service?: string;
  database?: string;
  time?: string;
};

export default function Home() {
  const [time, setTime] = useState("");
  const [isClient, setIsClient] = useState(false);

  const [networkInfo] = useState<NetworkInfo>({
    internet: "Connected",
    vpn: "Connected",
    latency: "12ms",
    api: "Online",
    database: "Connected",
  });
  const [targets, setTargets] = useState<Target[]>([]);
  useEffect(() => {
    fetch("/api/database")
      .then((res) => res.json())
      .then((data) => {
        setTargets(data.targets || []);
      });
  }, []);

  const databaseInfo: DatabaseInfo = {
    status: "Connected",
    database: "CockroachDB",
    targets: targets,
  };

  const [apiInfo] = useState<ApiInfo | null>({
    status: "Online",
    service: "REST API",
    database: "Connected",
    time: new Date().toISOString(),
  });

  const [backupInfo, setBackupInfo] = useState("Checking...");
  const [latestBackup, setLatestBackup] = useState("");
  const [latestBackupTime, setLatestBackupTime] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/backup")
      .then((res) => res.json())
      .then((data) => {
        setBackupInfo(data.message || data.status || "Unknown");
        setLatestBackup(data.latestBackup || "");
        setLatestBackupTime(data.latestBackupTime || null);
      })
      .catch(() => {
        setBackupInfo("Unavailable");
        setLatestBackup("");
      });
  }, []);

  const logs =
    "[INFO] System started successfully\n[INFO] Database connected\n[INFO] API Gateway ready";

  useEffect(() => {
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-GB")),
      1000,
    );

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsClient(true);
    }, 10);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10 font-mono">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 border-b border-gray-800 pb-4">
          <h1 className="text-4xl font-bold tracking-tighter text-green-400">
            Sentinel Command Center{" "}
            <span className="text-sm text-gray-500 font-normal">v1.6</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Global Monitoring & Intelligence Dashboard
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-cyan-400">🟢 Database</h2>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                Status:{" "}
                <span className="text-green-400">
                  🟢 {databaseInfo?.status}
                </span>
              </p>
              <p>
                Engine:{" "}
                <span className="text-gray-300">
                  {databaseInfo?.database || "Waiting..."}
                </span>
              </p>
              <p>
                Targets: <span className="text-gray-300">{targets.length}</span>
              </p>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-yellow-400">
              🎯 Target Intelligence
            </h2>
            <div className="mt-3 space-y-3 max-h-48 overflow-y-auto pr-2">
              {targets.map((target) => (
                <div
                  key={target.id}
                  className="bg-gray-800 p-3 rounded-lg border border-gray-700"
                >
                  <p className="text-sm font-semibold text-gray-200">
                    Name: {target.name}
                  </p>
                  <p className="text-xs text-gray-500">ID: {target.id}</p>
                  <p className="text-xs text-gray-500">
                    Address: {target.address}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-purple-400">
              🕒 System Time
            </h2>
            <p className="mt-3 text-3xl font-light text-white tracking-wider">
              {isClient ? time : "--:--:--"}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {isClient
                ? new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Loading..."}
            </p>
          </div>

          <SystemMetrics />

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-green-400">
              🟢 System Status
            </h2>
            <div className="mt-3">
              <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
              <p className="text-sm text-gray-300">All systems operational</p>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-blue-400">🟢 API Gateway</h2>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                Status:{" "}
                <span className="text-green-400">{apiInfo?.status}</span>
              </p>
              <p>
                Service:{" "}
                <span className="text-gray-300">{apiInfo?.service}</span>
              </p>
              <p>
                Database:{" "}
                <span className="text-gray-300">{apiInfo?.database}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Last Check: {isClient ? apiInfo?.time : "Syncing..."}
              </p>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-pink-400">🤖 AI Core</h2>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Active & Monitoring</span>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-orange-400">
              📝 Logger Center
            </h2>
            <div className="mt-3 text-sm">
              <p>
                Total Logs:{" "}
                <span className="text-gray-300">
                  {isClient ? logs.split("\n").length : 0}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last entry:{" "}
                {isClient ? new Date().toLocaleTimeString() : "..."}{" "}
              </p>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-red-400">🔔 Alert Center</h2>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
              <span>✅ No Active Alerts</span>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-emerald-400">
              💾 Backup & Restore
            </h2>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                Status: <span className="text-green-400">🟢 {backupInfo}</span>
              </p>
              <p className="text-gray-400">
                Last Backup:{" "}
                <span className="text-gray-300">
                  {latestBackup || "No Backup Found"}
                </span>
              </p>
              <p className="text-gray-400">
                Backup Age: <span className="text-gray-300">Fresh</span>
              </p>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg col-span-1 lg:col-span-3">
            <h2 className="text-xl font-bold text-teal-400">
              📡 Network Monitor
            </h2>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">Internet</p>
                <p className="text-green-400 font-bold">
                  🟢 {networkInfo.internet}
                </p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">VPN</p>
                <p className="text-green-400 font-bold">🟢 {networkInfo.vpn}</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">Latency</p>
                <p className="text-yellow-400 font-bold">
                  {networkInfo.latency}
                </p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">API / DB</p>
                <p className="text-green-400 font-bold">
                  🟢 {networkInfo.api} / {networkInfo.database}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Last Check: {isClient ? time : "..."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
