export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold">Sentinel Command Center V1.3</h1>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-green-500 p-6">
          🟢 System Status
          <p className="mt-2 text-gray-300">Core Online</p>
        </div>

        <div className="rounded-xl border border-green-500 p-6">
          🟢 API Gateway
          <p className="mt-2 text-gray-300">Connected</p>
        </div>

        <div className="rounded-xl border border-green-500 p-6">
          🟢 Database
          <p className="mt-2 text-gray-300">Ready</p>
        </div>

        <div className="rounded-xl border border-green-500 p-6">
          🟢 AI Core
          <p className="mt-2 text-gray-300">Active</p>
        </div>

        <div className="rounded-xl border border-blue-500 p-6">
          🕒 System Time
          <p className="mt-2 text-gray-300">Running</p>
        </div>
      </div>
    </main>
  );
}
