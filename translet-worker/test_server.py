import os
import tempfile
from pathlib import Path

import fitz

os.environ["TRANSLET_ENV"] = "development"
os.environ["TRANSLET_DATA_DIR"] = os.path.join(tempfile.gettempdir(), "sentinel-translet-test-data")

from server import (
    _validate_token,
    cache_key,
    render_translated_page,
    rtl_html,
    split_for_google,
    translate_document,
)


class FakeTask:
    def __init__(self) -> None:
        self.updates = []

    def update_state(self, *, state: str, meta: dict) -> None:
        self.updates.append((state, meta))


def test_helpers() -> None:
    assert _validate_token("bad-token") is False

    parts = split_for_google("Hello world. " * 1000)
    assert parts
    assert all(len(part) <= 4200 for part in parts)

    html = rtl_html("سلام\nدنیا", 18)
    assert 'dir="rtl"' in html
    assert "direction:rtl" in html
    assert "<br/>" in html

    assert cache_key("en", "fa", "hello") == cache_key(
        "en", "fa", "hello"
    )
    assert cache_key("en", "fa", "hello") != cache_key(
        "en", "fa", "goodbye"
    )


def test_rtl_page_render() -> None:
    doc = fitz.open()
    page = doc.new_page(width=320, height=220)
    rect = fitz.Rect(30, 30, 290, 100)

    failures = render_translated_page(
        page,
        [(rect, "سلام دنیا", 18.0)],
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

    print("translet server smoke tests: ok")
