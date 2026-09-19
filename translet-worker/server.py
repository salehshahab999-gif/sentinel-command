from __future__ import annotations

import hashlib
import html
import hmac
import json
import os
import re
import shutil
import sqlite3
import subprocess
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock, local
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
SHARED_SECRET_FALLBACK = "sentinel-translet-local-dev-secret"
MAX_PAGES = 5000
MAX_FILE_BYTES = 1024 * 1024 * 1024
CHECKPOINT_PAGES = max(
    1,
    min(int(os.environ.get("TRANSLET_CHECKPOINT_PAGES", "25")), 100),
)
MIN_REQUEST_INTERVAL = max(
    0.0,
    float(os.environ.get("TRANSLET_MIN_REQUEST_INTERVAL", "0.08")),
)
REDIS_VISIBILITY_TIMEOUT = max(
    6 * 60 * 60,
    int(
        os.environ.get(
            "TRANSLET_REDIS_VISIBILITY_TIMEOUT",
            str(7 * 24 * 60 * 60),
        )
    ),
)
OCR_ENABLED = os.environ.get("TRANSLET_OCR_ENABLED", "1").lower() not in {
    "0",
    "false",
    "no",
}
OCR_LANGUAGE = os.environ.get("TRANSLET_OCR_LANGUAGE", "eng")
OCR_DPI = max(
    120,
    min(int(os.environ.get("TRANSLET_OCR_DPI", "200")), 400),
)

PERSIAN_FONT_DIR = Path("/usr/share/fonts/truetype/vazirmatn")
PERSIAN_FONT_ARCHIVE = (
    fitz.Archive(str(PERSIAN_FONT_DIR))
    if PERSIAN_FONT_DIR.exists()
    else None
)
PERSIAN_FONT_CSS = """
@font-face {font-family: Vazirmatn; src: url(Vazirmatn-Regular.ttf);}
@font-face {font-family: Vazirmatn; src: url(Vazirmatn-Bold.ttf); font-weight:700;}
@font-face {font-family: Vazirmatn; src: url(Vazirmatn-SemiBold.ttf); font-weight:600;}
* {font-family: Vazirmatn, sans-serif;}
"""

_PUA_RE = re.compile(r"[\uE000-\uF8FF\U000F0000-\U000FFFFD\U00100000-\U0010FFFD]")
_CONTROL_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
_LTR_RUN_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._:/%+\-]*")


def clean_source_text(text: str) -> str:
    cleaned = _PUA_RE.sub(" ", text)
    cleaned = _CONTROL_RE.sub(" ", cleaned)
    cleaned = cleaned.replace("\u00a0", " ")
    cleaned = cleaned.replace("\r", " ").replace("\n", " ")
    return re.sub(r"[ \t]{2,}", " ", cleaned).strip()


def _bidi_html_text(text: str) -> str:
    pieces: list[str] = []
    cursor = 0

    for match in _LTR_RUN_RE.finditer(text):
        if match.start() > cursor:
            pieces.append(html.escape(text[cursor:match.start()], quote=False))
        pieces.append(
            '<span dir="ltr">'
            + html.escape(match.group(0), quote=False)
            + "</span>"
        )
        cursor = match.end()

    if cursor < len(text):
        pieces.append(html.escape(text[cursor:], quote=False))

    return "".join(pieces)

app = Flask("sentinel-translet")
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_BYTES

celery_app = Celery(
    "sentinel-translet",
    broker=REDIS_URL,
    backend=RESULT_URL,
)
celery_app.conf.update(
    task_track_started=True,
    result_expires=24 * 60 * 60,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    broker_transport_options={"visibility_timeout": REDIS_VISIBILITY_TIMEOUT},
    result_backend_transport_options={"visibility_timeout": REDIS_VISIBILITY_TIMEOUT},
    visibility_timeout=REDIS_VISIBILITY_TIMEOUT,
)

cache_init_lock = Lock()
cache_thread_local = local()
session_thread_local = local()
translation_rate_lock = Lock()
translation_next_allowed = 0.0


def _shared_secret() -> str:
    configured = os.environ.get("PDF_TRANSLATOR_SHARED_SECRET", "")
    if configured:
        return configured

    if os.environ.get("TRANSLET_ENV", "production").lower() != "production":
        return SHARED_SECRET_FALLBACK

    return ""


