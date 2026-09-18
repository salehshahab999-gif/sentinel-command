from __future__ import annotations

import hashlib
import hmac
import os
import time

from flask import jsonify, request
from pdf2zh.backend import flask_app

SECRET_FALLBACK = "sentinel-translet-local-dev-secret"


def _secret() -> str:
    configured = os.environ.get("PDF_TRANSLATOR_SHARED_SECRET", "")
    if configured:
        return configured

    if os.environ.get("TRANSLET_ENV", "production").lower() != "production":
        return SECRET_FALLBACK

    return ""


def _valid_token(token: str) -> bool:
    secret = _secret()
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


@flask_app.before_request
def authenticate_request():
    if request.path == "/health" or request.method == "OPTIONS":
        return None

    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return jsonify({"error": "missing bearer token"}), 401

    token = authorization.removeprefix("Bearer ").strip()
    if not _valid_token(token):
        return jsonify({"error": "invalid or expired token"}), 401

    return None


if __name__ == "__main__":
    flask_app.run(host="0.0.0.0", port=11008)
