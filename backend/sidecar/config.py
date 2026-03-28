from __future__ import annotations

import os
import shlex
from dataclasses import dataclass

from backend.runtime_contracts import Transport


@dataclass(frozen=True)
class SidecarSettings:
    transport: Transport
    command: list[str]
    ws_url: str | None


def load_settings() -> SidecarSettings:
    transport = os.environ.get("CCC_RUNTIME_TRANSPORT", "stdio")
    if transport not in {"stdio", "websocket"}:
        raise ValueError(f"Unsupported runtime transport: {transport}")

    default_command = "codex app-server --listen stdio://"
    command_text = os.environ.get("CCC_RUNTIME_COMMAND", default_command if transport == "stdio" else "").strip()
    command = shlex.split(command_text) if command_text else []
    ws_url = os.environ.get("CCC_RUNTIME_WS_URL") or None

    return SidecarSettings(
        transport=transport,
        command=command,
        ws_url=ws_url,
    )
