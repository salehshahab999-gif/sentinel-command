"use client";

import { useState, useEffect } from "react";
import SystemMetrics from "./components/SystemMetrics";
import MonitorCard from "./components/MonitorCard";
type Target = { id: string; name: string; address: string };
type NetworkInfo = {
  internet: string;
  vpn: string;
  latency: string;
  api: string;
  database: string;
  time: string;
  send: number;
  receive: number;
  sessionUsed: number;
  totalUsed: number;
  publicIP: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  asn: string;
};
type DatabaseInfo = { status?: string; database?: string; targets?: Target[] };
type ApiInfo = {
  status: string;
  service: string;
  database: string;
  time: string;
};

function isNetworkInfo(data: unknown): data is NetworkInfo {
  if (!data || typeof data !== "object") {
    return false;
  }

  const networkData = data as Record<string, unknown>;

  return (
    typeof networkData.internet === "string" &&
    typeof networkData.vpn === "string" &&
    typeof networkData.latency === "string" &&
    typeof networkData.api === "string" &&
    typeof networkData.database === "string" &&
    typeof networkData.time === "string"
  );
}

function isApiInfo(data: unknown): data is ApiInfo {
  if (!data || typeof data !== "object") {
    return false;
  }

  const apiData = data as Record<string, unknown>;

  return (
    typeof apiData.status === "string" &&
    typeof apiData.service === "string" &&
    typeof apiData.database === "string" &&
    typeof apiData.time === "string"
  );
}

function formatBackupAge(latestBackupTime: number | null): string {
  if (!latestBackupTime) {
    return "Unknown";
  }

  const ageInSeconds = Math.max(
    0,
    Math.floor((Date.now() - latestBackupTime) / 1000),
  );

  if (ageInSeconds < 60) {
    return `${ageInSeconds}s ago`;
  }

  const ageInMinutes = Math.floor(ageInSeconds / 60);

  if (ageInMinutes < 60) {
    return `${ageInMinutes}m ago`;
  }

  const ageInHours = Math.floor(ageInMinutes / 60);

  if (ageInHours < 24) {
    return `${ageInHours}h ago`;
  }

  const ageInDays = Math.floor(ageInHours / 24);

  return `${ageInDays}d ago`;
}

export default function Home() {
  const [time, setTime] = useState("");
  const [isClient, setIsClient] = useState(false);

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    internet: "Checking...",
    vpn: "Checking...",
    latency: "Checking...",
    api: "Checking...",
    database: "Checking...",
    time: "Syncing...",
    send: 0,
    receive: 0,
    sessionUsed: 0,
    totalUsed: 0,
    publicIP: "Checking...",
    country: "Checking...",
    region: "Checking...",
    city: "Checking...",
    isp: "Checking...",
    asn: "Checking...",
  });

  useEffect(() => {
    const loadNetwork = () => {
      fetch("/api/network")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: unknown) => {
          if (isNetworkInfo(data)) {
            setNetworkInfo(data);
            return;
          }

          setNetworkInfo({
            internet: "Unavailable",
            vpn: "Unavailable",
            latency: "Unavailable",
            api: "Unavailable",
            database: "Unavailable",
            time: "Unavailable",
            send: 0,
            receive: 0,
            sessionUsed: 0,
            totalUsed: 0,
            publicIP: "Unavailable",
            country: "Unavailable",
            region: "Unavailable",
            city: "Unavailable",
            isp: "Unavailable",
            asn: "Unavailable",
          });
        })
        .catch(() => {
          setNetworkInfo({
            internet: "Unavailable",
            vpn: "Unavailable",
            latency: "Unavailable",
            api: "Unavailable",
            database: "Unavailable",
            time: "Unavailable",
            send: 0,
            receive: 0,
            sessionUsed: 0,
            totalUsed: 0,
            publicIP: "Unavailable",
            country: "Unavailable",
            region: "Unavailable",
            city: "Unavailable",
            isp: "Unavailable",
            asn: "Unavailable",
          });
        });
    };

    loadNetwork();

    const interval = setInterval(loadNetwork, 2000);

    return () => clearInterval(interval);
  }, []);
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

  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  useEffect(() => {
    fetch("/api/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (isApiInfo(data)) {
          setApiInfo(data);
        }
      })
      .catch(() => {
        setApiInfo(null);
      });
  }, []);

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

  const backupAge = formatBackupAge(latestBackupTime);

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
          <MonitorCard />
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
                <span className="text-green-400">
                  {apiInfo?.status || "Checking..."}
                </span>
              </p>
              <p>
                Service:{" "}
                <span className="text-gray-300">
                  {apiInfo?.service || "Checking..."}
                </span>
              </p>
              <p>
                Database:{" "}
                <span className="text-gray-300">
                  {apiInfo?.database || "Checking..."}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Last Check:{" "}
                {isClient ? apiInfo?.time || "Syncing..." : "Syncing..."}
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
                Backup Age: <span className="text-gray-300">{backupAge}</span>
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
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">IP Address</p>
                <p className="text-cyan-400 font-bold">
                  {networkInfo.publicIP}
                </p>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">Country</p>
                <p className="text-gray-300">{networkInfo.country}</p>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">City</p>
                <p className="text-gray-300">{networkInfo.city}</p>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">ISP</p>
                <p className="text-gray-300">{networkInfo.isp}</p>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">ASN</p>
                <p className="text-gray-300">{networkInfo.asn}</p>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400">Last Check</p>
                <p className="text-gray-500">
                  {isClient ? networkInfo.time : "..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
