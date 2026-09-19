import os
import tempfile
from pathlib import Path

import fitz

os.environ["TRANSLET_ENV"] = "development"
os.environ["TRANSLET_DATA_DIR"] = os.path.join(tempfile.gettempdir(), "sentinel-translet-test-data")

import server

from server import (
    _chunk_paths,
    _job_upsert,
    _validate_token,
    cache_key,
    render_translated_page,
    rtl_html,
    clean_source_text,
    rtl_html,
    split_for_google,
    translate_document,
)


class FakeTask:
    def __init__(self) -> None:
        self.updates = []

    def update_state(self, *, state: str, meta: dict) -> None:
        self.updates.append((state, meta))


def test_celery_task_is_defined_before_flask_entrypoint() -> None:
    source = Path(server.__file__).read_text(encoding="utf-8")
    assert hasattr(server, "translate_task")
    assert source.index("@celery_app.task(") < source.index(
        'if __name__ == "__main__":'
    )


def test_helpers() -> None:
    assert _validate_token("bad-token") is False

    parts = split_for_google("Hello world. " * 1000)
    assert parts
    assert all(len(part) <= 4200 for part in parts)

    html = rtl_html("سلام\nدنیا", 18)
    assert 'dir="rtl"' in html
    assert "direction:rtl" in html
    assert "<br/>" in html

    assert server.CHECKPOINT_PAGES >= 1
    assert server.MAX_PAGES == 5000

    assert cache_key("en", "fa", "hello") == cache_key(
        "en", "fa", "hello"
    )
    assert cache_key("en", "fa", "hello") != cache_key(
        "en", "fa", "goodbye"
    )



def test_persian_text_cleaning_and_typography() -> None:
    cleaned = clean_source_text("Hello  \\uE004   world\\nPDF API 123")
    assert "\\uE004" not in cleaned
    assert cleaned == "Hello world PDF API 123"

    rendered = rtl_html("سلام PDF API 123", 16.0)
    assert 'font-family:Vazirmatn' in rendered
    assert 'dir="rtl"' in rendered
    assert 'dir="ltr"' in rendered
    assert "line-height:1.35" in rendered


def test_rtl_page_render() -> None:
    doc = fitz.open()
    page = doc.new_page(width=320, height=220)
    rect = fitz.Rect(30, 30, 290, 100)

    failures = render_translated_page(
        page,
        [(rect, "Hello world", "سلام دنیا", 18.0)],
    )

    assert failures == 0
    assert len(doc.tobytes()) > 0
    doc.close()


def test_translation_pdf_pipeline(tmp_path: Path, monkeypatch) -> None:
    source_path = tmp_path / "input.pdf"
    mono_path = tmp_path / "mono.pdf"
    dual_path = tmp_path / "dual.pdf"

    source_doc = fitz.open()
    page = source_doc.new_page(width=320, height=220)
    page.insert_text((30, 55), "Hello world", fontsize=16)
    source_doc.save(source_path)
    source_doc.close()

    monkeypatch.setattr(
        "server.translate_text",
        lambda text, source_lang, target_lang: "سلام دنیا",
    )

    task = FakeTask()
    result = translate_document(
        source_path,
        mono_path,
        dual_path,
        "en",
        "fa",
        1,
        task,
    )

    assert result["pages"] == 1
    assert result["dual_pages"] == 2
    assert result["render_failures"] == 0
    assert mono_path.exists()
    assert dual_path.exists()
    assert task.updates
    assert not source_path.exists()

    with fitz.open(mono_path) as mono:
        assert len(mono) == 1
        assert mono[0].get_text().strip()

    with fitz.open(dual_path) as dual:
        assert len(dual) == 2


def test_checkpoint_resume_pipeline(tmp_path: Path, monkeypatch) -> None:
    source_path = tmp_path / "large-input.pdf"
    mono_path = tmp_path / "checkpoint-test-job-mono.pdf"
    dual_path = tmp_path / "checkpoint-test-job-dual.pdf"

    old_checkpoint = server.CHECKPOINT_PAGES
    server.CHECKPOINT_PAGES = 10

    try:
        source_doc = fitz.open()
        for index in range(23):
            page = source_doc.new_page(width=320, height=220)
            page.insert_text(
                (30, 55),
                f"Hello page {index + 1}",
                fontsize=16,
            )
        source_doc.save(source_path)
        source_doc.close()

        job_id = "checkpoint-test-job"
        chunk_dir = server._chunk_dir(job_id)
        first_mono, first_dual = _chunk_paths(job_id, 0)

        with fitz.open(source_path) as source:
            first_mono_doc = fitz.open()
            first_mono_doc.insert_pdf(
                source,
                from_page=0,
                to_page=9,
            )
            first_mono_doc.save(first_mono, garbage=2, deflate=True)
            first_mono_doc.close()

            first_dual_doc = fitz.open()
            first_dual_doc.insert_pdf(
                source,
                from_page=0,
                to_page=9,
            )
            with fitz.open(first_mono) as first_mono_doc:
                first_dual_doc.insert_pdf(first_mono_doc)
            first_dual_doc.save(first_dual, garbage=2, deflate=True)
            first_dual_doc.close()

        _job_upsert(
            job_id,
            source_path,
            23,
            completed_pages=10,
            status="RUNNING",
        )

        calls = []

        def fake_translate(text, source_lang, target_lang):
            calls.append(text)
            return text.replace("Hello", "سلام")

        monkeypatch.setattr(
            "server.translate_text",
            fake_translate,
        )

        task = FakeTask()
        result = translate_document(
            source_path,
            mono_path,
            dual_path,
            "en",
            "fa",
            1,
            task,
        )

        assert result["pages"] == 23
        assert result["resumed_from_page"] == 10
        assert len(calls) == 13
        assert mono_path.exists()
        assert dual_path.exists()

        with fitz.open(mono_path) as mono:
            assert len(mono) == 23

        with fitz.open(dual_path) as dual:
            assert len(dual) == 46

        assert not chunk_dir.exists()
        assert not source_path.exists()
    finally:
        server.CHECKPOINT_PAGES = old_checkpoint


class _DirectMonkeyPatch:
    def setattr(self, target: str, value) -> None:
        module_name, attr_name = target.rsplit(".", 1)
        module = __import__(module_name)
        setattr(module, attr_name, value)


if __name__ == "__main__":
    test_helpers()
    test_rtl_page_render()

    from tempfile import TemporaryDirectory

    with TemporaryDirectory() as directory:
        test_translation_pdf_pipeline(
        Path(directory),
        monkeypatch=_DirectMonkeyPatch(),
    )

    with TemporaryDirectory() as directory:
        test_checkpoint_resume_pipeline(
            Path(directory),
            monkeypatch=_DirectMonkeyPatch(),
        )

    print("translet server smoke tests: ok")
