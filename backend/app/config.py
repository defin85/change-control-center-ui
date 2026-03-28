from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    db_path: Path
    data_dir: Path
    runtime_sidecar_url: str
    runtime_sidecar_timeout_seconds: float


def load_settings() -> Settings:
    db_path = Path(os.environ.get("CCC_DB_PATH", "./.data/ccc.db")).resolve()
    data_dir = Path(os.environ.get("CCC_DATA_DIR", "./.data")).resolve()
    runtime_sidecar_url = os.environ.get("CCC_RUNTIME_SIDECAR_URL", "http://127.0.0.1:8010").rstrip("/")
    timeout_raw = os.environ.get("CCC_RUNTIME_SIDECAR_TIMEOUT_SECONDS", "30").strip()
    runtime_sidecar_timeout_seconds = float(timeout_raw)
    if runtime_sidecar_timeout_seconds <= 0:
        raise ValueError("CCC_RUNTIME_SIDECAR_TIMEOUT_SECONDS must be positive")

    data_dir.mkdir(parents=True, exist_ok=True)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    return Settings(
        db_path=db_path,
        data_dir=data_dir,
        runtime_sidecar_url=runtime_sidecar_url,
        runtime_sidecar_timeout_seconds=runtime_sidecar_timeout_seconds,
    )
