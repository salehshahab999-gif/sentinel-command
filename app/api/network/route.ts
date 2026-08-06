export async function GET() {
  return Response.json({
    internet: "Online",
    vpn: "Active",
    latency: "35 ms",
    api: "Online",
    database: "Online",
    time: new Date().toLocaleTimeString(),
  });
}
