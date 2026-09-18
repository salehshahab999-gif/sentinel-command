# Sentinel Translet Worker

این پوشه موتور ترجمه PDF را جدا از Next.js اجرا می‌کند.

## چرا جداست؟

Vercel Functions برای request body سقف 4.5MB دارند، بنابراین PDFهای بزرگ نباید از
Route Handler پروژه عبور کنند. صفحه `/translet` مرورگر را مستقیماً به این Worker وصل می‌کند.

## موتور

Worker از `pdf2zh 1.9.12` با Flask + Celery + Redis استفاده می‌کند:

- POST `/v1/translate`
- GET `/v1/translate/<id>`
- DELETE `/v1/translate/<id>`
- GET `/v1/translate/<id>/mono`
- GET `/v1/translate/<id>/dual`

## اجرای محلی روی VPS یا کامپیوتر

داخل این پوشه:

```bash
docker compose up -d --build
```

بعد:

```
http://localhost:11009/health
```

باید `ok` برگرداند.

سپس در پروژه Sentinel:

```env
NEXT_PUBLIC_PDF_TRANSLATOR_URL=http://localhost:11009
```

برای محیط عمومی، همین آدرس را با دامنه HTTPS Worker عوض کن.

## نکات فایل خیلی بزرگ

Worker از صف Celery استفاده می‌کند و وضعیت ترجمه را صفحه به صفحه گزارش می‌دهد.
برای PDFهای بسیار بزرگ، اول با 1 یا 2 thread آزمایش کن.

این compose خودش Redis را هم بالا می‌آورد و Redis به اینترنت publish نشده است.

## منبع موتور

هسته ترجمه بر پایه PDFMathTranslate / pdf2zh است:
https://github.com/PDFMathTranslate/PDFMathTranslate

پروژه اصلی تحت AGPL-3.0 منتشر شده است. این پوشه کد آن پروژه را کپی نمی‌کند و
آن را به‌صورت dependency نصب می‌کند؛ برای هر نوع انتشار عمومی، شرایط مجوز آن dependency را رعایت کن.
