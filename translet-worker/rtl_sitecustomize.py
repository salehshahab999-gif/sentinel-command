"""Sentinel RTL adapter for pdf2zh.

pdf2zh currently has an open RTL rendering limitation for Persian/Arabic:
the translation engine can return correct text, but the low-level PDF writer
does not perform Arabic shaping + BiDi reordering.

This adapter keeps the upstream package untouched and transforms only
translated RTL strings immediately before pdf2zh renders them.
"""

from __future__ import annotations

import os
import re
from typing import Callable

import arabic_reshaper
from bidi.algorithm import get_display
from pdf2zh.translator import BaseTranslator

_RTL_LANGS = {"ar", "fa", "he", "ur", "ps", "sd", "ug", "pa-ar"}
_FORMULA_TOKEN = re.compile(r"\{\s*v\d+\s*\}", re.IGNORECASE)
_RTL_CHARS = re.compile(r"[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]")


def _is_rtl_language(language: str) -> bool:
    normalized = (language or "").strip().lower().replace("_", "-")
    return normalized in _RTL_LANGS or any(
        normalized.startswith(f"{code}-") for code in _RTL_LANGS
    )


def _shape_visual_segment(segment: str) -> str:
    if not _RTL_CHARS.search(segment):
        return segment

    lines = segment.splitlines(keepends=True)
    result: list[str] = []

    for line in lines:
        newline = ""
        body = line
        if body.endswith("\r\n"):
            body, newline = body[:-2], "\r\n"
        elif body.endswith("\n"):
            body, newline = body[:-1], "\n"
        elif body.endswith("\r"):
            body, newline = body[:-1], "\r"

        if body:
            reshaped = arabic_reshaper.reshape(body)
            body = get_display(reshaped, base_dir="R")

        result.append(body + newline)

    return "".join(result)


def _shape_preserving_formula_tokens(text: str) -> str:
    parts = _FORMULA_TOKEN.split(text)
    return "".join(
        part if _FORMULA_TOKEN.fullmatch(part or "") else _shape_visual_segment(part)
        for part in parts
    )


_original_translate: Callable = BaseTranslator.translate


def _translate_with_rtl(self, text: str, ignore_cache: bool = False) -> str:
    translated = _original_translate(self, text, ignore_cache=ignore_cache)

    if os.environ.get("SENTINEL_RTL_ADAPTER", "1") != "1":
        return translated

    if _is_rtl_language(getattr(self, "lang_out", "")):
        return _shape_preserving_formula_tokens(translated)

    return translated


BaseTranslator.translate = _translate_with_rtl
