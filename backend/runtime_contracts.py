from __future__ import annotations

import json
from typing import Any, Literal

from pydantic import BaseModel, Field


Transport = Literal["stdio", "websocket"]
ApprovalDecision = Literal["accept", "acceptForSession", "decline", "cancel"]


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
    parentThreadId: str | None = None


class RunLaunchResult(BaseModel):
    threadId: str
    turnId: str
    transport: Transport
    status: str
    cursor: int = 0
    events: list[RuntimeEvent] = Field(default_factory=list)


class RunPollResult(BaseModel):
    threadId: str
    turnId: str
    transport: Transport
    status: str
    nextCursor: int
    events: list[RuntimeEvent] = Field(default_factory=list)


class ApprovalDecisionRequest(BaseModel):
    decision: ApprovalDecision
