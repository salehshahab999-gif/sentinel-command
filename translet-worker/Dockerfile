FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    CELERY_BROKER=redis://redis:6379/0 \
    CELERY_RESULT=redis://redis:6379/0

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

RUN pip install --no-cache-dir "pdf2zh[backend]==1.9.12"

WORKDIR /data

RUN mkdir -p /data/input /data/output /root/.cache

EXPOSE 11008

CMD ["pdf2zh", "--flask"]
