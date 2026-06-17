#!/usr/bin/env python3
"""serve.py — local static server for the CCA trainer (Docker-free fallback).

ES modules need http(s); opening index.html as a file:// URL won't load them.
This serves the repo with correct MIME types using only the Python stdlib.

    python3 serve.py                # http://localhost:8088
    python3 serve.py --port 9000
    python3 serve.py --open         # also open a browser tab

Prefer `docker compose up` if you have Docker; this is the no-install fallback.
"""
from __future__ import annotations

import argparse
import contextlib
import functools
import http.server
import socket
import sys
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent


# ---- color-coded output ---------------------------------------------------
def _c(code: str, text: str) -> str:
    return text if not sys.stdout.isatty() else f"\033[{code}m{text}\033[0m"


def info(msg: str) -> None:    print(_c("36", "info"),    msg)
def success(msg: str) -> None: print(_c("32", "ok"),      msg)
def warn(msg: str) -> None:    print(_c("33", "warn"),    msg)
def error(msg: str) -> None:   print(_c("31", "error"),   msg, file=sys.stderr)


class Handler(http.server.SimpleHTTPRequestHandler):
    """Static handler rooted at the repo with explicit module MIME types."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
    }

    def end_headers(self) -> None:  # no caching during study sessions
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:  # quieter, colored
        info(f"{self.address_string()} {fmt % args}")


def _port_free(host: str, port: int) -> bool:
    with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        return s.connect_ex((host, port)) != 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Serve the CCA trainer locally.")
    ap.add_argument("--host", default="127.0.0.1", help="bind host (default 127.0.0.1)")
    ap.add_argument("--port", type=int, default=8088, help="port (default 8088)")
    ap.add_argument("--open", action="store_true", help="open a browser tab")
    args = ap.parse_args()

    if not (ROOT / "index.html").exists():
        error("index.html not found next to serve.py — run from the repo root.")
        return 1
    if not _port_free(args.host, args.port):
        error(f"port {args.port} is already in use; try --port <other>.")
        return 1

    handler = functools.partial(Handler, directory=str(ROOT))
    url = f"http://{args.host}:{args.port}/"
    try:
        with http.server.ThreadingHTTPServer((args.host, args.port), handler) as httpd:
            success(f"serving {ROOT.name} at {url}  (Ctrl-C to stop)")
            if args.open:
                webbrowser.open(url)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print()
        info("stopped.")
        return 0
    except OSError as e:
        error(f"could not start server: {e}")
        return 1
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:  # never show a raw traceback
        error(f"unexpected failure: {e}")
        raise SystemExit(1)
