# Sentinel Translet Worker

موتور ترجمه PDF جدا از Next.js اجرا می‌شود تا فایل‌های بزرگ از محدودیت payload
Vercel عبور نکنند.

## Architecture

- Sentinel `/translet` و `/teranslet`: رابط کاربری
- Sentinel `/api/translet/token`: صدور توکن کوتاه‌عمر HMAC
- Caddy: gateway و CORS
- Flask: API ترجمه
- Celery + Redis: صف پردازش
- SQLite: cache ترجمه و checkpoint وضعیت Job روی Worker
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
- همزمانی قابل تنظیم است ولی Worker پیش‌فرض با concurrency=1 اجرا می‌شود.
- پردازش به checkpointهای کوچک روی دیسک تقسیم می‌شود تا مصرف حافظه با تعداد صفحات رشد خطی نداشته باشد.
- اگر Worker یا Container وسط کار قطع شود، Job از آخرین checkpoint کامل ادامه پیدا می‌کند.
- ادغام نهایی PDF با qpdf در Docker انجام می‌شود و fallback به PyMuPDF نیز وجود دارد.
- درخواست‌های ترجمه برای خطاهای موقت و HTTP 429 با backoff و jitter-like spacing دوباره امتحان می‌شوند.
- اگر صفحه text layer نداشته باشد، Worker به‌صورت خودکار یک بار OCR انگلیسی با
  Tesseract/PyMuPDF را امتحان می‌کند.
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

Checkpoint and recovery settings are controlled with:

```env
TRANSLET_CHECKPOINT_PAGES=25
TRANSLET_MIN_REQUEST_INTERVAL=0.08
TRANSLET_REDIS_VISIBILITY_TIMEOUT=604800
```

OCR settings are controlled with:

```env
TRANSLET_OCR_ENABLED=1
TRANSLET_OCR_LANGUAGE=eng
TRANSLET_OCR_DPI=200
```

The current Sentinel UI is intentionally fixed to English → Persian, so English
OCR is the only OCR language enabled by default.
