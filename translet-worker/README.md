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
- Google Translate endpoint: ترجمه متن
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
- ترجمه متن‌های طولانی به قطعات کوچک‌تر از سقف درخواست Google شکسته می‌شود.
- cache محلی باعث می‌شود متن تکراری دوباره ترجمه نشود.
- ترجمهٔ شبکه‌ای به‌صورت پیش‌فرض با 4 درخواست همزمان انجام می‌شود و sessionهای HTTP بین درخواست‌ها reused می‌شوند.
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

## License

این Worker کد اختصاصی Sentinel است و از Google Translate و PyMuPDF استفاده می‌کند.
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
- Source language is sent as `auto`; Google Translate-compatible endpoints perform language detection.


## Universal text-only translation mode

- Source language is auto-detected; English, Chinese, Japanese, Russian and other supported source languages can use the same route.
- Target language remains Persian (fa).
- TXT, HTML and EPUB are normalized directly from their text structure.
- MOBI/AZW/AZW3 use Calibre only as an input adapter; after conversion, only chapter/text blocks are kept and source images/CSS are discarded.
- PDF image blocks are removed after text/OCR extraction, so the translated result is text-focused.
- Docker deployment generates only the Persian PDF by default (TRANSLET_GENERATE_DUAL=0).
- Default source PDF page ceiling is configurable and is now 20,000 pages.
- Translation provider mode: auto, baidu, or google.
- When Baidu credentials are configured, Baidu's 200+ language API is used first; provider failure falls back to the existing Google path in auto mode.
