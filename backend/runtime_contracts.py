from __future__ import annotations

import json
from typing import Any, Literal

from pydantic import BaseModel, Field


Transport = Literal["stdio", "websocket"]


class MemoryPacket(BaseModel):
    tenantMemory: dict[str, Any]
    changeContract: dict[str, Any]
    changeMemory: dict[str, Any]
    focusGraph: dict[str, Any]

    def to_wire_payload(self) -> list[dict[str, str]]:
        body = {
            "tenantMemory": self.tenantMemory,
            "changeContract": self.changeContract,
            "changeMemory": self.changeMemory,
            "focusGraph": self.focusGraph,
        }
        return [{"type": "text", "text": json.dumps(body, ensure_ascii=True)}]


class RuntimeEvent(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class SidecarRunRequest(BaseModel):
    runId: str
    runKind: str
    memoryPacket: MemoryPacket


class RunLaunchResult(BaseModel):
    threadId: str
    turnId: str
    transport: Transport
    status: str
    events: list[RuntimeEvent] = Field(default_factory=list)
