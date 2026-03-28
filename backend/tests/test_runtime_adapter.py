from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from pathlib import Path

import httpx
import websockets
from fastapi.testclient import TestClient

from backend.app.runtime_sidecar_client import RuntimeSidecarClient, RuntimeSidecarClientConfig
from backend.runtime_contracts import MemoryPacket
from backend.sidecar.main import create_app as create_runtime_sidecar_app


async def _fake_ws_handler(connection) -> None:
    request_id = 9101
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

        if method == "thread/fork":
            await connection.send(json.dumps({"id": message_id, "result": {"thread": {"id": "thr_ws_001_fork_1"}}}))
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
                            "item": {
                                "id": "cmd_ws_approval_1",
                                "type": "commandExecution",
                                "status": "inProgress",
                                "command": ["apply_patch", "change patch"],
                                "cwd": "/tmp/ws-worktree",
                            },
                        },
                    }
                )
            )
            await connection.send(
                json.dumps(
                    {
                        "id": request_id,
                        "method": "item/commandExecution/requestApproval",
                        "params": {
                            "threadId": "thr_ws_001",
                            "turnId": "turn_ws_001",
                            "itemId": "cmd_ws_approval_1",
                            "reason": "Approve websocket execution.",
                            "command": ["apply_patch", "change patch"],
                            "cwd": "/tmp/ws-worktree",
                            "availableDecisions": ["accept", "decline"],
                        },
                    }
                )
            )
            continue

        if message_id == request_id:
            await connection.send(
                json.dumps({"method": "serverRequest/resolved", "params": {"threadId": "thr_ws_001", "requestId": request_id}})
            )
            await connection.send(
                json.dumps(
                    {
                        "method": "item/completed",
                        "params": {
                            "threadId": "thr_ws_001",
                            "turnId": "turn_ws_001",
                            "item": {"id": "cmd_ws_approval_1", "type": "commandExecution", "status": "completed"},
                        },
                    }
                )
            )
            await connection.send(
                json.dumps({"method": "turn/completed", "params": {"turn": {"id": "turn_ws_001", "status": "completed"}}})
            )


def _wait_for_completed_poll(client: TestClient, run_id: str, cursor: int) -> dict:
    deadline = time.time() + 5
    last_payload: dict | None = None
    collected_events: list[dict] = []
    while time.time() < deadline:
        response = client.get(f"/runs/{run_id}", params={"cursor": cursor})
        assert response.status_code == 200
        last_payload = response.json()
        collected_events.extend(last_payload["events"])
        if last_payload["status"] == "completed":
            last_payload["events"] = collected_events
            return last_payload
        cursor = last_payload["nextCursor"]
        time.sleep(0.05)
    raise AssertionError(f"Run {run_id} did not complete. Last payload: {last_payload}")


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
                "status": "inProgress",
                "cursor": 1,
                "events": [{"type": "thread/started", "payload": {"thread": {"id": "thr_sidecar_001"}}}],
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
    assert result.cursor == 1


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
            assert response.status_code == 200
            payload = response.json()
            assert payload["threadId"] == "thr_stdio_001"
            assert payload["turnId"] == "turn_stdio_001"
            assert payload["transport"] == "stdio"
            assert payload["status"] == "inProgress"
            assert payload["events"]
            assert payload["cursor"] >= 1

            poll_response = client.get("/runs/run-1", params={"cursor": 0})
            assert poll_response.status_code == 200
            poll_payload = poll_response.json()
            assert any(event["type"] == "item/commandExecution/requestApproval" for event in poll_payload["events"])

            approval = client.post("/runs/run-1/approvals/9002/decision", json={"decision": "accept"})
            assert approval.status_code == 200

            completed = _wait_for_completed_poll(client, "run-1", poll_payload["nextCursor"])
    finally:
        for key, value in original.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    assert completed["status"] == "completed"
    assert any(event["type"] == "serverRequest/resolved" for event in completed["events"])


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
                assert response.status_code == 200
                payload = response.json()
                assert payload["threadId"] == "thr_ws_001"
                assert payload["turnId"] == "turn_ws_001"
                assert payload["transport"] == "websocket"
                assert payload["status"] == "inProgress"
                assert payload["events"]

                poll = await client.get("/runs/run-1", params={"cursor": 0})
                poll_payload = poll.json()
                assert any(event["type"] == "item/commandExecution/requestApproval" for event in poll_payload["events"])

                decision = await client.post("/runs/run-1/approvals/9101/decision", json={"decision": "accept"})
                assert decision.status_code == 200

                completed_payload: dict | None = None
                cursor = poll_payload["nextCursor"]
                for _ in range(40):
                    poll = await client.get("/runs/run-1", params={"cursor": cursor})
                    poll_payload = poll.json()
                    if poll_payload["status"] == "completed":
                        completed_payload = poll_payload
                        break
                    cursor = poll_payload["nextCursor"]
                    await asyncio.sleep(0.05)
        finally:
            for key, value in original.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value

        assert completed_payload is not None
        assert completed_payload["status"] == "completed"
        assert any(event["type"] == "serverRequest/resolved" for event in completed_payload["events"])


def test_runtime_sidecar_supports_websocket_transport() -> None:
    asyncio.run(_run_websocket_test())


def test_runtime_sidecar_health_reports_misconfiguration_when_transport_is_not_runnable() -> None:
    original = {key: os.environ.get(key) for key in ("CCC_RUNTIME_TRANSPORT", "CCC_RUNTIME_COMMAND", "CCC_RUNTIME_WS_URL")}
    os.environ["CCC_RUNTIME_TRANSPORT"] = "stdio"
    os.environ["CCC_RUNTIME_COMMAND"] = ""
    os.environ["CCC_RUNTIME_WS_URL"] = ""
    try:
        with TestClient(create_runtime_sidecar_app()) as client:
            response = client.get("/healthz")
    finally:
        for key, value in original.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    assert response.status_code == 503


def test_runtime_sidecar_rejects_missing_websocket_url() -> None:
    original = {key: os.environ.get(key) for key in ("CCC_RUNTIME_TRANSPORT", "CCC_RUNTIME_COMMAND", "CCC_RUNTIME_WS_URL")}
    os.environ["CCC_RUNTIME_TRANSPORT"] = "websocket"
    os.environ["CCC_RUNTIME_COMMAND"] = ""
    os.environ["CCC_RUNTIME_WS_URL"] = ""
    try:
        with TestClient(create_runtime_sidecar_app()) as client:
            response = client.post(
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

    assert response.status_code == 400
