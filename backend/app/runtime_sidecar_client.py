from __future__ import annotations

from dataclasses import dataclass

import httpx

from backend.runtime_contracts import MemoryPacket, RunLaunchResult, SidecarRunRequest


@dataclass(frozen=True)
class RuntimeSidecarClientConfig:
    base_url: str
    timeout_seconds: float = 30.0


class RuntimeSidecarClient:
    def __init__(
        self,
        config: RuntimeSidecarClientConfig,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self._config = config
        self._transport = transport

    async def start_run(self, run_id: str, memory_packet: MemoryPacket, run_kind: str) -> RunLaunchResult:
        request = SidecarRunRequest(
            runId=run_id,
            runKind=run_kind,
            memoryPacket=memory_packet,
        )

        try:
            async with httpx.AsyncClient(
                base_url=self._config.base_url.rstrip("/"),
                timeout=self._config.timeout_seconds,
                transport=self._transport,
            ) as client:
                response = await client.post("/runs/start", json=request.model_dump(mode="json"))
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text.strip() or exc.response.reason_phrase
            raise RuntimeError(f"Runtime sidecar rejected run start: {detail}") from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Runtime sidecar unavailable at {self._config.base_url}") from exc

        return RunLaunchResult.model_validate(response.json())
