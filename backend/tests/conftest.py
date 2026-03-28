from __future__ import annotations

import contextlib
import os
import sys
from collections.abc import Iterator
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.main import create_app
from backend.app.runtime_sidecar_client import RuntimeSidecarClient, RuntimeSidecarClientConfig
from backend.sidecar.main import create_app as create_runtime_sidecar_app


@pytest.fixture()
def app_env(tmp_path: Path) -> Iterator[dict[str, str]]:
    db_path = tmp_path / "ccc.db"
    data_path = tmp_path / "data"
    data_path.mkdir()
    env = {
        "CCC_DB_PATH": str(db_path),
        "CCC_DATA_DIR": str(data_path),
        "CCC_RUNTIME_SIDECAR_URL": "http://sidecar.test",
        "CCC_RUNTIME_TRANSPORT": "stdio",
        "CCC_RUNTIME_COMMAND": "",
        "CCC_RUNTIME_WS_URL": "",
    }
    original = {key: os.environ.get(key) for key in env}
    os.environ.update(env)
    try:
        yield env
    finally:
        for key, value in original.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


@pytest.fixture()
def make_client() -> Iterator[contextlib.AbstractContextManager[TestClient]]:
    @contextlib.contextmanager
    def _make_client() -> Iterator[TestClient]:
        sidecar_app = create_runtime_sidecar_app()
        runtime_transport = httpx.ASGITransport(app=sidecar_app)
        runtime_client = RuntimeSidecarClient(
            RuntimeSidecarClientConfig(base_url="http://sidecar.test"),
            transport=runtime_transport,
        )
        app = create_app(runtime_client=runtime_client)
        with TestClient(app) as test_client:
            yield test_client

    yield _make_client


@pytest.fixture()
def client(app_env: dict[str, str], make_client: contextlib.AbstractContextManager[TestClient]) -> Iterator[TestClient]:
    with make_client() as test_client:
        yield test_client
