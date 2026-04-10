from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", required=True)
    parser.add_argument("--log-file", required=True)
    parser.add_argument("--env", action="append", default=[])
    parser.add_argument("command", nargs=argparse.REMAINDER)
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    command = args.command[1:] if args.command and args.command[0] == "--" else args.command
    if not command:
        raise SystemExit("spawn_detached.py requires a command after --")

    env = os.environ.copy()
    for assignment in args.env:
        name, separator, value = assignment.partition("=")
        if not separator:
            raise SystemExit(f"invalid env assignment: {assignment}")
        env[name] = value

    log_path = Path(args.log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("ab") as log_handle:
        process = subprocess.Popen(
            command,
            cwd=args.workdir,
            env=env,
            stdin=subprocess.DEVNULL,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

    sys.stdout.write(f"-{process.pid}\n")


if __name__ == "__main__":
    main()
