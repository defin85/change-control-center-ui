from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.app.config import load_settings
from backend.app.runtime_sidecar_client import RuntimeSidecarClient, RuntimeSidecarClientConfig
from backend.app.domain import (
    answer_clarification_round,
    apply_run_transition,
    build_focus_graph,
    count_open_mandatory_gaps,
    create_auto_clarification_round,
    create_tenant_fact,
    curated_memory_packet,
    infer_run_kind,
    normalize_approvals,
)
from backend.app.store import SQLiteStore
from backend.app.ws_hub import EventHub
from backend.runtime_contracts import MemoryPacket


class RunCreateRequest(BaseModel):
    kind: str = Field(default="design")


class ClarificationAnswerRequest(BaseModel):
    answers: list[dict[str, Any]]


class PromotionRequest(BaseModel):
    fact: dict[str, str]


def _summarize_change(change: dict[str, Any]) -> dict[str, Any]:
    mandatory_gap_count = count_open_mandatory_gaps(change)
    return {
        "id": change["id"],
        "tenantId": change["tenantId"],
        "title": change["title"],
        "subtitle": change["subtitle"],
        "state": change["state"],
        "nextAction": change["nextAction"],
        "blocker": change["blocker"],
        "loopCount": change["loopCount"],
        "lastRunAgo": change["lastRunAgo"],
        "verificationStatus": change["verificationStatus"],
        "mandatoryGapCount": mandatory_gap_count,
    }


def _build_runtime_client() -> RuntimeSidecarClient:
    settings = load_settings()
    return RuntimeSidecarClient(
        RuntimeSidecarClientConfig(
            base_url=settings.runtime_sidecar_url,
            timeout_seconds=settings.runtime_sidecar_timeout_seconds,
        )
    )


