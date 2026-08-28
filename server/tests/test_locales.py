"""Keep the translation files consistent.

Every locale that claims to be complete must contain exactly the same keys as
English, and placeholder locales must stay empty until a contributor fills them
(they fall back to English at runtime).
"""
import json
from pathlib import Path

LOCALES_DIR = Path(__file__).resolve().parent.parent.parent / "client" / "locales"

COMPLETE = ["en", "zh-CN", "zh-TW"]
PLACEHOLDERS = ["ja", "ko", "fr", "de", "es"]


def _keys(obj, prefix=""):
    keys = set()
    for k, v in obj.items():
        full = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys |= _keys(v, full)
        else:
            keys.add(full)
    return keys


def _load(lang: str) -> dict:
    return json.loads((LOCALES_DIR / f"{lang}.json").read_text(encoding="utf-8"))


def test_complete_locales_have_all_english_keys():
    en_keys = _keys(_load("en"))

    for lang in COMPLETE:
        assert _keys(_load(lang)) == en_keys, f"{lang}.json is missing or has extra keys"


def test_complete_locales_have_no_missing_values():
    for lang in COMPLETE:
        data = _load(lang)
        missing = [
            key
            for key, value in data.items()
            if isinstance(value, dict) and not value
        ]
        assert not missing, f"{lang}.json has empty sections: {missing}"


def test_placeholder_locales_are_empty():
    for lang in PLACEHOLDERS:
        assert _load(lang) == {}, f"{lang}.json should stay empty until translated"
