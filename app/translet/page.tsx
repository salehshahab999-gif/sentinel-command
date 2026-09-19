"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";

type TranslateState =
  | "IDLE"
  | "UPLOADING"
  | "PROGRESS"
  | "SUCCESS"
  | "FAILURE"
  | "REVOKED";

type TranslateStatus = {
  state: TranslateState;
  info?: { n?: number; total?: number; warnings?: number };
  error?: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_PDF_TRANSLATOR_URL?.replace(/\/$/, "") ||
  "http://localhost:11009";

const MAX_FILE_BYTES = 1024 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function TransletPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tokenRef = useRef("");
  const tokenExpiryRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState<TranslateStatus>({ state: "IDLE" });
  const [message, setMessage] = useState(
    "یک فایل PDF انگلیسی را انتخاب یا اینجا رها کن.",
  );
  const [busy, setBusy] = useState(false);
  const [workerHealth, setWorkerHealth] = useState("checking");

  const percent =
    status.info?.total && status.info.total > 0
      ? Math.min(
          100,
          Math.round(((status.info.n ?? 0) / status.info.total) * 100),
        )
      : 0;

  const getWorkerToken = useCallback(async () => {
    const now = Math.floor(Date.now() / 1000);

    if (tokenRef.current && tokenExpiryRef.current - now > 30) {
      return tokenRef.current;
    }

    const response = await fetch("/api/translet/token", {
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || `token endpoint status ${response.status}`);
    }

    const data = (await response.json()) as {
      token?: string;
      expiresAt?: number;
    };

    if (!data.token || !data.expiresAt) {
      throw new Error("توکن Worker دریافت نشد.");
    }

    tokenRef.current = data.token;
    tokenExpiryRef.current = data.expiresAt;
    return data.token;
  }, []);

  const workerRequest = useCallback(
    async (path: string, init: RequestInit = {}) => {
      let token = await getWorkerToken();

      const request = (authToken: string) =>
        fetch(`${BACKEND_URL}${path}`, {
          ...init,
          headers: {
            ...(init.headers ?? {}),
            Authorization: `Bearer ${authToken}`,
          },
        });

      let response = await request(token);

      if (response.status === 401) {
        tokenRef.current = "";
        tokenExpiryRef.current = 0;
        token = await getWorkerToken();
        response = await request(token);
      }

      return response;
    },
    [getWorkerToken],
  );

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/health`, {
          cache: "no-store",
        });

        if (!cancelled) {
          setWorkerHealth(response.ok ? "online" : "error");
        }
      } catch {
        if (!cancelled) {
          setWorkerHealth("offline");
        }
      }
    };

    void checkHealth();
    const timer = setInterval(checkHealth, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const response = await workerRequest(
          `/v1/translate/${encodeURIComponent(jobId)}`,
          { cache: "no-store" },
        );

        if (!response.ok) throw new Error(`status ${response.status}`);

        const data = (await response.json()) as TranslateStatus;
        if (cancelled) return;

        setStatus(data);

        if (data.state === "PROGRESS") {
          const n = data.info?.n ?? 0;
          const total = data.info?.total ?? 0;
          setMessage(
            total
              ? `در حال ترجمه صفحه ${n.toLocaleString()} از ${total.toLocaleString()}`
              : "در حال آماده‌سازی موتور ترجمه...",
          );
          timer = setTimeout(poll, 1800);
          return;
        }

        if (data.state === "SUCCESS") {
          setBusy(false);
          setMessage("ترجمه کامل شد. PDF فارسی آماده دانلود است.");
          return;
        }

        if (data.state === "FAILURE") {
          setBusy(false);
          setMessage(data.error || "ترجمه با خطا متوقف شد.");
          return;
        }

        if (data.state === "REVOKED") {
          setBusy(false);
          setMessage("ترجمه متوقف شد.");
          return;
        }

        timer = setTimeout(poll, 1800);
      } catch (error) {
        if (cancelled) return;
        setBusy(false);
        setStatus({ state: "FAILURE" });
        setMessage(`ارتباط با Worker برقرار نشد: ${String(error)}`);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, workerRequest]);

  const acceptFile = (nextFile: File | null) => {
    setJobId("");
    setStatus({ state: "IDLE" });
    setBusy(false);

    if (!nextFile) {
      setFile(null);
      setMessage("یک فایل PDF انگلیسی را انتخاب یا اینجا رها کن.");
      return;
    }

    if (
      nextFile.type !== "application/pdf" &&
      !nextFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setMessage("فقط فایل PDF پذیرفته می‌شود.");
      return;
    }

    if (nextFile.size > MAX_FILE_BYTES) {
      setFile(null);
      setMessage("حجم فایل بیشتر از ۱ گیگابایت است.");
      return;
    }

    setFile(nextFile);
    setMessage(
      `فایل آماده است: ${nextFile.name} • ${formatSize(nextFile.size)}`,
    );
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0] ?? null);
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0] ?? null);
  };

  const startTranslation = async () => {
    if (!file || busy) return;

    setBusy(true);
    setStatus({ state: "UPLOADING" });
    setMessage("در حال ارسال PDF مستقیم به Worker...");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append(
        "data",
        JSON.stringify({
          lang_in: "en",
          lang_out: "fa",
          thread: 1,
        }),
      );

      const response = await workerRequest("/v1/translate", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `status ${response.status}`);
      }

      const data = (await response.json()) as { id?: string };

      if (!data.id) {
        throw new Error("Worker شناسه کار را برنگرداند.");
      }

      setJobId(data.id);
      setStatus({ state: "PROGRESS", info: { n: 0, total: 0 } });
      setMessage("کار ثبت شد؛ پردازش صفحه‌به‌صفحه شروع می‌شود...");
    } catch (error) {
      setBusy(false);
      setStatus({ state: "FAILURE" });
      setMessage(`شروع ترجمه نشد: ${String(error)}`);
    }
  };

  const cancelTranslation = async () => {
    if (!jobId) return;

    try {
      await workerRequest(
        `/v1/translate/${encodeURIComponent(jobId)}`,
        { method: "DELETE" },
      );
      setBusy(false);
      setStatus({ state: "REVOKED" });
      setMessage("درخواست توقف ارسال شد.");
    } catch (error) {
      setBusy(false);
      setMessage(`توقف کار ناموفق بود: ${String(error)}`);
    }
  };

  const downloadResult = async (format: "mono" | "dual") => {
    if (!jobId) return;

    try {
      setMessage("در حال آماده‌سازی فایل دانلود...");

      const response = await workerRequest(
        `/v1/translate/${encodeURIComponent(jobId)}/${format}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`download status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      const originalBaseName =
        file?.name.replace(/\.pdf$/i, "") || "translated-document";

      anchor.download =
        format === "mono"
          ? `${originalBaseName} (1).pdf`
          : `${originalBaseName} (1) - bilingual.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setMessage("فایل آماده و دانلود شد.");
    } catch (error) {
      setMessage(`دانلود ناموفق بود: ${String(error)}`);
    }
  };

  const workerLabel =
    workerHealth === "online"
      ? "ONLINE"
      : workerHealth === "offline"
        ? "OFFLINE"
        : "CHECKING";

  const statusLabel =
    status.state === "SUCCESS"
      ? "Completed"
      : status.state === "FAILURE"
        ? "Failed"
        : status.state === "PROGRESS"
          ? "Translating"
          : status.state === "UPLOADING"
            ? "Uploading"
            : "Ready";

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-8 text-[#172033]">
      <section className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-tight text-cyan-700">
              SENTINEL
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              English → Persian PDF Translator
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              فایل PDF را بده، ترجمه فارسی را با حفظ ساختار تحویل بگیر.
            </p>
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm">
            Worker:{" "}
            <span
              className={
                workerHealth === "online"
                  ? "text-green-600"
                  : workerHealth === "offline"
                    ? "text-red-600"
                    : "text-slate-500"
              }
            >
              {workerLabel}
            </span>
          </div>
        </header>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.55fr_0.85fr]">
            <div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={[
                  "w-full rounded-2xl border-2 border-dashed px-6 py-16 text-center transition",
                  dragging
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-slate-300 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50/50",
                ].join(" ")}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                  📄
                </div>

                <div className="mt-5 text-xl font-bold">
                  Drag & Drop PDF here
                </div>

                <div className="mt-2 text-sm text-slate-500">
                  or click to choose a file
                </div>

                <div className="mt-5 text-xs text-slate-400">
                  PDF only · up to 1 GB · up to 5,000 pages
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onFile}
                  className="hidden"
                />
              </button>

              {file && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {file.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatSize(file.size)}
                      </div>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700">
                      READY
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    {statusLabel}
                  </span>
                  <span className="text-slate-400">{percent}%</span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-cyan-600 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="mt-3 min-h-5 text-xs text-slate-500">
                  {message}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startTranslation}
                  disabled={!file || busy || workerHealth === "offline"}
                  className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Translating..." : "Translate to Persian"}
                </button>

                <button
                  type="button"
                  onClick={cancelTranslation}
                  disabled={!jobId || !busy}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>

            <aside className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Translation
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-400">Source</div>
                <div className="mt-1 text-lg font-bold">English</div>
              </div>

              <div className="my-3 text-center text-xl text-slate-300">↓</div>

              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                <div className="text-xs text-cyan-700/70">Target</div>
                <div className="mt-1 text-lg font-bold text-cyan-800">
                  فارسی (Persian)
                </div>
                <div className="mt-1 text-xs text-cyan-700" dir="rtl">
                  راست‌به‌چپ
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span>✓</span>
                  <span className="text-slate-600">Layout preservation</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>✓</span>
                  <span className="text-slate-600">Persian RTL rendering</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>✓</span>
                  <span className="text-slate-600">Large PDF queue</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>✓</span>
                  <span className="text-slate-600">No sign-up in Sentinel</span>
                </div>
              </div>

              {status.state === "SUCCESS" && jobId && (
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => downloadResult("mono")}
                    className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700"
                  >
                    Download Persian PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadResult("dual")}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Download bilingual PDF
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl font-bold">1 GB</div>
            <div className="mt-1 text-xs text-slate-500">maximum file size</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl font-bold">5,000</div>
            <div className="mt-1 text-xs text-slate-500">pages target</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl font-bold">1 → 1</div>
            <div className="mt-1 text-xs text-slate-500">
              English to Persian only
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
