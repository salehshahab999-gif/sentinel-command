import os

os.environ["SENTINEL_RTL_ADAPTER"] = "1"

from rtl_sitecustomize import _is_rtl_language, _shape_preserving_formula_tokens


def test_rtl_language_detection() -> None:
    assert _is_rtl_language("fa")
    assert _is_rtl_language("fa-IR")
    assert _is_rtl_language("ar")
    assert not _is_rtl_language("en")


def test_persian_shaping_preserves_formula_token() -> None:
    text = "سلام {v0} دنیا"
    result = _shape_preserving_formula_tokens(text)

    assert result != text
    assert "{v0}" in result
    assert "م" in result


if __name__ == "__main__":
    test_rtl_language_detection()
    test_persian_shaping_preserves_formula_token()
    print("rtl adapter tests: ok")
