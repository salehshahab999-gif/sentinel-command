# Sentinel Translet Worker

موتور ترجمه PDF جدا از Next.js اجرا می‌شود تا فایل‌های بزرگ از محدودیت payload
Vercel عبور نکنند.

## Architecture

- Sentinel `/translet` و `/teranslet`: رابط کاربری
- Sentinel `/api/translet/token`: صدور توکن کوتاه‌عمر HMAC
- Caddy: gateway و CORS
- Flask: API ترجمه
- Celery + Redis: صف پردازش
- SQLite: cache ترجمه روی Worker
- PyMuPDF HTML renderer: خروجی RTL فارسی
- NLLB-200 600M INT8 local engine: ترجمه متن روی CPU، بدون API و بدون سهمیه
- Tesseract OCR + PyMuPDF OCR fallback: خواندن PDFهای image-only انگلیسی

Vercel برای Function request body سقف 4.5MB دارد، بنابراین PDF مستقیم از
مرورگر به Worker ارسال می‌شود. این معماری فایل بزرگ را از Route Handler عبور
نمی‌دهد.

## Local run

داخل این پوشه:

```bash
docker compose up -d --build
```

Health:

```
http://localhost:11009/health
```

باید `ok` برگرداند.

## Sentinel environment

در `.env.local`:

```env
NEXT_PUBLIC_PDF_TRANSLATOR_URL=http://localhost:11009
PDF_TRANSLATOR_SHARED_SECRET=sentinel-translet-local-dev-secret
```

در محیط عمومی مقدار secret را عوض کن و همان مقدار را روی Worker قرار بده.

## Routes

Sentinel:

- `/translet`
- `/teranslet`
- `/api/translet/token`

Worker:

- `GET /health`
- `POST /v1/translate`
- `GET /v1/translate/<id>`
- `DELETE /v1/translate/<id>`
- `GET /v1/translate/<id>/mono`
- `GET /v1/translate/<id>/dual`

تمام endpointهای ترجمه به Bearer token کوتاه‌عمر نیاز دارند.

## PDF handling

- سقف ورودی Worker: 1GB
- متن‌های طولانی با NLLB محلی به chunkهای کوچک‌تر شکسته می‌شوند و با batching روی CPU ترجمه می‌شوند.
- cache محلی باعث می‌شود chunkهای تکراری دوباره ترجمه نشوند و کار بعد از توقف بتواند از cache ادامه بگیرد.
- مسیر محلی پیش‌فرض است؛ Baidu/Google فقط با تنظیم provider یا fallback صریح فعال می‌شوند.
- برای PDFهای image-only، قبل از حذف تصاویر یک بار OCR انگلیسی با Tesseract/PyMuPDF امتحان می‌شود؛ خروجی نهایی متن‌محور و بدون تصاویر است.
- OCR فقط روی صفحه‌هایی اجرا می‌شود که استخراج متن عادی برای آن‌ها خالی باشد،
  چون OCR بسیار کندتر از استخراج متن استاندارد است.

## Output

`mono` یک PDF فارسی است.

`dual` برای هر صفحه یک صفحه اصلی و سپس صفحه ترجمه‌شده تولید می‌کند، بنابراین
تعداد صفحات آن دو برابر سند ورودی است.

## RTL Persian

برای فارسی و عربی، متن خروجی با HTML renderer داخلی PyMuPDF و CSS
`direction: rtl` و فونت‌های Noto رندر می‌شود. این مسیر عمداً از renderer
قدیمی low-level pdf2zh جدا شده است، چون upstream PDFMathTranslate هنوز یک issue
باز برای shaping/BiDi فارسی و عربی دارد.

## Local model

مدل پیش‌فرض `mijuanlo/nllb-200-distilled-600M-ct2-int8` یک تبدیل CTranslate2 از NLLB-200 Distilled 600M است و حدود 600MB وزن INT8 دارد. مدل در اولین ترجمه داخل volume دانلود و سپس cache می‌شود. NLLB-200 تحت CC-BY-NC-4.0 منتشر شده و برای استفاده شخصی/غیرتجاری مناسب است؛ شرایط مجوز مدل باید رعایت شود.

پیش‌فرض‌های local engine:

```env
TRANSLET_TRANSLATION_PROVIDER=local
TRANSLET_LOCAL_MODEL_REPO=mijuanlo/nllb-200-distilled-600M-ct2-int8
TRANSLET_LOCAL_MODEL_COMPUTE_TYPE=int8
TRANSLET_LOCAL_MODEL_INTRA_THREADS=4
TRANSLET_LOCAL_MODEL_BATCH_SIZE=4
TRANSLET_ALLOW_CLOUD_FALLBACK=0
```

## License

این Worker کد اختصاصی Sentinel است و برای ترجمه محلی از NLLB/CTranslate2 و برای رندر PDF از PyMuPDF استفاده می‌کند.
شرایط مجوز هر dependency باید رعایت شود.


## Worker prerequisites

Docker image includes Python 3.12, PyMuPDF, Flask, Celery, Redis client,
Noto fonts, and Tesseract OCR. The normal text path does not require OCR.

OCR settings are controlled with:

```env
TRANSLET_OCR_ENABLED=1
TRANSLET_OCR_LANGUAGE=eng
TRANSLET_OCR_DPI=200
```

The Sentinel UI auto-detects the source language for extractable text and always translates to Persian. OCR remains English-only by default for image-only PDFs.


## Book input behavior

- EPUB text is parsed directly from the EPUB spine rather than rendered through Calibre, because Sentinel intentionally produces a text-only Persian PDF and does not need source images.
- MOBI/AZW/AZW3 use Calibre when available.
- Source language is sent as `auto`; local detection uses langid plus direct CJK script detection. NLLB language codes can also be supplied directly to the API for languages outside the built-in detector.


## Local-first universal text-only translation mode

- Source language is auto-detected; English, Chinese, Japanese, Russian and other supported source languages can use the same route.
- Target language remains Persian (fa).
- TXT, HTML and EPUB are normalized directly from their text structure.
- MOBI/AZW/AZW3 use Calibre only as an input adapter; after conversion, only chapter/text blocks are kept and source images/CSS are discarded.
- PDF image blocks are removed after text/OCR extraction, so the translated result is text-focused.
- Docker deployment generates only the Persian PDF by default (TRANSLET_GENERATE_DUAL=0).
- Default source PDF page ceiling is configurable and is now 20,000 pages.
- Translation provider mode: local (default), auto, baidu, or google.
- Cloud providers are not used in local mode. `auto` can optionally fall back to Baidu/Google only when `TRANSLET_ALLOW_CLOUD_FALLBACK=1`.
