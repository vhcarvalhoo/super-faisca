#!/usr/bin/env python3
"""Testa o Super Faísca no computador antes de publicar.

    python servir.py          -> abre http://localhost:8765
    python servir.py --rede   -> também no tablet/celular da mesma rede Wi-Fi

O app em si não precisa de Python: são arquivos estáticos que rodam no navegador.
Este script só serve a pasta, porque o modo offline (service worker) não
funciona abrindo o index.html direto do disco.
"""
import argparse
import functools
import socket
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PASTA = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".js": "application/javascript; charset=utf-8",
                      ".css": "text/css; charset=utf-8",
                      ".html": "text/html; charset=utf-8",
                      ".webmanifest": "application/manifest+json"}

    def log_message(self, *a):
        pass


def ip_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--porta", type=int, default=8765)
    ap.add_argument("--rede", action="store_true")
    ap.add_argument("--sem-navegador", action="store_true")
    a = ap.parse_args()
    srv = ThreadingHTTPServer(("0.0.0.0" if a.rede else "127.0.0.1", a.porta),
                              functools.partial(Handler, directory=str(PASTA)))
    url = f"http://localhost:{a.porta}"
    print(f"\n  ⚡ Super Faísca rodando em {url}")
    if a.rede:
        print(f"  No tablet (mesma rede): http://{ip_local()}:{a.porta}")
    print("  Para fechar: Ctrl+C\n")
    if not a.sem_navegador:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        srv.server_close()


if __name__ == "__main__":
    main()
