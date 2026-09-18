FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    CELERY_BROKER=redis://redis:6379/0 \
    CELERY_RESULT=redis://redis:6379/0 \
    TRANSLET_DATA_DIR=/data

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       fonts-noto-core \
       fonts-noto-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY server.py /app/server.py

RUN mkdir -p /data/input /data/output /data/cache

EXPOSE 11008

CMD ["python", "/app/server.py"]
