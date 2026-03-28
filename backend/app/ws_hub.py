from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class EventHub:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, tenant_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[tenant_id].append(websocket)

    def disconnect(self, tenant_id: str, websocket: WebSocket) -> None:
        if websocket in self._connections.get(tenant_id, []):
            self._connections[tenant_id].remove(websocket)

    async def broadcast(self, tenant_id: str, payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for websocket in self._connections.get(tenant_id, []):
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(tenant_id, websocket)

