from __future__ import annotations

import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMMON_SH = ROOT / "scripts/lib/ccc/common.sh"
PROCESS_SH = ROOT / "scripts/lib/ccc/process.sh"
VERIFY_SH = ROOT / "scripts/lib/ccc/verify.sh"
FAKE_HEALTH_SERVER = ROOT / "backend/tests/fake_health_server.py"
FAKE_DETACHED_WRAPPER = ROOT / "backend/tests/fake_detached_wrapper.py"
LAUNCHER_PROFILE = "launcher-test"
LAUNCHER_COMPONENT = "detached-wrapper"


def _reserve_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _start_health_server(mode: str, port: int) -> subprocess.Popen[str]:
    return subprocess.Popen(
        [sys.executable, str(FAKE_HEALTH_SERVER), "--mode", mode, "--port", str(port)],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )


def _run_ccc_wait_for_component(pid: int, port: int, timeout_seconds: int = 5) -> subprocess.CompletedProcess[str]:
    shell_script = f"""
set -euo pipefail
source "{COMMON_SH}"
source "{PROCESS_SH}"
ccc_wait_for_component "{pid}" "http://127.0.0.1:{port}/healthz" "{timeout_seconds}"
"""
    return _run_shell(shell_script)


def _run_shell(script: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["bash", "-lc", script],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def _stop_process(process: subprocess.Popen[str]) -> None:
    if process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def _run_ccc_component_status(port: int) -> subprocess.CompletedProcess[str]:
    return _run_shell(
        f"""
set -euo pipefail
source "{COMMON_SH}"
source "{PROCESS_SH}"
ccc_component_status "{LAUNCHER_PROFILE}" "{LAUNCHER_COMPONENT}" "http://127.0.0.1:{port}/healthz"
"""
    )


def _run_ccc_stop_component() -> subprocess.CompletedProcess[str]:
    return _run_shell(
        f"""
set -euo pipefail
source "{COMMON_SH}"
source "{PROCESS_SH}"
ccc_stop_component "{LAUNCHER_PROFILE}" "{LAUNCHER_COMPONENT}"
"""
    )


def test_ccc_wait_for_component_accepts_stable_health_process() -> None:
    port = _reserve_port()
    process = _start_health_server("stable", port)

    try:
        result = _run_ccc_wait_for_component(process.pid, port)
        assert result.returncode == 0, result.stderr or result.stdout
    finally:
        _stop_process(process)


def test_ccc_wait_for_component_rejects_transient_health_process() -> None:
    port = _reserve_port()
    process = _start_health_server("transient", port)

    try:
        result = _run_ccc_wait_for_component(process.pid, port)
        assert result.returncode != 0
    finally:
        _stop_process(process)


def test_ccc_install_profile_cleanup_trap_captures_profile_for_signal_cleanup(
    tmp_path: Path,
) -> None:
    marker = tmp_path / "cleanup-profile.txt"
    result = _run_shell(
        f"""
set -euo pipefail
source "{COMMON_SH}"
ccc_stop_profile() {{
  printf '%s\\n' "$1" >"{marker}"
}}
ccc_install_profile_cleanup_trap "e2e"
kill -TERM $$
"""
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert marker.read_text(encoding="utf-8").strip() == "e2e"
    assert "unbound variable" not in result.stderr


def test_ccc_run_verify_playwright_phase_stops_e2e_before_and_after(tmp_path: Path) -> None:
    marker = tmp_path / "verify-phase.log"
    result = _run_shell(
        f"""
set -euo pipefail
source "{COMMON_SH}"
source "{VERIFY_SH}"
ccc_with_lock() {{
  "$@"
}}
ccc_stop_profile() {{
  printf 'stop:%s\\n' "$1" >>"{marker}"
}}
ccc_run_in_dir() {{
  local workdir="$1"
  shift
  printf 'run:%s:%s\\n' "$workdir" "$*" >>"{marker}"
}}
ccc_run_verify_playwright_phase "test:e2e"
"""
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert marker.read_text(encoding="utf-8").splitlines() == [
        "stop:e2e",
        f"run:{ROOT / 'web'}:npm run test:e2e",
        "stop:e2e",
    ]


def test_ccc_run_verify_playwright_phase_preserves_command_failure(tmp_path: Path) -> None:
    marker = tmp_path / "verify-phase-failure.log"
    result = _run_shell(
        f"""
set -euo pipefail
source "{COMMON_SH}"
source "{VERIFY_SH}"
ccc_with_lock() {{
  "$@"
}}
ccc_stop_profile() {{
  printf 'stop:%s\\n' "$1" >>"{marker}"
}}
ccc_run_in_dir() {{
  local workdir="$1"
  shift
  printf 'run:%s:%s\\n' "$workdir" "$*" >>"{marker}"
  return 23
}}
ccc_run_verify_playwright_phase "test:e2e:platform"
"""
    )

    assert result.returncode == 23, result.stderr or result.stdout
    assert marker.read_text(encoding="utf-8").splitlines() == [
        "stop:e2e",
        f"run:{ROOT / 'web'}:npm run test:e2e:platform",
        "stop:e2e",
    ]


def test_ccc_verify_ui_platform_composes_smoke_then_platform_gate(tmp_path: Path) -> None:
    marker = tmp_path / "verify-ui-platform.log"
    result = _run_shell(
        f"""
set -euo pipefail
source "{COMMON_SH}"
source "{VERIFY_SH}"
ccc_run_in_dir() {{
  local workdir="$1"
  shift
  printf 'run:%s:%s\\n' "$workdir" "$*" >>"{marker}"
}}
ccc_run_verify_playwright_phase() {{
  printf 'playwright:%s\\n' "$1" >>"{marker}"
}}
ccc_verify ui-platform
"""
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert marker.read_text(encoding="utf-8").splitlines() == [
        f"run:{ROOT}:uv run pytest backend/tests -q",
        f"run:{ROOT / 'web'}:npm run build",
        "playwright:test:e2e",
        f"run:{ROOT / 'web'}:npm run lint",
        "playwright:test:e2e:platform",
    ]


def test_ccc_verify_ui_full_composes_platform_then_full_gate(tmp_path: Path) -> None:
    marker = tmp_path / "verify-ui-full.log"
    result = _run_shell(
        f"""
set -euo pipefail
source "{COMMON_SH}"
source "{VERIFY_SH}"
ccc_run_in_dir() {{
  local workdir="$1"
  shift
  printf 'run:%s:%s\\n' "$workdir" "$*" >>"{marker}"
}}
ccc_run_verify_playwright_phase() {{
  printf 'playwright:%s\\n' "$1" >>"{marker}"
}}
ccc_verify ui-full
"""
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert marker.read_text(encoding="utf-8").splitlines() == [
        f"run:{ROOT}:uv run pytest backend/tests -q",
        f"run:{ROOT / 'web'}:npm run build",
        "playwright:test:e2e",
        f"run:{ROOT / 'web'}:npm run lint",
        "playwright:test:e2e:platform",
        "playwright:test:e2e:full",
    ]


def test_ccc_start_component_keeps_detached_group_alive_after_wrapper_exit() -> None:
    port = _reserve_port()
    start = _run_shell(
        f"""
set -euo pipefail
source "{COMMON_SH}"
source "{PROCESS_SH}"
CCC_COMPONENT_ENV=()
CCC_COMPONENT_CMD=("{sys.executable}" "{FAKE_DETACHED_WRAPPER}" "--port" "{port}" "--exit-after" "2.0")
ccc_start_component "{LAUNCHER_PROFILE}" "{LAUNCHER_COMPONENT}" "{port}" "http://127.0.0.1:{port}/healthz" "10" "{ROOT}" "1" CCC_COMPONENT_ENV CCC_COMPONENT_CMD
"""
    )

    try:
        assert start.returncode == 0, start.stderr or start.stdout

        time.sleep(3)
        status = _run_ccc_component_status(port)
        assert status.returncode == 0, status.stderr or status.stdout
        assert status.stdout.startswith("running pgid="), status.stdout

        health = _run_shell(f'curl -fsS "http://127.0.0.1:{port}/healthz" >/dev/null')
        assert health.returncode == 0
    finally:
        stop = _run_ccc_stop_component()
        assert stop.returncode == 0, stop.stderr or stop.stdout
