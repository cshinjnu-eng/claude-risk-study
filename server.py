#!/usr/bin/env python3
"""Minimal same-origin server for the risk-checker prototype.

Serves static files and stores explicitly consented submissions in SQLite.
It intentionally does not persist request IP addresses or User-Agent strings.
"""

from __future__ import annotations

import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("RISK_STUDY_DB", ROOT / "data" / "submissions.sqlite3"))
MAX_BODY = 64 * 1024
ALLOWED_TOP_LEVEL = {
    "consent",
    "consent_version",
    "schema_version",
    "assessment",
    "derived_risk",
    "extended",
}


def initialize() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            """CREATE TABLE IF NOT EXISTS submissions (
                submission_id TEXT PRIMARY KEY,
                submitted_at TEXT NOT NULL,
                consent_version TEXT NOT NULL,
                schema_version TEXT NOT NULL,
                payload_json TEXT NOT NULL
            )"""
        )


def validate_scalar(value, depth: int = 0) -> bool:
    if depth > 5:
        return False
    if value is None or isinstance(value, (bool, int, float)):
        return True
    if isinstance(value, str):
        return len(value) <= 500
    if isinstance(value, list):
        return len(value) <= 30 and all(validate_scalar(x, depth + 1) for x in value)
    if isinstance(value, dict):
        return len(value) <= 60 and all(
            isinstance(k, str) and len(k) <= 80 and validate_scalar(v, depth + 1)
            for k, v in value.items()
        )
    return False


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        # Avoid emitting client addresses in prototype logs.
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def json_response(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            self.json_response(HTTPStatus.OK, {"status": "ok", "storage": "sqlite"})
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/submissions":
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            self.json_response(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "invalid_body_size"}
            )
            return
        try:
            payload = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.json_response(HTTPStatus.BAD_REQUEST, {"error": "invalid_json"})
            return
        if not isinstance(payload, dict) or set(payload) - ALLOWED_TOP_LEVEL:
            self.json_response(HTTPStatus.BAD_REQUEST, {"error": "invalid_fields"})
            return
        if payload.get("consent") is not True:
            self.json_response(
                HTTPStatus.BAD_REQUEST, {"error": "explicit_consent_required"}
            )
            return
        if not validate_scalar(payload):
            self.json_response(HTTPStatus.BAD_REQUEST, {"error": "invalid_payload"})
            return
        if not all(
            isinstance(payload.get(k), str) and payload[k]
            for k in ("consent_version", "schema_version")
        ):
            self.json_response(
                HTTPStatus.BAD_REQUEST, {"error": "missing_schema_or_consent_version"}
            )
            return

        submission_id = uuid.uuid4().hex[:12]
        submitted_at = datetime.now(timezone.utc).isoformat()
        stored = dict(payload)
        stored.pop("consent", None)
        with sqlite3.connect(DB_PATH) as db:
            db.execute(
                "INSERT INTO submissions VALUES (?, ?, ?, ?, ?)",
                (
                    submission_id,
                    submitted_at,
                    payload["consent_version"],
                    payload["schema_version"],
                    json.dumps(stored, ensure_ascii=False, separators=(",", ":")),
                ),
            )
        self.json_response(
            HTTPStatus.CREATED, {"ok": True, "submission_id": submission_id}
        )


def main() -> None:
    initialize()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8780"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Risk checker: http://{host}:{port}")
    print(f"SQLite: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