def create_app(runtime_client: RuntimeSidecarClient | None = None) -> FastAPI:
    settings = load_settings()
    store = SQLiteStore(settings.db_path)
    store.initialize()
    event_hub = EventHub()

    app = FastAPI(title="Change Control Center")
    app.state.store = store
    app.state.event_hub = event_hub
    app.state.runtime_client = runtime_client or _build_runtime_client()

    web_dist = Path("web/dist")
    if web_dist.exists():
        app.mount("/assets", StaticFiles(directory=web_dist / "assets"), name="assets")

        @app.get("/", include_in_schema=False)
        def serve_root() -> FileResponse:
            return FileResponse(web_dist / "index.html")

    @app.get("/api/bootstrap")
    def get_bootstrap() -> dict[str, Any]:
        tenants = store.list_tenants()
        active_tenant_id = tenants[0]["id"]
        changes = [_summarize_change(change) for change in store.list_changes(active_tenant_id)]
        return {
            "tenants": tenants,
            "activeTenantId": active_tenant_id,
            "views": [
                {"id": "inbox", "label": "Inbox"},
                {"id": "ready", "label": "Ready"},
                {"id": "review", "label": "Review gaps"},
                {"id": "blocked", "label": "Blocked"},
                {"id": "done", "label": "Done"},
            ],
            "changes": changes,
        }

    @app.get("/api/tenants/{tenant_id}/changes")
    def list_changes(tenant_id: str) -> dict[str, Any]:
        tenant = store.get_tenant(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return {"changes": [_summarize_change(change) for change in store.list_changes(tenant_id)]}

    @app.get("/api/tenants/{tenant_id}/changes/{change_id}")
    def get_change_detail(tenant_id: str, change_id: str) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        clarification_rounds = store.list_clarification_rounds(change_id)
        focus_graph = build_focus_graph(change, clarification_rounds)
        return {
            "change": change,
            "runs": store.list_runs(tenant_id, change_id),
            "evidence": store.list_evidence(change_id),
            "clarificationRounds": clarification_rounds,
            "focusGraph": focus_graph,
            "tenantMemory": store.list_tenant_memory(tenant_id),
        }

    @app.get("/api/tenants/{tenant_id}/runs/{run_id}")
    def get_run_detail(tenant_id: str, run_id: str) -> dict[str, Any]:
        run = store.get_run(tenant_id, run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        return {"run": run, "events": store.list_run_events(run_id), "approvals": store.list_approvals(run_id)}

    @app.post("/api/tenants/{tenant_id}/changes/{change_id}/runs", status_code=201)
    async def create_run(tenant_id: str, change_id: str, request: RunCreateRequest) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")

        clarification_rounds = store.list_clarification_rounds(change_id)
        focus_graph = build_focus_graph(change, clarification_rounds)
        tenant_memory = store.list_tenant_memory(tenant_id)
        memory_packet = curated_memory_packet(tenant_memory, change, focus_graph)

        try:
            runtime_result = await app.state.runtime_client.start_run(
                run_id=f"{change_id}-{request.kind}",
                memory_packet=MemoryPacket(
                    tenantMemory=memory_packet["tenantMemory"],
                    changeContract=memory_packet["changeContract"],
                    changeMemory=memory_packet["changeMemory"],
                    focusGraph=memory_packet["focusGraph"],
                ),
                run_kind=request.kind,
            )
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        runtime_events = [event.model_dump(mode="json") for event in runtime_result.events]

        transition_result = {
            "status": runtime_result.status,
            "transport": runtime_result.transport,
            "threadId": runtime_result.threadId,
            "turnId": runtime_result.turnId,
            "prompt": f"/{request.kind} {change_id}",
            "summary": "Runtime adapter completed startup handshake.",
            "checks": ["thread lineage persisted"],
            "worktree": change["git"]["worktree"] if change["git"]["worktree"] != "not created" else f"wt-{change_id.split('-')[1]}-a",
        }

        existing_runs = store.list_runs(tenant_id, change_id)
        run, evidence, updated_change = apply_run_transition(change, existing_runs, transition_result, memory_packet, request.kind)
        store.create_run(run)
        for event in runtime_events:
            store.append_run_event(run["id"], event["type"], event["payload"])
        approvals = normalize_approvals(tenant_id, run["id"], runtime_events)
        for approval in approvals:
            store.add_approval(approval)
        for artifact in evidence:
            store.add_evidence(artifact)
        store.save_change(updated_change)

        await event_hub.broadcast(
            tenant_id,
            {"type": "run-created", "changeId": change_id, "runId": run["id"], "state": updated_change["state"]},
        )
        return {
            "run": run,
            "events": store.list_run_events(run["id"]),
            "approvals": store.list_approvals(run["id"]),
            "change": updated_change,
        }

    @app.post("/api/tenants/{tenant_id}/changes/{change_id}/actions/run-next", status_code=201)
    async def run_next(tenant_id: str, change_id: str) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        inferred_kind = infer_run_kind(change)
        return await create_run(tenant_id, change_id, RunCreateRequest(kind=inferred_kind))

    @app.post("/api/tenants/{tenant_id}/changes/{change_id}/clarifications/auto", status_code=201)
    async def create_auto_clarification(tenant_id: str, change_id: str) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        clarification_round = create_auto_clarification_round(change)
        store.add_clarification_round(clarification_round)
        await event_hub.broadcast(tenant_id, {"type": "clarification-created", "changeId": change_id, "roundId": clarification_round["id"]})
        return {"round": clarification_round}

    @app.post("/api/tenants/{tenant_id}/clarifications/{round_id}/answers")
    async def answer_clarification(tenant_id: str, round_id: str, request: ClarificationAnswerRequest) -> dict[str, Any]:
        clarification_round = store.get_clarification_round(tenant_id, round_id)
        if not clarification_round:
            raise HTTPException(status_code=404, detail="Clarification round not found")
        answered_round = answer_clarification_round(clarification_round, request.answers)
        store.save_clarification_round(answered_round)
        change = store.get_change(tenant_id, answered_round["changeId"])
        if change:
            change["memory"]["decisions"].append("Clarification answers captured")
            store.save_change(change)
        await event_hub.broadcast(
            tenant_id,
            {"type": "clarification-answered", "changeId": answered_round["changeId"], "roundId": answered_round["id"]},
        )
        return {"round": answered_round}

    @app.post("/api/tenants/{tenant_id}/changes/{change_id}/promotions", status_code=201)
    async def promote_fact(tenant_id: str, change_id: str, request: PromotionRequest) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        fact = create_tenant_fact(tenant_id, request.fact)
        store.add_tenant_memory(fact)
        change["memory"]["facts"].append(fact)
        store.save_change(change)
        await event_hub.broadcast(tenant_id, {"type": "fact-promoted", "changeId": change_id, "factId": fact["id"]})
        return {"fact": fact}

    @app.websocket("/api/tenants/{tenant_id}/events")
    async def events_stream(tenant_id: str, websocket: WebSocket) -> None:
        await event_hub.connect(tenant_id, websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            event_hub.disconnect(tenant_id, websocket)

    return app
