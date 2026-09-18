FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app \
    CELERY_BROKER=redis://redis:6379/0 \
    CELERY_RESULT=redis://redis:6379/0 \
    SENTINEL_RTL_ADAPTER=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libgl1 \
       libglib2.0-0 \
       libxext6 \
       libsm6 \
       libxrender1 \
       libgomp1 \
       ca-certificates \
       curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    "pdf2zh[backend,ocr]==1.9.11" \
    "arabic-reshaper>=3.0,<4" \
    "python-bidi>=0.6,<1"

WORKDIR /app

COPY rtl_sitecustomize.py /app/sitecustomize.py
COPY translet_api.py /app/translet_api.py
COPY test_rtl_adapter.py /app/test_rtl_adapter.py

RUN python /app/test_rtl_adapter.py

WORKDIR /data
RUN mkdir -p /data/input /data/output /root/.cache

EXPOSE 11008

CMD ["pdf2zh", "--flask"]
