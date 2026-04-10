from __future__ import annotations

import argparse
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class FakeHealthServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, server_address: tuple[str, int], mode: str) -> None:
        super().__init__(server_address, HealthHandler)
        self.mode = mode
        self.request_count = 0


class HealthHandler(BaseHTTPRequestHandler):
    server: FakeHealthServer

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/healthz":
            self.send_error(404)
            return

        self.server.request_count += 1
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"ok")

        if self.server.mode == "transient":
            threading.Thread(target=self.server.shutdown, daemon=True).start()

    def log_message(self, format: str, *args: object) -> None:
        return


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("stable", "transient"), required=True)
    parser.add_argument("--port", type=int, required=True)
    args = parser.parse_args()

    with FakeHealthServer(("127.0.0.1", args.port), args.mode) as server:
        server.serve_forever(poll_interval=0.05)


if __name__ == "__main__":
    main()
