export async function GET() {
  return Response.json({
    status: "Ready",
    source: "Sentinel Data Sources",
    connected: false,
    message: "No external sources connected yet",
    time: new Date().toISOString(),
  });
}