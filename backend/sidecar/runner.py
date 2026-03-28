from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any

import websockets

from backend.runtime_contracts import MemoryPacket, RunLaunchResult, RuntimeEvent, Transport


@dataclass(frozen=True)
class AppServerConfig:
    transport: Transport
    command: list[str]
    ws_url: str | None


class CodexAppServerRunner:
    def __init__(self, config: AppServerConfig):
        self._config = config

    async def start_run(self, run_id: str, memory_packet: MemoryPacket, run_kind: str) -> RunLaunchResult:
        prompt = f"change-control-center:{run_kind}:{run_id}"
        if self._config.transport == "stdio":
            return await self._start_stdio_run(memory_packet, prompt)
        return await self._start_websocket_run(memory_packet, prompt)

    async def _start_stdio_run(self, memory_packet: MemoryPacket, prompt: str) -> RunLaunchResult:
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
            events: list[RuntimeEvent] = []

            await send({"method": "initialize", "id": 1, "params": {"clientInfo": {"name": "ccc", "version": "0.1.0"}}})
            self._ensure_ok(await read_message())
            await send({"method": "initialized", "params": {}})

            await send(
                {
                    "method": "thread/start",
                    "id": 2,
                    "params": {"model": "gpt-5.4", "serviceName": "change-control-center"},
                }
            )
            thread_id = ""
            while not thread_id:
                message = self._ensure_ok(await read_message())
                if message.get("id") == 2:
                    thread_id = message["result"]["thread"]["id"]
                elif "method" in message:
                    events.append(RuntimeEvent(type=message["method"], payload=message.get("params", {})))

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
            while status != "completed":
                message = self._ensure_ok(await read_message())
                if message.get("id") == 3:
                    turn_id = message["result"]["turn"]["id"]
                    continue
                if "method" not in message:
                    continue
                events.append(RuntimeEvent(type=message["method"], payload=message.get("params", {})))
                if message["method"] == "turn/completed":
                    status = message["params"]["turn"]["status"]
                    turn_id = turn_id or message["params"]["turn"]["id"]
        finally:
            if process.returncode is None:
                process.terminate()
            await process.wait()

        return RunLaunchResult(
            threadId=thread_id,
            turnId=turn_id,
            transport="stdio",
            status=status,
            events=events,
        )

    async def _start_websocket_run(self, memory_packet: MemoryPacket, prompt: str) -> RunLaunchResult:
        if not self._config.ws_url:
            raise ValueError("WebSocket transport requires a ws_url")

        events: list[RuntimeEvent] = []
        async with websockets.connect(self._config.ws_url) as connection:
            await connection.send(json.dumps({"method": "initialize", "id": 1, "params": {"clientInfo": {"name": "ccc"}}}))
            self._ensure_ok(json.loads(await connection.recv()))
            await connection.send(json.dumps({"method": "initialized", "params": {}}))
            await connection.send(
                json.dumps(
                    {
                        "method": "thread/start",
                        "id": 2,
                        "params": {"model": "gpt-5.4", "serviceName": "change-control-center"},
                    }
                )
            )

            thread_id = ""
            while not thread_id:
                message = self._ensure_ok(json.loads(await connection.recv()))
                if message.get("id") == 2:
                    thread_id = message["result"]["thread"]["id"]
                elif "method" in message:
                    events.append(RuntimeEvent(type=message["method"], payload=message.get("params", {})))

            await connection.send(
                json.dumps(
                    {
                        "method": "turn/start",
                        "id": 3,
                        "params": {
                            "threadId": thread_id,
                            "input": memory_packet.to_wire_payload() + [{"type": "text", "text": prompt}],
                        },
                    }
                )
            )

            turn_id = ""
            status = "inProgress"
            while status != "completed":
                message = self._ensure_ok(json.loads(await connection.recv()))
                if message.get("id") == 3:
                    turn_id = message["result"]["turn"]["id"]
                    continue
                if "method" not in message:
                    continue
                events.append(RuntimeEvent(type=message["method"], payload=message.get("params", {})))
                if message["method"] == "turn/completed":
                    status = message["params"]["turn"]["status"]
                    turn_id = turn_id or message["params"]["turn"]["id"]

        return RunLaunchResult(
            threadId=thread_id,
            turnId=turn_id,
            transport="websocket",
            status=status,
            events=events,
        )

    def _ensure_ok(self, message: dict[str, Any]) -> dict[str, Any]:
        if "error" not in message:
            return message

        error = message["error"]
        detail = error.get("message", "Codex app-server returned an error")
        raise RuntimeError(detail)
