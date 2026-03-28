from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from backend.runtime_contracts import ApprovalDecision, RunLaunchResult, RunPollResult, RuntimeEvent, SidecarRunRequest, Transport
from backend.sidecar.runner import CodexAppServerRunner


@dataclass(slots=True)
class PendingApproval:
    request_id: int
    future: asyncio.Future[ApprovalDecision]


@dataclass(slots=True)
class SidecarRunSession:
    run_id: str
    transport: Transport
    status: str = "starting"
    thread_id: str = ""
    turn_id: str = ""
    error: str | None = None
    events: list[RuntimeEvent] = field(default_factory=list)
    approvals: dict[int, PendingApproval] = field(default_factory=dict)
    started: asyncio.Event = field(default_factory=asyncio.Event)
    completed: asyncio.Event = field(default_factory=asyncio.Event)
    changed: asyncio.Event = field(default_factory=asyncio.Event)
    task: asyncio.Task[None] | None = None

    def append_event(self, event: RuntimeEvent) -> None:
        self.events.append(event)
        self.changed.set()

    def snapshot(self, cursor: int) -> RunPollResult:
        next_cursor = len(self.events)
        return RunPollResult(
            threadId=self.thread_id,
            turnId=self.turn_id,
            transport=self.transport,
            status=self.status,
            nextCursor=next_cursor,
            events=self.events[cursor:next_cursor],
        )


class SidecarRunSessionManager:
    def __init__(self, runner: CodexAppServerRunner, transport: Transport):
        self._runner = runner
        self._transport = transport
        self._sessions: dict[str, SidecarRunSession] = {}

    async def start(self, request: SidecarRunRequest) -> RunLaunchResult:
        if request.runId in self._sessions:
            session = self._sessions[request.runId]
            return RunLaunchResult(
                threadId=session.thread_id,
                turnId=session.turn_id,
                transport=session.transport,
                status=session.status,
                cursor=len(session.events),
                events=list(session.events),
            )

        session = SidecarRunSession(run_id=request.runId, transport=self._transport)
        self._sessions[request.runId] = session
        session.task = asyncio.create_task(self._run_session(session, request))

        while not session.started.is_set() and not session.completed.is_set():
            await asyncio.sleep(0.01)

        if session.error:
            raise RuntimeError(session.error)

        return RunLaunchResult(
            threadId=session.thread_id,
            turnId=session.turn_id,
            transport=session.transport,
            status=session.status,
            cursor=len(session.events),
            events=list(session.events),
        )

    async def poll(self, run_id: str, cursor: int) -> RunPollResult:
        session = self._sessions.get(run_id)
        if not session:
            raise KeyError(run_id)

        if cursor >= len(session.events) and not session.completed.is_set():
            try:
                await asyncio.wait_for(session.changed.wait(), timeout=0.5)
            except asyncio.TimeoutError:
                pass

        session.changed.clear()
        return session.snapshot(cursor)

    async def resolve_approval(self, run_id: str, request_id: int, decision: ApprovalDecision) -> None:
        session = self._sessions.get(run_id)
        if not session:
            raise KeyError(run_id)

        pending = session.approvals.get(request_id)
        if not pending:
            raise ValueError(f"Approval request {request_id} is not pending for run {run_id}")
        if pending.future.done():
            raise ValueError(f"Approval request {request_id} was already resolved")
        pending.future.set_result(decision)
        session.changed.set()

    async def _run_session(self, session: SidecarRunSession, request: SidecarRunRequest) -> None:
        async def on_started(thread_id: str, turn_id: str) -> None:
            session.thread_id = thread_id
            session.turn_id = turn_id
            session.status = "inProgress"
            session.started.set()
            session.changed.set()

        async def on_event(event: RuntimeEvent) -> None:
            session.append_event(event)

        async def on_approval_request(request_id: int, event: RuntimeEvent) -> ApprovalDecision:
            future: asyncio.Future[ApprovalDecision] = asyncio.get_running_loop().create_future()
            session.approvals[request_id] = PendingApproval(request_id=request_id, future=future)
            return await future

        try:
            final_status = await self._runner.run_session(
                memory_packet=request.memoryPacket,
                run_id=request.runId,
                run_kind=request.runKind,
                parent_thread_id=request.parentThreadId,
                on_started=on_started,
                on_event=on_event,
                on_approval_request=on_approval_request,
            )
            session.status = final_status
        except Exception as exc:
            session.status = "failed"
            session.error = str(exc)
            if not session.started.is_set():
                session.started.set()
        finally:
            session.completed.set()
            session.changed.set()
