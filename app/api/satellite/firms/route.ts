import { getNasaFirmsSnapshot } from "../../../../core/satellite/nasa-firms";

export async function GET() {
  return Response.json(getNasaFirmsSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
