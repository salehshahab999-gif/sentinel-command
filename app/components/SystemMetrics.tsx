export default function SystemMetrics() {
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
      <h2 className="text-xl font-bold text-indigo-400">📊 System Metrics</h2>
      <div className="mt-3 space-y-2 text-sm">
        <p>
          CPU: <span className="text-gray-300">12%</span>
        </p>
        <p>
          Memory: <span className="text-gray-300">4.2 GB / 16 GB</span>
        </p>
        <p>
          Disk: <span className="text-gray-300">45%</span>
        </p>
      </div>
    </div>
  );
}
