from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

from backend.app.config import load_settings
from backend.app.runtime_sidecar_client import RuntimeSidecarClient, RuntimeSidecarClientConfig
from backend.app.ui_delivery import inspect_web_artifact
from backend.app.domain import (
    apply_approval_decision,
    answer_clarification_round,
    apply_run_transition,
    block_change_by_spec,
    build_repository_catalog_entry,
    build_approval_record,
    build_focus_graph,
    count_open_mandatory_gaps,
    create_change,
    create_auto_clarification_round,
    create_pending_run,
    create_tenant,
    create_tenant_fact,
    curated_memory_packet,
    escalate_change,
    infer_run_kind,
    mark_change_run_started,
    record_clarification_answers,
)
from backend.app.store import SQLiteStore
from backend.app.ws_hub import EventHub
from backend.runtime_contracts import MemoryPacket


class RunCreateRequest(BaseModel):
    kind: str = Field(default="design")


class ChangeCreateRequest(BaseModel):
    title: str | None = None


class TenantCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1)
    repoPath: str = Field(min_length=1)
    description: str = ""


class ClarificationAnswerItem(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    questionId: str = Field(min_length=1)
    selectedOptionId: str = Field(min_length=1)
    freeformNote: str | None = None


class ClarificationAnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answers: list[ClarificationAnswerItem] = Field(min_length=1)


class PromotionFact(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1)
    body: str = Field(min_length=1)


class PromotionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fact: PromotionFact


class ApprovalDecisionRequest(BaseModel):
    decision: str


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


def _build_repository_catalog(store: SQLiteStore) -> list[dict[str, Any]]:
    tenants = store.list_tenants()
    return [build_repository_catalog_entry(tenant, store.list_changes(tenant["id"])) for tenant in tenants]


def create_app(
    runtime_client: RuntimeSidecarClient | None = None,
    web_dist: Path | None = None,
) -> FastAPI:
    settings = load_settings()
    store = SQLiteStore(settings.db_path)
    store.initialize()
    event_hub = EventHub()

    app = FastAPI(title="Change Control Center")
    app.state.store = store
    app.state.event_hub = event_hub
    app.state.runtime_client = runtime_client or _build_runtime_client()

    async def persist_runtime_events(tenant_id: str, run_id: str, events: list[dict[str, Any]]) -> None:
        existing_approvals = store.list_approvals(run_id)
        existing_request_ids = {approval["payload"].get("_requestId") for approval in existing_approvals}
        next_index = len(existing_approvals) + 1
        for event in events:
            store.append_run_event(run_id, event["type"], event["payload"])
            if event["type"].endswith("requestApproval"):
                request_id = event["payload"].get("_requestId")
                if request_id not in existing_request_ids:
                    approval = build_approval_record(tenant_id, run_id, event, next_index)
                    store.add_approval(approval)
                    existing_request_ids.add(request_id)
                    next_index += 1

    async def watch_run_until_complete(
        tenant_id: str,
        change_id: str,
        run_id: str,
        kind: str,
        memory_packet: dict[str, Any],
        cursor: int,
    ) -> None:
        current_cursor = cursor
        while True:
            snapshot = await app.state.runtime_client.poll_run(run_id, current_cursor)
            run = store.get_run(tenant_id, run_id)
            if not run:
                return

            run["status"] = snapshot.status
            run["transport"] = snapshot.transport
            run["threadId"] = snapshot.threadId or run.get("threadId")
            run["turnId"] = snapshot.turnId or run.get("turnId")

            events = [event.model_dump(mode="json") for event in snapshot.events]
            if events:
                await persist_runtime_events(tenant_id, run_id, events)
            store.update_run(run)
            current_cursor = snapshot.nextCursor

            await event_hub.broadcast(
                tenant_id,
                {
                    "type": "run-updated",
                    "changeId": change_id,
                    "runId": run_id,
                    "status": snapshot.status,
                },
            )

            if snapshot.status == "completed":
                change = store.get_change(tenant_id, change_id)
                if not change:
                    return
                existing_runs = [item for item in store.list_runs(tenant_id, change_id) if item["id"] != run_id]
                runtime_result = {
                    "status": snapshot.status,
                    "transport": snapshot.transport,
                    "threadId": run.get("threadId"),
                    "turnId": run.get("turnId"),
                    "prompt": run["prompt"],
                    "summary": "Runtime adapter completed startup handshake.",
                    "checks": ["thread lineage persisted"],
                    "worktree": change["git"]["worktree"] if change["git"]["worktree"] != "not created" else f"wt-{change_id.split('-')[1]}-a",
                }
                updated_run, evidence, updated_change = apply_run_transition(
                    change,
                    existing_runs,
                    runtime_result,
                    memory_packet,
                    kind,
                    run=run,
                )
                store.update_run(updated_run)
                for artifact in evidence:
                    store.add_evidence(artifact)
                store.save_change(updated_change)
                await event_hub.broadcast(
                    tenant_id,
                    {
                        "type": "run-completed",
                        "changeId": change_id,
                        "runId": run_id,
                        "state": updated_change["state"],
                    },
                )
                return

            if snapshot.status in {"failed", "interrupted"}:
                run["result"] = "failed"
                run["outcome"] = "Runtime adapter failed before completion."
                store.update_run(run)
                return

    artifact = inspect_web_artifact(web_dist)
    if artifact.ready:
        app.mount("/assets", StaticFiles(directory=artifact.assets_dir), name="assets")

    @app.get("/healthz/ui-artifact", include_in_schema=False)
    def ui_artifact_health() -> dict[str, str]:
        current_artifact = inspect_web_artifact(web_dist)
        if not current_artifact.ready:
            raise HTTPException(status_code=503, detail=current_artifact.detail)
        return current_artifact.as_dict()

    @app.get("/", include_in_schema=False)
    def serve_root() -> FileResponse:
        current_artifact = inspect_web_artifact(web_dist)
        if not current_artifact.ready:
            raise HTTPException(status_code=503, detail=current_artifact.detail)
        return FileResponse(current_artifact.index_html)

    @app.post("/api/tenants", status_code=201)
    def create_tenant_entry(request: TenantCreateRequest) -> dict[str, Any]:
        tenant = create_tenant(request.name, request.repoPath, request.description)
        try:
            store.add_tenant(tenant)
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        return {"tenant": tenant}

    @app.get("/api/bootstrap")
    def get_bootstrap() -> dict[str, Any]:
        tenants = store.list_tenants()
        active_tenant_id = tenants[0]["id"]
        changes = [_summarize_change(change) for change in store.list_changes(active_tenant_id)]
        return {
            "tenants": tenants,
            "repositoryCatalog": _build_repository_catalog(store),
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

    @app.post("/api/tenants/{tenant_id}/changes", status_code=201)
    async def create_change_entry(tenant_id: str, request: ChangeCreateRequest) -> dict[str, Any]:
        tenant = store.get_tenant(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        change = create_change(tenant_id, request.title)
        store.add_change(change)
        await event_hub.broadcast(tenant_id, {"type": "change-created", "changeId": change["id"]})
        return {"change": change}

    @app.delete("/api/tenants/{tenant_id}/changes/{change_id}")
    async def delete_change_entry(tenant_id: str, change_id: str) -> dict[str, Any]:
        tenant = store.get_tenant(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        store.delete_change(tenant_id, change_id)
        await event_hub.broadcast(tenant_id, {"type": "change-deleted", "changeId": change_id})
        return {"deletedChangeId": change_id}

    @app.get("/api/tenants/{tenant_id}/changes/{change_id}")
    def get_change_detail(tenant_id: str, change_id: str) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        clarification_rounds = store.list_clarification_rounds(tenant_id, change_id)
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

        clarification_rounds = store.list_clarification_rounds(tenant_id, change_id)
        focus_graph = build_focus_graph(change, clarification_rounds)
        tenant_memory = store.list_tenant_memory(tenant_id)
        memory_packet = curated_memory_packet(tenant_memory, change, focus_graph)
        existing_runs = store.list_runs(tenant_id, change_id)
        run = create_pending_run(change, existing_runs, request.kind, memory_packet)
        store.create_run(run)
        store.save_change(mark_change_run_started(change, request.kind))

        try:
            runtime_result = await app.state.runtime_client.start_run(
                run_id=run["id"],
                memory_packet=MemoryPacket(
                    tenantMemory=memory_packet["tenantMemory"],
                    changeContract=memory_packet["changeContract"],
                    changeMemory=memory_packet["changeMemory"],
                    focusGraph=memory_packet["focusGraph"],
                ),
                run_kind=request.kind,
                parent_thread_id=existing_runs[0]["threadId"] if existing_runs and request.kind in {"review", "finish"} else None,
            )
        except RuntimeError as exc:
            run["status"] = "failed"
            run["result"] = "failed"
            run["outcome"] = "Runtime sidecar rejected run start."
            run["decision"] = "Operator intervention required."
            store.update_run(run)
            change["state"] = "escalated"
            change["nextAction"] = "Investigate runtime failure"
            change["blocker"] = str(exc)
            change["summary"] = "Run was persisted, but runtime startup failed."
            store.save_change(change)
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        runtime_events = [event.model_dump(mode="json") for event in runtime_result.events]
        run["status"] = runtime_result.status
        run["transport"] = runtime_result.transport
        run["threadId"] = runtime_result.threadId
        run["turnId"] = runtime_result.turnId
        store.update_run(run)
        await persist_runtime_events(tenant_id, run["id"], runtime_events)

        if runtime_result.status == "completed":
            updated_change = store.get_change(tenant_id, change_id)
            if not updated_change:
                raise HTTPException(status_code=404, detail="Change not found")
            run, evidence, updated_change = apply_run_transition(
                updated_change,
                [item for item in existing_runs if item["id"] != run["id"]],
                {
                    "status": runtime_result.status,
                    "transport": runtime_result.transport,
                    "threadId": runtime_result.threadId,
                    "turnId": runtime_result.turnId,
                    "prompt": run["prompt"],
                    "summary": "Runtime adapter completed startup handshake.",
                    "checks": ["thread lineage persisted"],
                    "worktree": updated_change["git"]["worktree"]
                    if updated_change["git"]["worktree"] != "not created"
                    else f"wt-{change_id.split('-')[1]}-a",
                },
                memory_packet,
                request.kind,
                run=run,
            )
            store.update_run(run)
            for artifact in evidence:
                store.add_evidence(artifact)
            store.save_change(updated_change)
        else:
            asyncio.create_task(watch_run_until_complete(tenant_id, change_id, run["id"], request.kind, memory_packet, runtime_result.cursor))
            updated_change = store.get_change(tenant_id, change_id) or change

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

    @app.post("/api/tenants/{tenant_id}/changes/{change_id}/actions/escalate")
    async def escalate(tenant_id: str, change_id: str) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        updated_change = escalate_change(change)
        store.save_change(updated_change)
        await event_hub.broadcast(tenant_id, {"type": "change-escalated", "changeId": change_id})
        return {"change": updated_change}

    @app.post("/api/tenants/{tenant_id}/changes/{change_id}/actions/block-by-spec")
    async def block_by_spec(tenant_id: str, change_id: str) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        updated_change = block_change_by_spec(change)
        store.save_change(updated_change)
        await event_hub.broadcast(tenant_id, {"type": "change-blocked-by-spec", "changeId": change_id})
        return {"change": updated_change}

    @app.post("/api/tenants/{tenant_id}/changes/{change_id}/clarifications/auto", status_code=201)
    async def create_auto_clarification(tenant_id: str, change_id: str) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        existing_rounds = store.list_clarification_rounds(tenant_id, change_id)
        if any(round_data["status"] == "open" for round_data in existing_rounds):
            raise HTTPException(status_code=409, detail="An open clarification round already exists")
        clarification_round = create_auto_clarification_round(change)
        store.add_clarification_round(clarification_round)
        await event_hub.broadcast(tenant_id, {"type": "clarification-created", "changeId": change_id, "roundId": clarification_round["id"]})
        return {"round": clarification_round}

    @app.post("/api/tenants/{tenant_id}/clarifications/{round_id}/answers")
    async def answer_clarification(tenant_id: str, round_id: str, request: ClarificationAnswerRequest) -> dict[str, Any]:
        clarification_round = store.get_clarification_round(tenant_id, round_id)
        if not clarification_round:
            raise HTTPException(status_code=404, detail="Clarification round not found")
        answers = [answer.model_dump(exclude_none=True) for answer in request.answers]
        try:
            answered_round = answer_clarification_round(clarification_round, answers)
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        store.save_clarification_round(answered_round)
        change = store.get_change(tenant_id, answered_round["changeId"])
        if change:
            store.save_change(record_clarification_answers(change, answered_round))
        await event_hub.broadcast(
            tenant_id,
            {"type": "clarification-answered", "changeId": answered_round["changeId"], "roundId": answered_round["id"]},
        )
        return {"round": answered_round}

    @app.post("/api/tenants/{tenant_id}/approvals/{approval_id}/decision")
    async def decide_approval(tenant_id: str, approval_id: str, request: ApprovalDecisionRequest) -> dict[str, Any]:
        approval = store.get_approval(tenant_id, approval_id)
        if not approval:
            raise HTTPException(status_code=404, detail="Approval not found")
        if approval["status"] != "pending":
            raise HTTPException(status_code=409, detail="Approval was already resolved")
        request_id = approval["payload"].get("_requestId")
        if not isinstance(request_id, int):
            raise HTTPException(status_code=409, detail="Approval request cannot be mapped to runtime transport")
        updated_approval = apply_approval_decision(approval, request.decision)
        try:
            await app.state.runtime_client.respond_to_approval(updated_approval["runId"], request_id, request.decision)
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        store.save_approval(updated_approval)
        await event_hub.broadcast(
            tenant_id,
            {"type": "approval-decided", "approvalId": approval_id, "runId": updated_approval["runId"]},
        )
        return {"approval": updated_approval}

    @app.post("/api/tenants/{tenant_id}/changes/{change_id}/promotions", status_code=201)
    async def promote_fact(tenant_id: str, change_id: str, request: PromotionRequest) -> dict[str, Any]:
        change = store.get_change(tenant_id, change_id)
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        fact = create_tenant_fact(tenant_id, request.fact.model_dump())
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
