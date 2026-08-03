export async function GET() {
  return Response.json({
    status: "Online",
    service: "Sentinel API",
    database: "Connected",
    time: new Date().toISOString(),
  });
}