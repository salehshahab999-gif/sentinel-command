import crypto from "node:crypto";

export const dynamic = "force-dynamic";

const LOCAL_SECRET = "sentinel-translet-local-dev-secret";

function getSecret() {
  const configured = process.env.PDF_TRANSLATOR_SHARED_SECRET;
  if (configured) return configured;

  return process.env.NODE_ENV !== "production" ? LOCAL_SECRET : "";
}

export async function GET() {
  const secret = getSecret();

  if (!secret) {
    return Response.json(
      { error: "Set PDF_TRANSLATOR_SHARED_SECRET for the PDF translator." },
      { status: 503 },
    );
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  const payload = `${expiresAt}.translet`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return Response.json(
    {
      token: `${payload}.${signature}`,
      expiresAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