def _validate_token(token: str) -> bool:
    secret = _shared_secret()
    if not secret:
        return False

    parts = token.split(".")
    if len(parts) != 3:
        return False

    expires_raw, scope, signature = parts

    if scope != "translet":
        return False

    try:
        expires_at = int(expires_raw)
    except ValueError:
        return False

    now = int(time.time())
    if expires_at < now or expires_at > now + 10 * 60:
        return False

    payload = f"{expires_raw}.{scope}".encode("utf-8")
    expected = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected)


@app.before_request
def require_worker_token():
    if request.path == "/health" or request.method == "OPTIONS":
        return None

    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return jsonify({"error": "missing bearer token"}), 401

    token = authorization.removeprefix("Bearer ").strip()

    if not _validate_token(token):
        return jsonify({"error": "invalid or expired token"}), 401

    return None


def _open_cache_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(
        DB_PATH,
        timeout=30,
        check_same_thread=False,
    )
    connection.execute("PRAGMA busy_timeout=30000")
    connection.execute("PRAGMA synchronous=NORMAL")
    return connection


def init_cache() -> None:
    with cache_init_lock:
        connection = sqlite3.connect(DB_PATH, timeout=30)
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=NORMAL")
        connection.execute("PRAGMA busy_timeout=30000")
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
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                input_path TEXT NOT NULL,
                total_pages INTEGER NOT NULL,
                completed_pages INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL,
                warning_count INTEGER NOT NULL DEFAULT 0,
                ocr_pages INTEGER NOT NULL DEFAULT 0,
                render_failures INTEGER NOT NULL DEFAULT 0,
                error TEXT,
                updated_at INTEGER NOT NULL
            )
            """
        )
        connection.commit()
        connection.close()


init_cache()


def _cache_connection() -> sqlite3.Connection:
    connection = getattr(cache_thread_local, "connection", None)
    if connection is None:
        connection = _open_cache_connection()
        cache_thread_local.connection = connection
    return connection


def cache_key(source_lang: str, target_lang: str, text: str) -> str:
    return hashlib.sha256(
        f"{source_lang}\n{target_lang}\n{text}".encode("utf-8")
    ).hexdigest()


def cache_get(key: str) -> str | None:
    connection = _cache_connection()
    row = connection.execute(
        "SELECT translated_text FROM translations WHERE cache_key = ?",
        (key,),
    ).fetchone()
    return row[0] if row else None


def cache_put(
    key: str,
    source_lang: str,
    target_lang: str,
    source_text: str,
    translated_text: str,
) -> None:
    connection = _cache_connection()
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


def _job_get(job_id: str) -> dict[str, Any] | None:
    connection = sqlite3.connect(DB_PATH, timeout=30)
    connection.execute("PRAGMA busy_timeout=30000")
    row = connection.execute(
        """
        SELECT job_id, input_path, total_pages, completed_pages, status,
               warning_count, ocr_pages, render_failures, error, updated_at
        FROM jobs
        WHERE job_id = ?
        """,
        (job_id,),
    ).fetchone()
    connection.close()

    if row is None:
        return None

    keys = (
        "job_id",
        "input_path",
        "total_pages",
        "completed_pages",
        "status",
        "warning_count",
        "ocr_pages",
        "render_failures",
        "error",
        "updated_at",
    )
    return dict(zip(keys, row))


def _job_upsert(
    job_id: str,
    input_path: Path,
    total_pages: int,
    *,
    completed_pages: int = 0,
    status: str = "QUEUED",
    warning_count: int = 0,
    ocr_pages: int = 0,
    render_failures: int = 0,
    error: str | None = None,
) -> None:
    connection = sqlite3.connect(DB_PATH, timeout=30)
    connection.execute("PRAGMA busy_timeout=30000")
    connection.execute(
        """
        INSERT INTO jobs (
            job_id, input_path, total_pages, completed_pages, status,
            warning_count, ocr_pages, render_failures, error, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
            input_path=excluded.input_path,
            total_pages=excluded.total_pages,
            completed_pages=excluded.completed_pages,
            status=excluded.status,
            warning_count=excluded.warning_count,
            ocr_pages=excluded.ocr_pages,
            render_failures=excluded.render_failures,
            error=excluded.error,
            updated_at=excluded.updated_at
        """,
        (
            job_id,
            str(input_path),
            total_pages,
            completed_pages,
            status,
            warning_count,
            ocr_pages,
            render_failures,
            error,
            int(time.time()),
        ),
    )
    connection.commit()
    connection.close()


def _job_update(
    job_id: str,
    *,
    completed_pages: int | None = None,
    status: str | None = None,
    warning_delta: int = 0,
    ocr_delta: int = 0,
    render_failure_delta: int = 0,
    error: str | None = None,
) -> dict[str, Any] | None:
    current = _job_get(job_id)
    if current is None:
        return None

    _job_upsert(
        job_id,
        Path(current["input_path"]),
        current["total_pages"],
        completed_pages=(
            current["completed_pages"]
            if completed_pages is None
            else completed_pages
        ),
        status=current["status"] if status is None else status,
        warning_count=current["warning_count"] + warning_delta,
        ocr_pages=current["ocr_pages"] + ocr_delta,
        render_failures=current["render_failures"] + render_failure_delta,
        error=current["error"] if error is None else error,
    )
    return _job_get(job_id)


def split_for_google(text: str, limit: int = 4200) -> list[str]:
    text = text.strip()

    if len(text) <= limit:
        return [text]

    chunks: list[str] = []
    current = ""

    for piece in re.split(r"(\n+|(?<=[.!?])\s+)", text):
        if not piece:
            continue

        if len(current) + len(piece) <= limit:
            current += piece
            continue

        if current.strip():
            chunks.append(current.strip())
            current = ""

        if len(piece) <= limit:
            current = piece
            continue

        words = piece.split()
        word_chunk = ""

        for word in words:
            candidate = f"{word_chunk} {word}".strip()

            if len(candidate) <= limit:
                word_chunk = candidate
            else:
                if word_chunk:
                    chunks.append(word_chunk)

                word_chunk = word

        if word_chunk:
            current = word_chunk

    if current.strip():
        chunks.append(current.strip())

    return chunks or [text[:limit]]


def _translation_session() -> requests.Session:
    session = getattr(session_thread_local, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (X11; Linux x86_64) "
                    "AppleWebKit/537.36 Chrome/153 Safari/537.36"
                )
            }
        )
        session_thread_local.session = session
    return session


def _translation_rate_limit() -> None:
    global translation_next_allowed

    if MIN_REQUEST_INTERVAL <= 0:
        return

    with translation_rate_lock:
        now = time.monotonic()
        wait_for = max(0.0, translation_next_allowed - now)
        if wait_for:
            time.sleep(wait_for)
        translation_next_allowed = time.monotonic() + MIN_REQUEST_INTERVAL


def _retry_delay(
    response: requests.Response | None,
    attempt: int,
) -> float:
    if response is not None:
        retry_after = response.headers.get("Retry-After", "").strip()
        if retry_after.isdigit():
            return min(60.0, max(0.5, float(retry_after)))

    return min(30.0, 0.75 * (2**attempt))


def google_translate_one(
    text: str,
    source_lang: str,
    target_lang: str,
) -> str:
    endpoints = (
        (
            "https://translate.googleapis.com/translate_a/single",
            {
                "client": "gtx",
                "dt": "t",
                "sl": source_lang,
                "tl": target_lang,
                "q": text,
            },
        ),
        (
            "https://clients5.google.com/translate_a/t",
            {
                "client": "dict-chrome-ex",
                "sl": source_lang,
                "tl": target_lang,
                "q": text,
            },
        ),
    )

    session = _translation_session()
    last_error: Exception | None = None

    for url, params in endpoints:
        for attempt in range(5):
            response = None
            try:
                _translation_rate_limit()
                response = session.get(
                    url,
                    params=params,
                    timeout=(10, 45),
                )

                if response.status_code in {
                    408,
                    425,
                    429,
                    500,
                    502,
                    503,
                    504,
                }:
                    time.sleep(_retry_delay(response, attempt))
                    continue

                response.raise_for_status()
                payload = response.json()

                if (
                    isinstance(payload, list)
                    and payload
                    and isinstance(payload[0], list)
                ):
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

            except requests.RequestException as exc:
                last_error = exc
                time.sleep(_retry_delay(response, attempt))
            except (ValueError, RuntimeError) as exc:
                last_error = exc
                time.sleep(_retry_delay(response, attempt))

    raise RuntimeError(f"Google translation failed: {last_error}")


def translate_text(
    text: str,
    source_lang: str,
    target_lang: str,
) -> str:
    cleaned = text.strip()

    if not cleaned:
        return ""

    key = cache_key(source_lang, target_lang, cleaned)
    cached = cache_get(key)

    if cached is not None:
        return cached

    parts = split_for_google(cleaned)
    translated_parts = [
        google_translate_one(part, source_lang, target_lang)
        for part in parts
    ]
    translated = "\n".join(translated_parts).strip()

    cache_put(
        key,
        source_lang,
        target_lang,
        cleaned,
        translated,
    )

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
            lines.append(clean_source_text(text))

    return clean_source_text(" ".join(lines))


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
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    escaped = "<br/>".join(_bidi_html_text(line) for line in lines)

    return (
        f'<div dir="rtl" style="direction:rtl;text-align:right;'
        f'font-family:Vazirmatn, sans-serif;font-size:{font_size:.2f}pt;'
        f'line-height:1.35;overflow-wrap:break-word;word-break:normal;">'
        f"{escaped}</div>"
    )


def render_translated_page(
    page: fitz.Page,
    translated_blocks: list[tuple[fitz.Rect, str, str, float]],
) -> int:
    for rect, _, _, _ in translated_blocks:
        page.add_redact_annot(rect, fill=(1, 1, 1))

    if translated_blocks:
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    failed = 0

    def render_box(
        rect: fitz.Rect,
        text: str,
        size: float,
        scale_low: float,
    ) -> tuple[int, float]:
        result = page.insert_htmlbox(
            rect,
            rtl_html(text, size),
            css=PERSIAN_FONT_CSS,
            archive=PERSIAN_FONT_ARCHIVE,
            scale_low=scale_low,
            overlay=True,
        )
        return result

    for rect, raw, translated, font_size in translated_blocks:
        result = render_box(rect, translated, font_size, 0.60)

        if result[0] < 0:
            result = render_box(
                rect,
                translated,
                max(6.5, font_size * 0.92),
                0.35,
            )

        if result[0] < 0:
            result = render_box(
                rect,
                translated,
                max(5.5, font_size * 0.82),
                0.12,
            )

        if result[0] < 0:
            escaped = _bidi_html_text(clean_source_text(raw)).replace(
                "\n",
                "<br/>",
            )
            page.insert_htmlbox(
                rect,
                (
                    '<div dir="ltr" style="direction:ltr;text-align:left;'
                    'font-family:sans-serif;'
                    f'font-size:{max(5.0, font_size * 0.65):.2f}pt;">'
                    f"{escaped}</div>"
                ),
                css=PERSIAN_FONT_CSS,
                archive=PERSIAN_FONT_ARCHIVE,
                scale_low=0.05,
                overlay=True,
            )
            failed += 1

    return failed


def extract_page_blocks(
    page: fitz.Page,
) -> tuple[list[dict[str, Any]], bool, str | None]:
    text_page = page.get_text(
        "dict",
        flags=fitz.TEXTFLAGS_TEXT,
    )

    blocks = [
        block
        for block in text_page.get("blocks", [])
        if block.get("type") == 0 and block_text(block)
    ]

    if blocks or not OCR_ENABLED:
        return blocks, False, None

    try:
        ocr_page = page.get_textpage_ocr(
            flags=fitz.TEXTFLAGS_TEXT,
            language=OCR_LANGUAGE,
            dpi=OCR_DPI,
            full=True,
        )
        ocr_dict = page.get_text(
            "dict",
            flags=fitz.TEXTFLAGS_TEXT,
            textpage=ocr_page,
        )
        ocr_blocks = [
            block
            for block in ocr_dict.get("blocks", [])
            if block.get("type") == 0 and block_text(block)
        ]
        return ocr_blocks, True, None
    except Exception as exc:
        return [], False, f"OCR page fallback failed: {exc}"


def _job_id_from_output(mono_path: Path) -> str:
    name = mono_path.name
    suffix = "-mono.pdf"
    return name[:-len(suffix)] if name.endswith(suffix) else mono_path.stem


def _chunk_dir(job_id: str) -> Path:
    directory = OUTPUT_DIR / f".{job_id}-chunks"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _chunk_paths(job_id: str, chunk_index: int) -> tuple[Path, Path]:
    directory = _chunk_dir(job_id)
    stem = f"{chunk_index:06d}"
    return (
        directory / f"{stem}-mono.pdf",
        directory / f"{stem}-dual.pdf",
    )


def _valid_chunk(
    mono_chunk: Path,
    dual_chunk: Path,
    expected_pages: int,
) -> bool:
    if not mono_chunk.exists() or not dual_chunk.exists():
        return False

    try:
        with fitz.open(mono_chunk) as mono:
            if len(mono) != expected_pages:
                return False
        with fitz.open(dual_chunk) as dual:
            return len(dual) == expected_pages * 2
    except Exception:
        return False


def _completed_checkpoint_page(
    job_id: str,
    total_pages: int,
    checkpoint_pages: int,
) -> int:
    completed = 0
    chunk_index = 0

    while completed < total_pages:
        expected = min(checkpoint_pages, total_pages - completed)
        mono_chunk, dual_chunk = _chunk_paths(job_id, chunk_index)

        if not _valid_chunk(mono_chunk, dual_chunk, expected):
            break

        completed += expected
        chunk_index += 1

    return completed


def _merge_pdf_chunks(
    chunk_paths: list[Path],
    output_path: Path,
) -> None:
    if output_path.exists():
        output_path.unlink()

    qpdf = shutil.which("qpdf")
    if qpdf:
        temporary_path = output_path.with_suffix(".merging.pdf")
        if temporary_path.exists():
            temporary_path.unlink()

        command = [qpdf, "--empty", "--pages"]
        for chunk_path in chunk_paths:
            command.extend([str(chunk_path), "1-z"])
        command.extend(["--", str(temporary_path)])

        try:
            subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
        except subprocess.CalledProcessError as exc:
            detail = (exc.stderr or exc.stdout or "qpdf merge failed").strip()
            raise RuntimeError(detail) from exc

        os.replace(temporary_path, output_path)
        return

    merged = fitz.open()
    try:
        for chunk_path in chunk_paths:
            with fitz.open(chunk_path) as chunk_doc:
                merged.insert_pdf(chunk_doc)
        merged.subset_fonts()
        merged.save(
            output_path,
            garbage=4,
            deflate=True,
            clean=False,
        )
    finally:
        merged.close()


def _remove_chunk_dir(job_id: str) -> None:
    shutil.rmtree(
        OUTPUT_DIR / f".{job_id}-chunks",
        ignore_errors=True,
    )


def self_translate_block(
    block: dict[str, Any],
    source_lang: str,
    target_lang: str,
) -> tuple[fitz.Rect, str, str, float]:
    raw = block_text(block)
    rect = fitz.Rect(block["bbox"])
    size = block_font_size(block)
    translated = translate_text(raw, source_lang, target_lang)
    return rect, raw, translated or raw, size


def translate_document(
    input_path: Path,
    mono_path: Path,
    dual_path: Path,
    source_lang: str,
    target_lang: str,
    threads: int,
    task: Task,
) -> dict[str, Any]:
    job_id = _job_id_from_output(mono_path)
    checkpoint_pages = CHECKPOINT_PAGES

    with fitz.open(input_path) as source_doc:
        total_pages = len(source_doc)

        job = _job_get(job_id)
        if job is None:
            _job_upsert(
                job_id,
                input_path,
                total_pages,
                status="RUNNING",
            )
            job = _job_get(job_id)
        elif job["total_pages"] != total_pages:
            raise RuntimeError(
                f"Job page count changed: expected {job['total_pages']}, got {total_pages}"
            )

        _job_update(job_id, status="RUNNING", error=None)

        completed_pages = _completed_checkpoint_page(
            job_id,
            total_pages,
            checkpoint_pages,
        )

        if completed_pages != job["completed_pages"]:
            _job_update(
                job_id,
                completed_pages=completed_pages,
            )

        warnings: list[str] = []
        executor = ThreadPoolExecutor(
            max_workers=max(1, min(threads, 4))
        )

        try:
            for chunk_start in range(
                completed_pages,
                total_pages,
                checkpoint_pages,
            ):
                chunk_end = min(
                    total_pages,
                    chunk_start + checkpoint_pages,
                )

                chunk_index = chunk_start // checkpoint_pages
                mono_chunk_path, dual_chunk_path = _chunk_paths(
                    job_id,
                    chunk_index,
                )

                mono_chunk = fitz.open()
                warning_delta = 0
                ocr_delta = 0
                render_failure_delta = 0

                try:
                    mono_chunk.insert_pdf(
                        source_doc,
                        from_page=chunk_start,
                        to_page=chunk_end - 1,
                    )

                    future_map = {}
                    translated_by_page = {}

                    for local_index, absolute_index in enumerate(
                        range(chunk_start, chunk_end)
                    ):
                        source_page = source_doc[absolute_index]
                        blocks, used_ocr, ocr_error = extract_page_blocks(
                            source_page
                        )

                        if used_ocr:
                            ocr_delta += 1

                        if ocr_error:
                            warning_delta += 1
                            warnings.append(
                                f"page {absolute_index + 1}: {ocr_error}"
                            )

                        for block in blocks:
                            future = executor.submit(
                                self_translate_block,
                                block,
                                source_lang,
                                target_lang,
                            )
                            future_map[future] = local_index

                    for future in as_completed(future_map):
                        local_index = future_map[future]
                        try:
                            translated_by_page.setdefault(
                                local_index,
                                [],
                            ).append(future.result())
                        except Exception as exc:
                            warning_delta += 1
                            warnings.append(
                                f"page {chunk_start + local_index + 1}: {exc}"
                            )

                    for local_index in range(chunk_end - chunk_start):
                        translated_blocks = translated_by_page.get(
                            local_index,
                            [],
                        )
                        translated_blocks.sort(
                            key=lambda item: (item[0].y0, item[0].x0)
                        )
                        render_failures = render_translated_page(
                            mono_chunk[local_index],
                            translated_blocks,
                        )
                        render_failure_delta += render_failures
                        if render_failures:
                            warning_delta += 1
                            warnings.append(
                                f"page {chunk_start + local_index + 1}: "
                                f"{render_failures} translated block(s) required fallback rendering"
                            )
                    mono_chunk.subset_fonts()
                    mono_chunk.save(
                        mono_chunk_path,
                        garbage=4,
                        deflate=True,
                        clean=False,
                    )
                finally:
                    mono_chunk.close()

                dual_chunk = fitz.open()
                try:
                    dual_chunk.insert_pdf(
                        source_doc,
                        from_page=chunk_start,
                        to_page=chunk_end - 1,
                    )
                    with fitz.open(mono_chunk_path) as translated_chunk:
                        dual_chunk.insert_pdf(translated_chunk)
                    dual_chunk.subset_fonts()
                    dual_chunk.save(
                        dual_chunk_path,
                        garbage=4,
                        deflate=True,
                        clean=False,
                    )
                finally:
                    dual_chunk.close()

                _job_update(
                    job_id,
                    completed_pages=chunk_end,
                    warning_delta=warning_delta,
                    ocr_delta=ocr_delta,
                    render_failure_delta=render_failure_delta,
                    status="RUNNING",
                )

                current_job = _job_get(job_id) or {}
                task.update_state(
                    state="PROGRESS",
                    meta={
                        "n": chunk_end,
                        "total": total_pages,
                        "warnings": current_job.get("warning_count", 0),
                        "ocr_pages": current_job.get("ocr_pages", 0),
                        "render_failures": current_job.get(
                            "render_failures",
                            0,
                        ),
                        "checkpoint_pages": checkpoint_pages,
                    },
                )
        finally:
            executor.shutdown(wait=True)

        chunk_count = (
            (total_pages + checkpoint_pages - 1)
            // checkpoint_pages
        )
        mono_chunks = [
            _chunk_paths(job_id, index)[0]
            for index in range(chunk_count)
        ]
        dual_chunks = [
            _chunk_paths(job_id, index)[1]
            for index in range(chunk_count)
        ]

        _merge_pdf_chunks(mono_chunks, mono_path)
        _merge_pdf_chunks(dual_chunks, dual_path)

        with fitz.open(mono_path) as final_mono:
            mono_pages = len(final_mono)
        with fitz.open(dual_path) as final_dual:
            dual_pages = len(final_dual)

        if mono_pages != total_pages:
            raise RuntimeError(
                f"Final Persian PDF page count mismatch: {mono_pages}/{total_pages}"
            )
        if dual_pages != total_pages * 2:
            raise RuntimeError(
                f"Final bilingual PDF page count mismatch: {dual_pages}/{total_pages * 2}"
            )

    _job_update(
        job_id,
        completed_pages=total_pages,
        status="SUCCESS",
        error=None,
    )
    _remove_chunk_dir(job_id)
    input_path.unlink(missing_ok=True)

    final_job = _job_get(job_id) or {}

    return {
        "pages": total_pages,
        "warning_count": final_job.get(
            "warning_count",
            len(warnings),
        ),
        "warnings": warnings[:100],
        "ocr_pages": final_job.get("ocr_pages", 0),
        "render_failures": final_job.get("render_failures", 0),
        "dual_pages": total_pages * 2,
        "checkpoint_pages": checkpoint_pages,
        "resumed_from_page": completed_pages,
    }

@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "sentinel-translet",
            "engine": "PyMuPDF HTML RTL renderer + Google Translate",
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

    source_lang = str(
        data.get("lang_in", "en")
    ).lower().strip() or "en"

    threads = max(
        1,
        min(int(data.get("thread", 1)), 4),
    )

    job_id = str(__import__("uuid").uuid4())
    input_path = INPUT_DIR / f"{job_id}.pdf"
    uploaded.save(input_path)

    try:
        with fitz.open(input_path) as uploaded_doc:
            page_count = len(uploaded_doc)
    except Exception as exc:
        input_path.unlink(missing_ok=True)
        return jsonify({"error": f"Invalid PDF: {exc}"}), 400

    if page_count > MAX_PAGES:
        input_path.unlink(missing_ok=True)
        return jsonify(
            {
                "error": (
                    f"PDF has {page_count} pages; "
                    f"maximum is {MAX_PAGES}."
                )
            }
        ), 413

    _job_upsert(
        job_id,
        input_path,
        page_count,
        status="QUEUED",
    )

    translate_task.apply_async(
        args=(
            str(input_path),
            job_id,
            source_lang,
            "fa",
            threads,
        ),
        task_id=job_id,
    )

    return jsonify({"id": job_id})


@app.get("/v1/translate/<task_id>")
def status(task_id: str):
    result = celery_app.AsyncResult(task_id)
    job = _job_get(task_id)

    if result.state == "PROGRESS":
        info = result.info or {}
        return jsonify(
            {
                "state": "PROGRESS",
                "info": {
                    **info,
                    "n": info.get(
                        "n",
                        job["completed_pages"] if job else 0,
                    ),
                    "total": info.get(
                        "total",
                        job["total_pages"] if job else 0,
                    ),
                },
            }
        )

    if result.state == "SUCCESS" or (
        job and job["status"] == "SUCCESS"
    ):
        return jsonify(
            {
                "state": "SUCCESS",
                "info": result.result or {
                    "pages": job["total_pages"],
                    "warning_count": job["warning_count"],
                    "ocr_pages": job["ocr_pages"],
                    "render_failures": job["render_failures"],
                    "dual_pages": job["total_pages"] * 2,
                },
            }
        )

    if result.state == "FAILURE" or (
        job and job["status"] == "FAILURE"
    ):
        return jsonify(
            {
                "state": "FAILURE",
                "error": (
                    str(result.result)
                    if result.state == "FAILURE"
                    else job.get("error")
                ),
            }
        )

    if job:
        return jsonify(
            {
                "state": "PROGRESS",
                "info": {
                    "n": job["completed_pages"],
                    "total": job["total_pages"],
                    "warnings": job["warning_count"],
                    "ocr_pages": job["ocr_pages"],
                    "render_failures": job["render_failures"],
                    "retrying": job["status"] == "RETRY",
                },
            }
        )

    return jsonify({"state": result.state})


@app.delete("/v1/translate/<task_id>")
def cancel(task_id: str):
    celery_app.AsyncResult(task_id).revoke(terminate=True)
    if _job_get(task_id):
        _job_update(
            task_id,
            status="REVOKED",
            error=None,
        )
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

@celery_app.task(
    bind=True,
    name="sentinel_translet.translate",
    max_retries=5,
    acks_late=True,
    reject_on_worker_lost=True,
)
def translate_task(
    self: Task,
    input_path: str,
    job_id: str,
    source_lang: str,
    target_lang: str,
    threads: int,
):
    try:
        return translate_document(
            Path(input_path),
            OUTPUT_DIR / f"{job_id}-mono.pdf",
            OUTPUT_DIR / f"{job_id}-dual.pdf",
            source_lang,
            target_lang,
            threads,
            self,
        )
    except Exception as exc:
        _job_update(
            job_id,
            status="RETRY",
            error=str(exc),
        )

        if self.request.retries >= self.max_retries:
            _job_update(
                job_id,
                status="FAILURE",
                error=str(exc),
            )
            raise

        raise self.retry(
            exc=exc,
            countdown=min(
                300,
                2 ** max(0, self.request.retries),
            ),
        )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=11008)
