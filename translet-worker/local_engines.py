from __future__ import annotations

import gc
import hashlib
import os
import re
import sqlite3
from pathlib import Path
from threading import Lock

import ctranslate2
import langid
import sentencepiece as spm
from huggingface_hub import snapshot_download
from madlad_language_catalog import langid_to_language


DATA_DIR = Path(os.environ.get("TRANSLET_DATA_DIR", "/data"))
CACHE_DIR = DATA_DIR / "cache"
DB_PATH = CACHE_DIR / "translations.sqlite3"

LOCAL_ENGINE_MODE = os.environ.get("TRANSLET_LOCAL_ENGINE", "auto").lower().strip()
NLLB_MODEL_REPO = os.environ.get(
    "TRANSLET_LOCAL_MODEL_REPO",
    "mijuanlo/nllb-200-distilled-600M-ct2-int8",
).strip()
NLLB_MODEL_PATH = Path(
    os.environ.get(
        "TRANSLET_LOCAL_MODEL_PATH",
        str(DATA_DIR / "models" / "nllb-200-distilled-600M-ct2-int8"),
    )
)
MADLAD_MODEL_REPO = os.environ.get(
    "TRANSLET_MADLAD_MODEL_REPO",
    "cstr/madlad400-3b-ct2-int8",
).strip()
MADLAD_MODEL_PATH = Path(
    os.environ.get(
        "TRANSLET_MADLAD_MODEL_PATH",
        str(DATA_DIR / "models" / "madlad400-3b-ct2-int8"),
    )
)
COMPUTE_TYPE = os.environ.get("TRANSLET_LOCAL_MODEL_COMPUTE_TYPE", "int8").strip()
NLLB_THREADS = max(
    1,
    min(int(os.environ.get("TRANSLET_LOCAL_MODEL_INTRA_THREADS", "4")), 4),
)
NLLB_BATCH = max(
    1,
    min(int(os.environ.get("TRANSLET_LOCAL_MODEL_BATCH_SIZE", "4")), 8),
)
MADLAD_THREADS = max(
    1,
    min(int(os.environ.get("TRANSLET_MADLAD_INTRA_THREADS", "2")), 4),
)
MADLAD_BATCH = max(
    1,
    min(int(os.environ.get("TRANSLET_MADLAD_BATCH_SIZE", "1")), 2),
)
CHUNK_LIMIT = max(
    600,
    min(int(os.environ.get("TRANSLET_TRANSLATION_CHUNK_LIMIT", "3000")), 5000),
)


def _normalize_madlad_code(code: str) -> str:
    value = str(code).strip()
    if value.startswith("<2") and value.endswith(">"):
        return value[2:-1]
    return value.strip("<>")


MADLAD_LANGUAGES = {
    _normalize_madlad_code(code): str(name).strip()
    for code, name in langid_to_language.items()
}
MADLAD_LANGUAGE_COUNT = len(MADLAD_LANGUAGES)

NLLB_CODES_BY_ISO = {
    "af": "afr_Latn", "am": "amh_Ethi", "ar": "arb_Arab", "as": "asm_Beng",
    "az": "azj_Latn", "be": "bel_Cyrl", "bg": "bul_Cyrl", "bn": "ben_Beng",
    "bs": "bos_Latn", "ca": "cat_Latn", "cs": "ces_Latn", "cy": "cym_Latn",
    "da": "dan_Latn", "de": "deu_Latn", "el": "ell_Grek", "en": "eng_Latn",
    "es": "spa_Latn", "et": "est_Latn", "eu": "eus_Latn", "fa": "pes_Arab",
    "fi": "fin_Latn", "fr": "fra_Latn", "ga": "gle_Latn", "gl": "glg_Latn",
    "gu": "guj_Gujr", "he": "heb_Hebr", "hi": "hin_Deva", "hr": "hrv_Latn",
    "hu": "hun_Latn", "hy": "hye_Armn", "id": "ind_Latn", "is": "isl_Latn",
    "it": "ita_Latn", "ja": "jpn_Jpan", "jv": "jav_Latn", "ka": "kat_Geor",
    "kk": "kaz_Cyrl", "km": "khm_Khmr", "kn": "kan_Knda", "ko": "kor_Hang",
    "ky": "kir_Cyrl", "la": "lat_Latn", "lb": "ltz_Latn", "lo": "lao_Laoo",
    "lt": "lit_Latn", "lv": "lvs_Latn", "mk": "mkd_Cyrl", "ml": "mal_Mlym",
    "mn": "khk_Cyrl", "mr": "mar_Deva", "ms": "zsm_Latn", "mt": "mlt_Latn",
    "nb": "nob_Latn", "ne": "npi_Deva", "nl": "nld_Latn", "nn": "nno_Latn",
    "no": "nob_Latn", "oc": "oci_Latn", "or": "ory_Orya", "pa": "pan_Guru",
    "pl": "pol_Latn", "ps": "pbt_Arab", "pt": "por_Latn", "ro": "ron_Latn",
    "ru": "rus_Cyrl", "rw": "kin_Latn", "sk": "slk_Latn", "sl": "slv_Latn",
    "sq": "als_Latn", "sr": "srp_Cyrl", "sv": "swe_Latn", "sw": "swh_Latn",
    "ta": "tam_Taml", "te": "tel_Telu", "th": "tha_Thai", "tl": "tgl_Latn",
    "tr": "tur_Latn", "uk": "ukr_Cyrl", "ur": "urd_Arab", "vi": "vie_Latn",
    "zh": "zho_Hans", "zu": "zul_Latn",
}

