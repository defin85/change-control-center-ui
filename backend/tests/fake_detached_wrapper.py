from __future__ import annotations

import argparse
import signal
import subprocess
import sys
import time


child_process: subprocess.Popen[str] | None = None


def _stop_child(*_: object) -> None:
    if child_process is None or child_process.poll() is not None:
        raise SystemExit(0)

    child_process.terminate()
    try:
        child_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        child_process.kill()
        child_process.wait(timeout=5)
    raise SystemExit(0)


def main() -> None:
    global child_process

    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--exit-after", type=float, default=2.0)
    args = parser.parse_args()

    signal.signal(signal.SIGTERM, _stop_child)
    signal.signal(signal.SIGINT, _stop_child)

    child_process = subprocess.Popen(
        [
            sys.executable,
            "backend/tests/fake_health_server.py",
            "--mode",
            "stable",
            "--port",
            str(args.port),
        ],
        text=True,
    )
    time.sleep(args.exit_after)


if __name__ == "__main__":
    main()
