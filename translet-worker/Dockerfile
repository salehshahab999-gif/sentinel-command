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

RUN python -c 'import ctranslate2, langid, sentencepiece, fitz; print("Local translation dependencies: ok"); d=fitz.open(); p=d.new_page(); p.insert_htmlbox(fitz.Rect(40,40,560,120), """<div dir="rtl" style="direction:rtl;text-align:right;font-family: Noto Naskh Arabic;font-size:18pt;">سلام دنیا</div>"""); assert len(d.tobytes()) > 0; d.close(); print("PyMuPDF RTL smoke test: ok")'

RUN mkdir -p /data/input /data/output /data/cache

EXPOSE 11008

CMD ["python", "/app/server.py"]