_lock = Lock()
_active_engine: str | None = None
_translator: ctranslate2.Translator | None = None
_tokenizer: spm.SentencePieceProcessor | None = None


def _init_cache() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as connection:
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
            CREATE TABLE IF NOT EXISTS languages (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                engine TEXT NOT NULL,
                model_language_tag TEXT NOT NULL
            )
            """
        )
        connection.executemany(
            """
            INSERT INTO languages (code, name, engine, model_language_tag)
            VALUES (?, ?, 'madlad400', ?)
            ON CONFLICT(code) DO UPDATE SET
                name=excluded.name,
                engine=excluded.engine,
                model_language_tag=excluded.model_language_tag
            """,
            [
                (_normalize_madlad_code(code), name, code)
                for code, name in langid_to_language.items()
            ],
        )
        connection.commit()


def _cache_key(source: str, target: str, text: str) -> str:
    return hashlib.sha256(
        f"{source}\n{target}\n{text}".encode("utf-8")
    ).hexdigest()


def _cache_get(source: str, target: str, text: str) -> str | None:
    key = _cache_key(source, target, text)
    with sqlite3.connect(DB_PATH) as connection:
        row = connection.execute(
            "SELECT translated_text FROM translations WHERE cache_key = ?",
            (key,),
        ).fetchone()
    return row[0] if row else None


def _cache_put(source: str, target: str, text: str, translated: str) -> None:
    key = _cache_key(source, target, text)
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            INSERT INTO translations
              (cache_key, source_lang, target_lang, source_text, translated_text, created_at)
            VALUES (?, ?, ?, ?, ?, strftime('%s','now'))
            ON CONFLICT(cache_key) DO UPDATE SET
              translated_text=excluded.translated_text,
              created_at=excluded.created_at
            """,
            (key, source, target, text, translated),
        )
        connection.commit()


def language_catalog() -> list[dict[str, str]]:
    return [
        {"code": code, "name": name, "engine": "madlad400", "model_tag": f"<2{code}>"}
        for code, name in sorted(MADLAD_LANGUAGES.items())
    ]


def _split_text(text: str) -> list[str]:
    text = text.strip()
    if len(text) <= CHUNK_LIMIT:
        return [text]

    chunks: list[str] = []
    current = ""
    for piece in re.split(r"(\n+|(?<=[.!?。！？])\s+)", text):
        if not piece:
            continue
        if len(current) + len(piece) <= CHUNK_LIMIT:
            current += piece
            continue

        if current.strip():
            chunks.append(current.strip())
        current = piece

        if len(current) > CHUNK_LIMIT:
            words = current.split()
            current = ""
            for word in words:
                candidate = f"{current} {word}".strip()
                if not current or len(candidate) <= CHUNK_LIMIT:
                    current = candidate
                else:
                    chunks.append(current)
                    current = word

    if current.strip():
        chunks.append(current.strip())
    return chunks or [text[:CHUNK_LIMIT]]


def _detect(text: str) -> tuple[str, str | None]:
    sample = re.sub(r"\s+", " ", text).strip()[:4000]
    if not sample:
        return "nllb", "eng_Latn"
    if re.search(r"[\u3040-\u30ff]", sample):
        return "nllb", "jpn_Jpan"
    if re.search(r"[\uac00-\ud7af]", sample):
        return "nllb", "kor_Hang"
    if re.search(r"[\u4e00-\u9fff]", sample):
        return "nllb", "zho_Hans"

    language, _confidence = langid.classify(sample)
    code = NLLB_CODES_BY_ISO.get(language)
    if code:
        return "nllb", code
    return "madlad", language


def _snapshot(repo_id: str, path: Path, required: list[str]) -> None:
    path.mkdir(parents=True, exist_ok=True)
    if all((path / item).exists() for item in required):
        return
    snapshot_download(
        repo_id=repo_id,
        local_dir=str(path),
        allow_patterns=required,
    )
    if not all((path / item).exists() for item in required):
        raise RuntimeError(f"model files missing after download: {repo_id}")


