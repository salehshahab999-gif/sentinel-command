"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TranslateState =
  | "IDLE"
  | "UPLOADING"
  | "PROGRESS"
  | "SUCCESS"
  | "FAILURE"
  | "REVOKED";

type TranslateStatus = {
  state: TranslateState;
  info?: {
    n?: number;
    total?: number;
  };
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_PDF_TRANSLATOR_URL?.replace(/\/$/, "") ||
  "http://localhost:11009";

const SOURCE_LANGUAGES = [
  { code: "auto", label: "تشخیص خودکار" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "zh", label: "中文" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function TransletPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tokenRef = useRef("");
  const tokenExpiryRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("en");
  const [threads, setThreads] = useState("2");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState<TranslateStatus>({ state: "IDLE" });
  const [message, setMessage] = useState(
    "PDF را انتخاب کن؛ مقصد همیشه فارسی است.",
  );
  const [busy, setBusy] = useState(false);
  const [workerHealth, setWorkerHealth] = useState("checking");

  const percent = useMemo(() => {
    const n = status.info?.n ?? 0;
    const total = status.info?.total ?? 0;

    if (!total) {
      return 0;
    }

    return Math.min(100, Math.round((n / total) * 100));
  }, [status]);

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
      throw new Error("Sentinel توکن Worker را برنگرداند.");
    }

    tokenRef.current = data.token;
    tokenExpiryRef.current = data.expiresAt;

    return data.token;
  }, []);

  const workerRequest = useCallback(
    async (path: string, init: RequestInit = {}) => {
      let token = await getWorkerToken();

      const doRequest = (authToken: string) =>
        fetch(`${BACKEND_URL}${path}`, {
          ...init,
          headers: {
            ...(init.headers ?? {}),
            Authorization: `Bearer ${authToken}`,
          },
        });

      let response = await doRequest(token);

      if (response.status === 401) {
        tokenRef.current = "";
        tokenExpiryRef.current = 0;
        token = await getWorkerToken();
        response = await doRequest(token);
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
    if (!jobId) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const response = await workerRequest(
          `/v1/translate/${encodeURIComponent(jobId)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }

        const data = (await response.json()) as TranslateStatus;

        if (cancelled) {
          return;
        }

        setStatus(data);

        if (data.state === "PROGRESS") {
          setMessage(
            data.info?.total
              ? `در حال ترجمه: ${data.info.n ?? 0} / ${data.info.total} صفحه`
              : "در حال ترجمه...",
          );
          timer = setTimeout(poll, 1800);
          return;
        }

        if (data.state === "SUCCESS") {
          setBusy(false);
          setMessage("ترجمه کامل شد. فایل خروجی را دانلود کن.");
          return;
        }

        if (data.state === "FAILURE") {
          setBusy(false);
          setMessage("Worker ترجمه را با خطا متوقف کرد.");
          return;
        }

        if (data.state === "REVOKED") {
          setBusy(false);
          setMessage("کار ترجمه متوقف شد.");
          return;
        }

        timer = setTimeout(poll, 1800);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBusy(false);
        setStatus({ state: "FAILURE" });
        setMessage(
          `ارتباط با Translation Worker برقرار نشد: ${String(error)}`,
        );
      }
    };

    void poll();

    return () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [jobId, workerRequest]);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    setFile(nextFile);
    setJobId("");
    setStatus({ state: "IDLE" });
    setBusy(false);

    if (!nextFile) {
      setMessage("PDF را انتخاب کن؛ مقصد همیشه فارسی است.");
      return;
    }

    if (nextFile.type !== "application/pdf") {
      setFile(null);
      setMessage("فقط فایل PDF پذیرفته می‌شود.");
      return;
    }

    setMessage(
      `فایل آماده است: ${nextFile.name} • ${formatSize(nextFile.size)}`,
    );
  };

  const startTranslation = async () => {
    if (!file || busy) {
      return;
    }

    setBusy(true);
    setStatus({ state: "UPLOADING" });
    setMessage("در حال ارسال مستقیم PDF به Translation Worker...");

    try {
      const form = new FormData();

      form.append("file", file);
      form.append(
        "data",
        JSON.stringify({
          lang_in: source,
          lang_out: "fa",
          service: "google",
          thread: Number(threads),
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
      setMessage("کار ثبت شد؛ وضعیت را لحظه‌به‌لحظه می‌خوانم...");
    } catch (error) {
      setBusy(false);
      setStatus({ state: "FAILURE" });
      setMessage(`شروع ترجمه نشد: ${String(error)}`);
    }
  };

  const cancelTranslation = async () => {
    if (!jobId) {
      return;
    }

    setBusy(true);

    try {
      await workerRequest(
        `/v1/translate/${encodeURIComponent(jobId)}`,
        { method: "DELETE" },
      );

      setStatus({ state: "REVOKED" });
      setMessage("درخواست توقف ارسال شد.");
    } catch (error) {
      setBusy(false);
      setMessage(`توقف کار ناموفق بود: ${String(error)}`);
    }
  };

  const downloadResult = async (format: "mono" | "dual") => {
    if (!jobId) {
      return;
    }

    try {
      setMessage(
        format === "mono"
          ? "در حال آماده‌سازی PDF فارسی..."
          : "در حال آماده‌سازی PDF دو زبانه...",
      );

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
      anchor.download =
        format === "mono" ? "sentinel-persian.pdf" : "sentinel-bilingual.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setMessage("فایل آماده و دانلود شد.");
    } catch (error) {
      setMessage(`دانلود فایل ناموفق بود: ${String(error)}`);
    }
  };

  const workerLabel =
    workerHealth === "online"
      ? "ONLINE"
      : workerHealth === "offline"
        ? "OFFLINE"
        : "CHECKING";

  return (
    <main className="min-h-screen bg-black px-5 py-10 font-mono text-white">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 border-b border-cyan-500/20 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs tracking-[0.35em] text-cyan-400">
              SENTINEL / TRANSLET
            </p>
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-[10px] text-cyan-300">
              WORKER {workerLabel}
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            PDF → فارسی
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            مترجم جدا از داشبورد اصلی. فایل بزرگ مستقیم به Worker می‌رود و
            مسیرهای اصلی Sentinel و Satellite دست‌نخورده می‌مانند.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-cyan-500/30 bg-gray-900/70 px-5 py-12 text-center transition hover:border-cyan-400/60 hover:bg-gray-900"
            >
              <div className="text-4xl">📄</div>
              <div className="mt-3 text-lg font-semibold">PDF را انتخاب کن</div>
              <div className="mt-1 text-xs text-gray-500">
                محدودیت مصنوعی از سمت این صفحه اعمال نشده است.
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
              <div className="mt-4 rounded-xl border border-gray-800 bg-black/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="break-all text-sm font-semibold text-gray-200">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatSize(file.size)}
                    </p>
                  </div>

                  <span className="rounded-full border border-green-500/20 bg-green-500/5 px-2 py-1 text-[10px] text-green-400">
                    PDF READY
                  </span>
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-gray-400">وضعیت</span>
                <span className="text-sm font-semibold text-cyan-300">
                  {status.state}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="mt-3 break-words text-xs leading-5 text-gray-400">
                {message}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startTranslation}
                disabled={!file || busy || workerHealth === "offline"}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "در حال پردازش..." : "شروع ترجمه فارسی"}
              </button>

              <button
                type="button"
                onClick={cancelTranslation}
                disabled={!jobId || !busy}
                className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                توقف
              </button>
            </div>

            {status.state === "SUCCESS" && jobId && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => downloadResult("mono")}
                  className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-center text-sm font-bold text-green-300 hover:bg-green-500/10"
                >
                  دانلود PDF فارسی
                </button>

                <button
                  type="button"
                  onClick={() => downloadResult("dual")}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-center text-sm font-bold text-amber-200 hover:bg-amber-500/10"
                >
                  دانلود دو زبانه
                </button>
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500">
                زبان مبدا
              </label>

              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                disabled={busy}
                className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-500"
              >
                {SOURCE_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label} ({language.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <label className="text-xs uppercase tracking-widest text-gray-500">
                مقصد
              </label>

              <div className="mt-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-3 text-sm font-semibold text-cyan-200">
                فارسی (fa)
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs uppercase tracking-widest text-gray-500">
                همزمانی Worker
              </label>

              <select
                value={threads}
                onChange={(event) => setThreads(event.target.value)}
                disabled={busy}
                className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-500"
              >
                <option value="1">1 thread</option>
                <option value="2">2 threads</option>
                <option value="4">4 threads</option>
              </select>
            </div>

            <div className="mt-6 border-t border-gray-800 pt-5 text-xs leading-6 text-gray-500">
              <p>
                Backend:{" "}
                <span className="break-all text-gray-400">{BACKEND_URL}</span>
              </p>

              <p className="mt-2">
                موتور ترجمه Worker از pdf2zh استفاده می‌کند و خروجی mono و dual
                تولید می‌کند.
              </p>

              <p className="mt-2 text-amber-200/70">
                PDF از Next.js عبور نمی‌کند؛ فقط توکن کوتاه‌عمر از Sentinel گرفته
                می‌شود و فایل مستقیم به Worker ارسال می‌شود.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
