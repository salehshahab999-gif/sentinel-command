from __future__ import annotations

import hashlib
import html
import json
import os
import re
import sqlite3
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock
from typing import Any

import fitz
import requests
from celery import Celery, Task
from flask import Flask, abort, jsonify, request, send_file


DATA_DIR = Path(os.environ.get("TRANSLET_DATA_DIR", "/data"))
INPUT_DIR = DATA_DIR / "input"
OUTPUT_DIR = DATA_DIR / "output"
CACHE_DIR = DATA_DIR / "cache"
DB_PATH = CACHE_DIR / "translations.sqlite3"

for directory in (INPUT_DIR, OUTPUT_DIR, CACHE_DIR):
    directory.mkdir(parents=True, exist_ok=True)

REDIS_URL = os.environ.get("CELERY_BROKER", "redis://redis:6379/0")
RESULT_URL = os.environ.get("CELERY_RESULT", REDIS_URL)

app = Flask("sentinel-translet")
app.config["MAX_CONTENT_LENGTH"] = 512 * 1024 * 1024

celery_app = Celery("sentinel-translet", broker=REDIS_URL, backend=RESULT_URL)
celery_app.conf.update(
    task_track_started=True,
    result_expires=24 * 60 * 60,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)


cache_init_lock = Lock()


