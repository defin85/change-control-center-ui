from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query, Response, status

from backend.runtime_contracts import ApprovalDecisionRequest, RunLaunchResult, RunPollResult, SidecarRunRequest
from backend.sidecar.config import load_settings
from backend.sidecar.runner import AppServerConfig, CodexAppServerRunner
from backend.sidecar.session_manager import SidecarRunSessionManager


def _build_runtime() -> tuple[SidecarRunSessionManager, str, bool]:
    settings = load_settings()
    runner = CodexAppServerRunner(
        AppServerConfig(
            transport=settings.transport,
            command=settings.command,
            ws_url=settings.ws_url,
        )
    )
    ready = True
    if settings.transport == "stdio" and not settings.command:
        ready = False
    if settings.transport == "websocket" and not settings.ws_url:
        ready = False
    return SidecarRunSessionManager(runner, settings.transport), settings.transport, ready


def create_app() -> FastAPI:
    session_manager, transport, ready = _build_runtime()
    app = FastAPI(title="Change Control Runtime Sidecar")

    @app.get("/healthz")
    def health(response: Response) -> dict[str, str]:
        if not ready:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {"status": "misconfigured", "transport": transport}
        return {"status": "ok", "transport": transport}

    @app.post("/runs/start", response_model=RunLaunchResult)
    async def start_run(request: SidecarRunRequest) -> RunLaunchResult:
        if not ready:
            raise HTTPException(status_code=400, detail=f"{transport} transport is not fully configured")
        try:
            return await session_manager.start(request)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    @app.get("/runs/{run_id}", response_model=RunPollResult)
    async def poll_run(run_id: str, cursor: int = Query(default=0, ge=0)) -> RunPollResult:
        try:
            return await session_manager.poll(run_id, cursor)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail="Run not found") from exc

    @app.post("/runs/{run_id}/approvals/{request_id}/decision", status_code=200)
    async def resolve_approval(run_id: str, request_id: int, request: ApprovalDecisionRequest) -> dict[str, str]:
        try:
            await session_manager.resolve_approval(run_id, request_id, request.decision)
            return {"status": "accepted"}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail="Run not found") from exc
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc

    return app
