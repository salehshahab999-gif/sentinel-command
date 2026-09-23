from __future__ import annotations

import os
import tempfile
import time
from pathlib import Path

import fitz

os.environ["TRANSLET_ENV"] = "development"
os.environ["TRANSLET_DATA_DIR"] = os.path.join(tempfile.gettempdir(), "sentinel-translet-scale")

import server


class FakeTask:
    def __init__(self) -> None:
        self.last = None

    def update_state(self, *, state: str, meta: dict) -> None:
        self.last = (state, meta)
        n = int(meta.get("n", 0) or 0)
        total = int(meta.get("total", 0) or 0)
        if n and (n % 500 == 0 or n == total):
            print(
                f"progress_pages={n}/{total} "
                f"warnings={meta.get('warnings', 0)} "
                f"render_failures={meta.get('render_failures', 0)}",
                flush=True,
            )


def build_pdf(path: Path, pages: int) -> None:
    doc = fitz.open()
    prose = (
        "This is representative novel prose used for Sentinel scale testing. " * 24
    )
    for index in range(pages):
        page = doc.new_page(width=595, height=842)
        page.insert_textbox(
            fitz.Rect(52, 62, 543, 770),
            f"Chapter page {index + 1}\n\n{prose}",
            fontsize=10,
        )
    doc.save(path, garbage=4, deflate=True, clean=True)
    doc.close()


def main() -> None:
    pages = int(os.environ.get("TRANSLET_SCALE_PAGES", "7000"))
    root = Path(tempfile.mkdtemp(prefix="sentinel-translet-scale-"))
    source = root / "input.pdf"
    mono = root / "mono.pdf"
    dual = root / "dual.pdf"

    print(f"scale pages={pages}")

    started = time.perf_counter()
    build_pdf(source, pages)
    generated = time.perf_counter() - started
    print(f"generate_seconds={generated:.2f}")

    original_translate = server.translate_text
    server.translate_text = lambda text, source_lang, target_lang: "این یک ترجمه آزمایشی برای سنجش سرعت Sentinel است."

    try:
        task = FakeTask()
        started = time.perf_counter()
        result = server.translate_document(
            source,
            mono,
            dual,
            "auto",
            "fa",
            int(os.environ.get("TRANSLET_TRANSLATION_WORKERS", "4")),
            task,
            "scale-smoke",
        )
        elapsed = time.perf_counter() - started
    finally:
        server.translate_text = original_translate

    print(f"process_seconds={elapsed:.2f}")
    print(f"pages_per_second={pages / elapsed:.3f}")
    print(f"minutes_for_7000_at_same_cpu={elapsed / 60:.2f}")
    print(f"result_pages={result['pages']}")
    print(f"dual_pages={result['dual_pages']}")
    print(f"render_failures={result['render_failures']}")
    print(f"ocr_pages={result['ocr_pages']}")
    print(f"mono_mb={mono.stat().st_size / 1024 / 1024:.2f}")
    print(f"dual_mb={dual.stat().st_size / 1024 / 1024:.2f}")

    assert result["pages"] == pages
    assert result["render_failures"] == 0
    assert result["dual_pages"] == 0
    assert mono.exists() and mono.stat().st_size > 0


if __name__ == "__main__":
    main()
