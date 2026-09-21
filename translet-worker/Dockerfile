FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       fonts-noto-core \
       fontconfig \
       ca-certificates \
       tesseract-ocr \
       calibre \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY server.py /app/server.py

RUN python -c 'import fitz, server; d=fitz.open(); p=d.new_page(); failures=server.render_translated_page(p, [(fitz.Rect(40,40,560,120), "سلام دنیا", 18.0)]); assert failures == 0; assert len(d.tobytes()) > 0; d.close(); print("Sentinel RTL font + layout smoke test: ok")'

RUN mkdir -p /data/input /data/output /data/cache

EXPOSE 11008

CMD ["python", "/app/server.py"]
