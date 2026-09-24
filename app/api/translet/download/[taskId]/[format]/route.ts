import crypto from "node:crypto";

const LOCAL_SECRET = "sentinel-translet-local-dev-secret";

function getSecret() {
  const configured = process.env.PDF_TRANSLATOR_SHARED_SECRET;
  if (configured) return configured;

  return process.env.NODE_ENV !== "production" ? LOCAL_SECRET : "";
}

function createWorkerToken(secret: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  const payload = `${expiresAt}.translet`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return { token: `${payload}.${signature}`, expiresAt };
}

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ taskId: string; format: string }>;
  },
) {
  const { taskId, format } = await context.params;

  if (!/^[0-9a-f-]{36}$/.test(taskId) || !["mono", "dual"].includes(format)) {
    return Response.json({ error: "Invalid download request" }, { status: 400 });
  }

  const secret = getSecret();

  if (!secret) {
    return Response.json(
      { error: "Set PDF_TRANSLATOR_SHARED_SECRET for the PDF translator." },
      { status: 503 },
    );
  }

  const backendUrl =
    (
      process.env.PDF_TRANSLATOR_URL ??
      process.env.NEXT_PUBLIC_PDF_TRANSLATOR_URL ??
      "http://localhost:11009"
    ).replace(/\/$/, "");

  const { token } = createWorkerToken(secret);
  const upstream = await fetch(
    `${backendUrl}/v1/translate/${encodeURIComponent(taskId)}/${format}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    const details = await upstream.text();
    return new Response(details || "Worker download failed", {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("Content-Type") ?? "application/pdf",
  );
  headers.set(
    "Content-Disposition",
    upstream.headers.get("Content-Disposition") ??
      `attachment; filename="sentinel-translet-${format}.pdf"`,
  );
  headers.set("Cache-Control", "no-store");

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
