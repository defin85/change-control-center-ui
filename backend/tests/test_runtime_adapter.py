from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx
import websockets
from fastapi.testclient import TestClient

from backend.app.runtime_sidecar_client import RuntimeSidecarClient, RuntimeSidecarClientConfig
from backend.runtime_contracts import MemoryPacket
from backend.sidecar.main import create_app as create_runtime_sidecar_app


async def _fake_ws_handler(connection) -> None:
    async for raw_message in connection:
        message = json.loads(raw_message)
        method = message.get("method")
        message_id = message.get("id")

        if method == "initialize":
            await connection.send(json.dumps({"id": message_id, "result": {"platformFamily": "linux"}}))
            continue

        if method == "initialized":
            continue

        if method == "thread/start":
            await connection.send(json.dumps({"id": message_id, "result": {"thread": {"id": "thr_ws_001"}}}))
            continue

        if method == "turn/start":
            await connection.send(json.dumps({"id": message_id, "result": {"turn": {"id": "turn_ws_001"}}}))
            await connection.send(
                json.dumps(
                    {
                        "method": "item/started",
                        "params": {
                            "threadId": "thr_ws_001",
                            "turnId": "turn_ws_001",
                            "item": {"id": "item_ws_1", "type": "agentMessage", "text": "WS run"},
                        },
                    }
                )
            )
            await connection.send(
                json.dumps({"method": "turn/completed", "params": {"turn": {"id": "turn_ws_001", "status": "completed"}}})
            )


def test_runtime_sidecar_client_posts_internal_run_request() -> None:
    captured: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["payload"] = json.loads(request.content.decode("utf-8"))
        return httpx.Response(
            200,
            json={
                "threadId": "thr_sidecar_001",
                "turnId": "turn_sidecar_001",
                "transport": "stdio",
                "status": "completed",
                "events": [{"type": "turn/completed", "payload": {"turn": {"id": "turn_sidecar_001", "status": "completed"}}}],
            },
        )

    client = RuntimeSidecarClient(
        RuntimeSidecarClientConfig(base_url="http://sidecar.test"),
        transport=httpx.MockTransport(handler),
    )

    result = asyncio.run(
        client.start_run(
            run_id="run-1",
            memory_packet=MemoryPacket(
                tenantMemory={"facts": [{"title": "Tenant fact", "body": "Persistent"}]},
                changeContract={"goal": "Ship foundation"},
                changeMemory={"summary": "Active design"},
                focusGraph={"items": []},
            ),
            run_kind="design",
        )
    )

    assert captured["url"] == "http://sidecar.test/runs/start"
    payload = captured["payload"]
    assert isinstance(payload, dict)
    assert payload["runId"] == "run-1"
    assert payload["memoryPacket"]["changeContract"]["goal"] == "Ship foundation"
    assert result.threadId == "thr_sidecar_001"


def test_runtime_sidecar_supports_stdio_transport() -> None:
    script_path = Path(__file__).with_name("fake_stdio_app_server.py")
    original = {key: os.environ.get(key) for key in ("CCC_RUNTIME_TRANSPORT", "CCC_RUNTIME_COMMAND", "CCC_RUNTIME_WS_URL")}
    os.environ["CCC_RUNTIME_TRANSPORT"] = "stdio"
    os.environ["CCC_RUNTIME_COMMAND"] = f"{sys.executable} {script_path}"
    os.environ["CCC_RUNTIME_WS_URL"] = ""
    try:
        with TestClient(create_runtime_sidecar_app()) as client:
            response = client.post(
                "/runs/start",
                json={
                    "runId": "run-1",
                    "runKind": "apply",
                    "memoryPacket": {
                        "tenantMemory": {"facts": [{"title": "Tenant fact", "body": "Persistent"}]},
                        "changeContract": {"goal": "Ship foundation"},
                        "changeMemory": {"summary": "Active design"},
                        "focusGraph": {"items": []},
                    },
                },
            )
    finally:
        for key, value in original.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    assert response.status_code == 200
    payload = response.json()
    assert payload["threadId"] == "thr_stdio_001"
    assert payload["turnId"] == "turn_stdio_001"
    assert payload["transport"] == "stdio"
    assert payload["events"]


async def _run_websocket_test() -> None:
    async with websockets.serve(_fake_ws_handler, "127.0.0.1", 0) as server:
        port = server.sockets[0].getsockname()[1]
        original = {key: os.environ.get(key) for key in ("CCC_RUNTIME_TRANSPORT", "CCC_RUNTIME_COMMAND", "CCC_RUNTIME_WS_URL")}
        os.environ["CCC_RUNTIME_TRANSPORT"] = "websocket"
        os.environ["CCC_RUNTIME_COMMAND"] = ""
        os.environ["CCC_RUNTIME_WS_URL"] = f"ws://127.0.0.1:{port}"
        try:
            transport = httpx.ASGITransport(app=create_runtime_sidecar_app())
            async with httpx.AsyncClient(base_url="http://sidecar.test", transport=transport) as client:
                response = await client.post(
                    "/runs/start",
                    json={
                        "runId": "run-1",
                        "runKind": "review",
                        "memoryPacket": {
                            "tenantMemory": {"facts": []},
                            "changeContract": {"goal": "Ship foundation"},
                            "changeMemory": {"summary": "Active design"},
                            "focusGraph": {"items": []},
                        },
                    },
                )
        finally:
            for key, value in original.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value

        assert response.status_code == 200
        payload = response.json()
        assert payload["threadId"] == "thr_ws_001"
        assert payload["turnId"] == "turn_ws_001"
        assert payload["transport"] == "websocket"
        assert payload["events"]


def test_runtime_sidecar_supports_websocket_transport() -> None:
    asyncio.run(_run_websocket_test())