def init_cache() -> None:
    with cache_init_lock:
        connection = sqlite3.connect(DB_PATH)
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS translations (
                cache_key TEXT PRIMARY KEY,
                source_lang TEXT NOT NULL,
                target_lang TEXT NOT NULL,
                source_text TEXT NOT NULL,
                translated_text TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
            """
        )
        connection.commit()
        connection.close()


init_cache()


def cache_key(source_lang: str, target_lang: str, text: str) -> str:
    return hashlib.sha256(
        f"{source_lang}\n{target_lang}\n{text}".encode("utf-8")
    ).hexdigest()


def cache_get(key: str) -> str | None:
    connection = sqlite3.connect(DB_PATH)
    row = connection.execute(
        "SELECT translated_text FROM translations WHERE cache_key = ?",
        (key,),
    ).fetchone()
    connection.close()
    return row[0] if row else None


def cache_put(
    key: str,
    source_lang: str,
    target_lang: str,
    source_text: str,
    translated_text: str,
) -> None:
    connection = sqlite3.connect(DB_PATH)
    connection.execute(
        """
        INSERT INTO translations
            (cache_key, source_lang, target_lang, source_text, translated_text, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
            translated_text=excluded.translated_text,
            created_at=excluded.created_at
        """,
        (
            key,
            source_lang,
            target_lang,
            source_text,
            translated_text,
            int(time.time()),
        ),
    )
    connection.commit()
    connection.close()


def google_translate(text: str, source_lang: str, target_lang: str) -> str:
    endpoints = (
        (
            "https://translate.googleapis.com/translate_a/single",
            {
                "client": "gtx",
                "dt": "t",
                "sl": source_lang,
                "tl": target_lang,
                "q": text[:4500],
            },
        ),
        (
            "https://clients5.google.com/translate_a/t",
            {
                "client": "dict-chrome-ex",
                "sl": source_lang,
                "tl": target_lang,
                "q": text[:4500],
            },
        ),
    )

    last_error: Exception | None = None

    with requests.Session() as session:
        for url, params in endpoints:
            for attempt in range(5):
                try:
                    response = session.get(
                        url,
                        params=params,
                        timeout=(10, 45),
                        headers={
                            "User-Agent": (
                                "Mozilla/5.0 (X11; Linux x86_64) "
                                "AppleWebKit/537.36 Chrome/153 Safari/537.36"
                            )
                        },
                    )

                    if response.status_code == 429:
                        time.sleep(min(16, 2**attempt))
                        continue

                    response.raise_for_status()
                    payload = response.json()

                    if isinstance(payload, list) and payload and isinstance(payload[0], list):
                        translated = "".join(
                            str(item[0])
                            for item in payload[0]
                            if isinstance(item, list) and item and item[0]
                        )
                        if translated:
                            return translated.strip()

                    if isinstance(payload, dict) and payload.get("sentences"):
                        translated = "".join(
                            str(item.get("trans", ""))
                            for item in payload["sentences"]
                        )
                        if translated:
                            return translated.strip()

                    raise RuntimeError("Unexpected translation response")

                except Exception as exc:
                    last_error = exc
                    time.sleep(min(8, 2**attempt))

    raise RuntimeError(f"Google translation failed: {last_error}")


def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return ""

    key = cache_key(source_lang, target_lang, cleaned)
    cached = cache_get(key)
    if cached is not None:
        return cached

    translated = google_translate(cleaned, source_lang, target_lang)
    cache_put(key, source_lang, target_lang, cleaned, translated)
    return translated


def block_text(block: dict[str, Any]) -> str:
    lines: list[str] = []

    for line in block.get("lines", []):
        text = "".join(
            str(span.get("text", ""))
            for span in line.get("spans", [])
            if span.get("text")
        ).strip()

        if text:
            lines.append(text)

    return "\n".join(lines).strip()


def block_font_size(block: dict[str, Any]) -> float:
    sizes: list[float] = []

    for line in block.get("lines", []):
        for span in line.get("spans", []):
            try:
                sizes.append(float(span.get("size", 10)))
            except (TypeError, ValueError):
                pass

    if not sizes:
        return 10.0

    sizes.sort()
    return max(6.0, min(22.0, sizes[len(sizes) // 2]))


def rtl_html(text: str, font_size: float) -> str:
    escaped = html.escape(text, quote=False).replace("\n", "<br/>")
    return (
        f'<div style="direction:rtl;text-align:right;'
        f'font-family:\'Noto Naskh Arabic\',\'Noto Sans Arabic\','
        f'\'DejaVu Sans\',sans-serif;font-size:{font_size:.2f}pt;'
        f'line-height:1.22;">{escaped}</div>'
    )


def render_page_blocks(
    page: fitz.Page,
    translated_blocks: list[tuple[fitz.Rect, str, float]],
) -> None:
    for rect, _, _ in translated_blocks:
        page.add_redact_annot(rect, fill=(1, 1, 1))

    if translated_blocks:
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    for rect, translated, font_size in translated_blocks:
        page.insert_htmlbox(
            rect,
            rtl_html(translated, font_size),
            css=(
                "* { direction: rtl; text-align: right; "
                "font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', "
                "'DejaVu Sans', sans-serif; }"
            ),
            scale_low=0.65,
            overlay=True,
        )


def translate_document(
    input_path: Path,
    mono_path: Path,
    dual_path: Path,
    source_lang: str,
    target_lang: str,
    threads: int,
    task: Task,
) -> dict[str, Any]:
    source_doc = fitz.open(input_path)
    dual_doc = fitz.open(input_path)
    total_pages = len(source_doc)
    warnings: list[str] = []

    for page_index in range(total_pages):
        source_page = source_doc[page_index]
        dual_page = dual_doc[page_index]

        text_page = source_page.get_text("dict", flags=fitz.TEXTFLAGS_TEXT)
        blocks = [
            block
            for block in text_page.get("blocks", [])
            if block.get("type") == 0 and block_text(block)
        ]

        translated_blocks: list[tuple[fitz.Rect, str, float]] = []

        def do_one(block: dict[str, Any]):
            raw = block_text(block)
            rect = fitz.Rect(block["bbox"])
            size = block_font_size(block)
            translated = translate_text(raw, source_lang, target_lang)
            return rect, raw, translated, size

        with ThreadPoolExecutor(max_workers=max(1, min(threads, 4))) as pool:
            futures = [pool.submit(do_one, block) for block in blocks]

            for future in as_completed(futures):
                try:
                    rect, raw, translated, size = future.result()
                    if translated:
                        translated_blocks.append((rect, translated, size))
                    else:
                        translated_blocks.append((rect, raw, size))
                except Exception as exc:
                    warnings.append(f"page {page_index + 1}: {exc}")

        translated_blocks.sort(key=lambda item: (item[0].y0, item[0].x0))

        if translated_blocks:
            render_page_blocks(dual_page, translated_blocks)

        task.update_state(
            state="PROGRESS",
            meta={
                "n": page_index + 1,
                "total": total_pages,
                "warnings": len(warnings),
            },
        )

    source_doc.save(mono_path, garbage=4, deflate=True, clean=True)
    dual_doc.save(dual_path, garbage=4, deflate=True, clean=True)
    source_doc.close()
    dual_doc.close()

    input_path.unlink(missing_ok=True)

    return {
        "pages": total_pages,
        "warning_count": len(warnings),
        "warnings": warnings[:100],
    }


@celery_app.task(bind=True, name="sentinel_translet.translate")
def translate_task(
    self: Task,
    input_path: str,
    job_id: str,
    source_lang: str,
    target_lang: str,
    threads: int,
):
    return translate_document(
        Path(input_path),
        OUTPUT_DIR / f"{job_id}-mono.pdf",
        OUTPUT_DIR / f"{job_id}-dual.pdf",
        source_lang,
        target_lang,
        threads,
        self,
    )


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "sentinel-translet",
            "engine": "PyMuPDF RTL renderer + Google Translate",
        }
    )


@app.post("/v1/translate")
def create_translate():
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        return jsonify({"error": "PDF file is required"}), 400

    if not uploaded.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        data = json.loads(request.form.get("data", "{}"))
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid data JSON"}), 400

    source_lang = str(data.get("lang_in", "en")).lower().strip() or "en"
    threads = max(1, min(int(data.get("thread", 1)), 4))

    job_id = str(uuid.uuid4())
    input_path = INPUT_DIR / f"{job_id}.pdf"
    uploaded.save(input_path)

    result = translate_task.delay(
        str(input_path),
        job_id,
        source_lang,
        "fa",
        threads,
    )

    return jsonify({"id": result.id})


@app.get("/v1/translate/<task_id>")
def status(task_id: str):
    result = celery_app.AsyncResult(task_id)

    if result.state == "PROGRESS":
        return jsonify({"state": "PROGRESS", "info": result.info or {}})

    if result.state == "SUCCESS":
        return jsonify({"state": "SUCCESS", "info": result.result or {}})

    if result.state == "FAILURE":
        return jsonify({"state": "FAILURE", "error": str(result.result)})

    return jsonify({"state": result.state})


@app.delete("/v1/translate/<task_id>")
def cancel(task_id: str):
    celery_app.AsyncResult(task_id).revoke(terminate=True)
    return jsonify({"state": "REVOKED"})


@app.get("/v1/translate/<task_id>/<output_format>")
def download(task_id: str, output_format: str):
    if not re.fullmatch(r"[0-9a-f-]{36}", task_id):
        abort(404)

    if output_format not in {"mono", "dual"}:
        abort(404)

    path = OUTPUT_DIR / f"{task_id}-{output_format}.pdf"
    if not path.exists():
        return jsonify({"error": "Result is not ready"}), 404

    return send_file(
        path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"sentinel-translet-{output_format}.pdf",
        max_age=0,
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=11008)
