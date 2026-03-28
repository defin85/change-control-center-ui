from __future__ import annotations

import asyncio
import json
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

import websockets

from backend.runtime_contracts import ApprovalDecision, MemoryPacket, RuntimeEvent, Transport


@dataclass(frozen=True)
class AppServerConfig:
    transport: Transport
    command: list[str]
    ws_url: str | None


class CodexAppServerRunner:
    def __init__(self, config: AppServerConfig):
        self._config = config

    async def run_session(
        self,
        *,
        memory_packet: MemoryPacket,
        run_id: str,
        run_kind: str,
        parent_thread_id: str | None,
        on_started: Callable[[str, str], Awaitable[None]],
        on_event: Callable[[RuntimeEvent], Awaitable[None]],
        on_approval_request: Callable[[int, RuntimeEvent], Awaitable[ApprovalDecision]],
    ) -> str:
        prompt = f"change-control-center:{run_kind}:{run_id}"
        if self._config.transport == "stdio":
            return await self._run_stdio_session(
                memory_packet=memory_packet,
                prompt=prompt,
                parent_thread_id=parent_thread_id,
                on_started=on_started,
                on_event=on_event,
                on_approval_request=on_approval_request,
            )
        return await self._run_websocket_session(
            memory_packet=memory_packet,
            prompt=prompt,
            parent_thread_id=parent_thread_id,
            on_started=on_started,
            on_event=on_event,
            on_approval_request=on_approval_request,
        )

    async def _run_stdio_session(
        self,
        *,
        memory_packet: MemoryPacket,
        prompt: str,
        parent_thread_id: str | None,
        on_started: Callable[[str, str], Awaitable[None]],
        on_event: Callable[[RuntimeEvent], Awaitable[None]],
        on_approval_request: Callable[[int, RuntimeEvent], Awaitable[ApprovalDecision]],
    ) -> str:
        if not self._config.command:
            raise ValueError("Stdio transport requires a command")

        process = await asyncio.create_subprocess_exec(
            *self._config.command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        assert process.stdin is not None
        assert process.stdout is not None
        assert process.stderr is not None

        async def send(message: dict[str, Any]) -> None:
            process.stdin.write((json.dumps(message) + "\n").encode("utf-8"))
            await process.stdin.drain()

        async def read_message() -> dict[str, Any]:
            raw = await process.stdout.readline()
            if raw:
                return json.loads(raw.decode("utf-8"))

            stderr_output = (await process.stderr.read()).decode("utf-8").strip()
            if stderr_output:
                raise RuntimeError(stderr_output)
            raise RuntimeError("Codex stdio transport closed unexpectedly")

        try:
            return await self._drive_session(
                send=send,
                read_message=read_message,
                memory_packet=memory_packet,
                prompt=prompt,
                parent_thread_id=parent_thread_id,
                on_started=on_started,
                on_event=on_event,
                on_approval_request=on_approval_request,
            )
        finally:
            if process.returncode is None:
                process.terminate()
            await process.wait()

    async def _run_websocket_session(
        self,
        *,
        memory_packet: MemoryPacket,
        prompt: str,
        parent_thread_id: str | None,
        on_started: Callable[[str, str], Awaitable[None]],
        on_event: Callable[[RuntimeEvent], Awaitable[None]],
        on_approval_request: Callable[[int, RuntimeEvent], Awaitable[ApprovalDecision]],
    ) -> str:
        if not self._config.ws_url:
            raise ValueError("WebSocket transport requires a ws_url")

        async with websockets.connect(self._config.ws_url) as connection:
            async def send(message: dict[str, Any]) -> None:
                await connection.send(json.dumps(message))

            async def read_message() -> dict[str, Any]:
                return json.loads(await connection.recv())

            return await self._drive_session(
                send=send,
                read_message=read_message,
                memory_packet=memory_packet,
                prompt=prompt,
                parent_thread_id=parent_thread_id,
                on_started=on_started,
                on_event=on_event,
                on_approval_request=on_approval_request,
            )

    async def _drive_session(
        self,
        *,
        send: Callable[[dict[str, Any]], Awaitable[None]],
        read_message: Callable[[], Awaitable[dict[str, Any]]],
        memory_packet: MemoryPacket,
        prompt: str,
        parent_thread_id: str | None,
        on_started: Callable[[str, str], Awaitable[None]],
        on_event: Callable[[RuntimeEvent], Awaitable[None]],
        on_approval_request: Callable[[int, RuntimeEvent], Awaitable[ApprovalDecision]],
    ) -> str:
        await send({"method": "initialize", "id": 1, "params": {"clientInfo": {"name": "ccc", "version": "0.1.0"}}})
        self._ensure_ok(await read_message())
        await send({"method": "initialized", "params": {}})

        thread_request = {
            "method": "thread/fork" if parent_thread_id else "thread/start",
            "id": 2,
            "params": {"threadId": parent_thread_id} if parent_thread_id else {"model": "gpt-5.4", "serviceName": "change-control-center"},
        }
        await send(thread_request)

        thread_id = ""
        while not thread_id:
            message = self._ensure_ok(await read_message())
            if message.get("id") == 2:
                thread_id = message["result"]["thread"]["id"]
                continue
            await self._handle_server_message(message, on_event, on_approval_request, send)

        await send(
            {
                "method": "turn/start",
                "id": 3,
                "params": {
                    "threadId": thread_id,
                    "input": memory_packet.to_wire_payload() + [{"type": "text", "text": prompt}],
                },
            }
        )

        turn_id = ""
        status = "inProgress"
        started_sent = False
        while status != "completed":
            message = self._ensure_ok(await read_message())
            if message.get("id") == 3:
                turn_id = message["result"]["turn"]["id"]
                if not started_sent:
                    await on_started(thread_id, turn_id)
                    started_sent = True
                continue

            if "method" not in message:
                continue

            event = self._to_event(message)
            await on_event(event)
            if event.type.endswith("requestApproval"):
                request_id = message.get("id")
                if request_id is None:
                    raise RuntimeError(f"Approval event {event.type} arrived without request id")
                decision = await on_approval_request(request_id, event)
                await send({"id": request_id, "result": decision})
                continue

            if message["method"] == "turn/completed":
                status = message["params"]["turn"]["status"]
                turn_id = turn_id or message["params"]["turn"]["id"]
                if not started_sent:
                    await on_started(thread_id, turn_id)
                    started_sent = True

        return status

    def _ensure_ok(self, message: dict[str, Any]) -> dict[str, Any]:
        if "error" not in message:
            return message

        error = message["error"]
        detail = error.get("message", "Codex app-server returned an error")
        raise RuntimeError(detail)

    def _to_event(self, message: dict[str, Any]) -> RuntimeEvent:
        payload = dict(message.get("params", {}))
        if "id" in message:
            payload["_requestId"] = message["id"]
        return RuntimeEvent(type=message["method"], payload=payload)

    async def _handle_server_message(
        self,
        message: dict[str, Any],
        on_event: Callable[[RuntimeEvent], Awaitable[None]],
        on_approval_request: Callable[[int, RuntimeEvent], Awaitable[ApprovalDecision]],
        send: Callable[[dict[str, Any]], Awaitable[None]],
    ) -> None:
        if "method" not in message:
            return

        event = self._to_event(message)
        await on_event(event)
        if event.type.endswith("requestApproval"):
            request_id = message.get("id")
            if request_id is None:
                raise RuntimeError(f"Approval event {event.type} arrived without request id")
            decision = await on_approval_request(request_id, event)
            await send({"id": request_id, "result": decision})
