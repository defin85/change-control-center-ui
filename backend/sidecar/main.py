from __future__ import annotations

from fastapi import FastAPI, HTTPException

from backend.runtime_contracts import RunLaunchResult, SidecarRunRequest
from backend.sidecar.config import load_settings
from backend.sidecar.runner import AppServerConfig, CodexAppServerRunner


def _build_runner() -> tuple[CodexAppServerRunner, str]:
    settings = load_settings()
    runner = CodexAppServerRunner(
        AppServerConfig(
            transport=settings.transport,
            command=settings.command,
            ws_url=settings.ws_url,
        )
    )
    return runner, settings.transport


def create_app() -> FastAPI:
    runner, transport = _build_runner()
    app = FastAPI(title="Change Control Runtime Sidecar")

    @app.get("/healthz")
    def health() -> dict[str, str]:
        return {"status": "ok", "transport": transport}

    @app.post("/runs/start", response_model=RunLaunchResult)
    async def start_run(request: SidecarRunRequest) -> RunLaunchResult:
        try:
            return await runner.start_run(
                run_id=request.runId,
                memory_packet=request.memoryPacket,
                run_kind=request.runKind,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    return app
