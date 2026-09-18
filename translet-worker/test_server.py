import os

os.environ["TRANSLET_ENV"] = "development"

from server import (
    _validate_token,
    cache_key,
    rtl_html,
    split_for_google,
)


def test_helpers() -> None:
    assert _validate_token("bad-token") is False

    parts = split_for_google("سلام دنیا. " * 1000)
    assert parts
    assert all(len(part) <= 4200 for part in parts)

    html = rtl_html("سلام دنیا", 18)
    assert 'dir="rtl"' in html
    assert "direction:rtl" in html

    assert cache_key("en", "fa", "hello") == cache_key(
        "en", "fa", "hello"
    )
    assert cache_key("en", "fa", "hello") != cache_key(
        "en", "fa", "goodbye"
    )


if __name__ == "__main__":
    test_helpers()
    print("translet server smoke tests: ok")
