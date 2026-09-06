import { getStoragePlan } from "../../../../core/storage/storage-runtime";

export async function GET() {
  return Response.json({
    ok: true,
    root: "data/intelligence",
    mode: "LOCAL-FIRST",
    liveCollectors: false,
    storage: getStoragePlan(),
  });
}
