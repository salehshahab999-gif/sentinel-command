export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold">Sentinel Command Center V1</h1>

      <div className="mt-10 grid gap-6">
        <div className="rounded-xl border border-green-500 p-6">
          🟢 Next.js Online
        </div>

        <div className="rounded-xl border border-green-500 p-6">
          🟢 Server Online
        </div>

        <div className="rounded-xl border border-green-500 p-6">
          🟢 Interface Online
        </div>
      </div>
    </main>
  );
}
