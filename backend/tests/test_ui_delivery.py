from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path

import httpx
from fastapi.testclient import TestClient

from backend.app.main import create_app
from backend.app.runtime_sidecar_client import RuntimeSidecarClient, RuntimeSidecarClientConfig
from backend.sidecar.main import create_app as create_runtime_sidecar_app


def _make_delivery_client(web_dist: Path) -> Iterator[TestClient]:
    sidecar_app = create_runtime_sidecar_app()
    runtime_transport = httpx.ASGITransport(app=sidecar_app)
    runtime_client = RuntimeSidecarClient(
        RuntimeSidecarClientConfig(base_url="http://sidecar.test"),
        transport=runtime_transport,
    )
    app = create_app(runtime_client=runtime_client, web_dist=web_dist)
    return TestClient(app)


def test_backend_serves_built_operator_shell_from_configured_artifact(
    app_env: dict[str, str],
    tmp_path: Path,
) -> None:
    os.environ.update(app_env)
    web_dist = tmp_path / "web-dist"
    assets_dir = web_dist / "assets"
    assets_dir.mkdir(parents=True)
    (web_dist / "index.html").write_text("<!doctype html><html><body>operator shell</body></html>", encoding="utf-8")
    (assets_dir / "app.js").write_text("console.log('operator shell')", encoding="utf-8")

    with _make_delivery_client(web_dist) as client:
        health = client.get("/healthz/ui-artifact")
        root = client.get("/")
        asset = client.get("/assets/app.js")

    assert health.status_code == 200
    assert health.json() == {
        "status": "ready",
        "webDist": str(web_dist),
        "indexHtml": str(web_dist / "index.html"),
        "assetsDir": str(assets_dir),
    }
    assert root.status_code == 200
    assert "operator shell" in root.text
    assert asset.status_code == 200
    assert "operator shell" in asset.text


def test_backend_served_ui_fails_closed_without_built_artifact(
    app_env: dict[str, str],
    tmp_path: Path,
) -> None:
    os.environ.update(app_env)
    web_dist = tmp_path / "partial-web-dist"
    web_dist.mkdir()
    (web_dist / "index.html").write_text("<!doctype html><html><body>partial shell</body></html>", encoding="utf-8")

    with _make_delivery_client(web_dist) as client:
        health = client.get("/healthz/ui-artifact")
        root = client.get("/")
        bootstrap = client.get("/api/bootstrap")

    assert health.status_code == 503
    assert str(web_dist / "assets") in health.json()["detail"]
    assert "cd web && npm run build" in health.json()["detail"]
    assert root.status_code == 503
    assert str(web_dist / "assets") in root.json()["detail"]
    assert bootstrap.status_code == 200