def _ensure_engine(engine: str) -> tuple[ctranslate2.Translator, spm.SentencePieceProcessor]:
    global _active_engine, _translator, _tokenizer

    if _active_engine == engine and _translator is not None and _tokenizer is not None:
        return _translator, _tokenizer

    with _lock:
        if _active_engine == engine and _translator is not None and _tokenizer is not None:
            return _translator, _tokenizer

        _translator = None
        _tokenizer = None
        _active_engine = None
        gc.collect()

        if engine == "madlad":
            path = MADLAD_MODEL_PATH
            repo = MADLAD_MODEL_REPO
            tokenizer_file = "spiece.model"
            required = ["model.bin", "spiece.model", "shared_vocabulary.json", "config.json"]
            threads = MADLAD_THREADS
        else:
            path = NLLB_MODEL_PATH
            repo = NLLB_MODEL_REPO
            tokenizer_file = "sentencepiece.bpe.model"
            required = ["model.bin", "sentencepiece.bpe.model", "shared_vocabulary.json", "config.json"]
            threads = NLLB_THREADS

        _snapshot(repo, path, required)

        tokenizer = spm.SentencePieceProcessor()
        if not tokenizer.load(str(path / tokenizer_file)):
            raise RuntimeError(f"cannot load tokenizer: {path / tokenizer_file}")

        translator = ctranslate2.Translator(
            str(path),
            device="cpu",
            compute_type=COMPUTE_TYPE,
            inter_threads=1,
            intra_threads=threads,
            max_queued_batches=max(2, NLLB_BATCH * 2),
        )

        _tokenizer = tokenizer
        _translator = translator
        _active_engine = engine
        return translator, tokenizer


def _max_output_length(text: str) -> int:
    return max(256, min(1024, int(len(text) * 0.55) + 64))


def _translate_batch(
    parts: list[str],
    engine: str,
    source: str | None,
    target: str,
) -> list[str]:
    translator, tokenizer = _ensure_engine(engine)

    if engine == "madlad":
        encoded = [
            tokenizer.encode(f"<2{target == 'fa' and 'fa' or target}> {part}", out_type=str)
            for part in parts
        ]
        result = translator.translate_batch(
            encoded,
            beam_size=1,
            batch_type="tokens",
            max_batch_size=MADLAD_BATCH,
            max_decoding_length=max(_max_output_length(x) for x in parts),
        )
        return [tokenizer.decode(item.hypotheses[0]).strip() for item in result]

    if source is None:
        raise RuntimeError("NLLB requires a source language code.")

    encoded = [
        [source, *tokenizer.encode(part, out_type=str)]
        for part in parts
    ]
    result = translator.translate_batch(
        encoded,
        target_prefix=[[target] for _ in encoded],
        beam_size=1,
        batch_type="tokens",
        max_batch_size=NLLB_BATCH,
        max_decoding_length=max(_max_output_length(x) for x in parts),
    )
    outputs: list[str] = []
    for item in result:
        tokens = item.hypotheses[0]
        if tokens and tokens[0] == target:
            tokens = tokens[1:]
        outputs.append(tokenizer.decode(tokens).strip())
    return outputs


def translate_local_text(
    text: str,
    source_lang: str,
    target_lang: str,
    forced_engine: str | None = None,
) -> str:
    cleaned = text.strip()
    if not cleaned:
        return ""

    if source_lang == "auto":
        engine, detected_source = _detect(cleaned)
    elif source_lang in NLLB_CODES_BY_ISO.values():
        engine, detected_source = "nllb", source_lang
    else:
        engine, detected_source = "madlad", source_lang

    if forced_engine in {"nllb", "madlad"}:
        engine = forced_engine

    if LOCAL_ENGINE_MODE in {"nllb", "madlad"}:
        engine = LOCAL_ENGINE_MODE

    if engine == "madlad":
        detected_source = None

    parts = _split_text(cleaned)
    translated: list[str | None] = [None] * len(parts)
    missing: list[str] = []
    missing_index: list[int] = []

    cache_source = f"local:{engine}:{detected_source or 'auto'}"
    for index, part in enumerate(parts):
        cached = _cache_get(cache_source, target_lang, part)
        if cached is None:
            missing.append(part)
            missing_index.append(index)
        else:
            translated[index] = cached

    if missing:
        fresh = _translate_batch(missing, engine, detected_source, target_lang)
        for index, part, value in zip(missing_index, missing, fresh):
            translated[index] = value
            _cache_put(cache_source, target_lang, part, value)

    return "\n".join(item for item in translated if item is not None).strip()


_init_cache()
