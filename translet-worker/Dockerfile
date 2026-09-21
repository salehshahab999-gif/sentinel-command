FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       fonts-noto-core \
       fonts-vazirmatn \
       fontconfig \
       ca-certificates \
       qpdf \
       tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY server.py /app/server.py

RUN python -c 'import fitz, pathlib; font_dir=pathlib.Path("/usr/share/fonts/truetype/vazirmatn"); assert (font_dir/"Vazirmatn-Regular.ttf").exists(); arch=fitz.Archive(str(font_dir)); css="""@font-face {font-family:Vazirmatn;src:url(Vazirmatn-Regular.ttf);} * {font-family:Vazirmatn;}"""; d=fitz.open(); p=d.new_page(); result=p.insert_htmlbox(fitz.Rect(40,40,560,140), """<div dir="rtl" style="direction:rtl;text-align:right;font-family:Vazirmatn;font-size:18pt;line-height:1.35;">سلام دنیا PDF API 123</div>""", css=css, archive=arch); assert result[0] >= 0; assert len(d.tobytes()) > 0; d.close(); print("PyMuPDF RTL + Vazirmatn smoke test: ok")'

RUN mkdir -p /data/input /data/output /data/cache

EXPOSE 11008

CMD ["python", "/app/server.py"]
