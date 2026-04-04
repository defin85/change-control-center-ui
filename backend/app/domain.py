from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any


def iso_now() -> str:
    return datetime.now(tz=UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def count_open_mandatory_gaps(change: dict[str, Any]) -> int:
    return sum(1 for gap in change["gaps"] if gap["mandatory"] and gap["status"] in {"open", "in_fix"})


def has_recurring_critical_gap(change: dict[str, Any]) -> bool:
    return any(
        gap["mandatory"] and gap["severity"] == "high" and gap["recurrence"] >= 2 and gap["status"] == "open"
        for gap in change["gaps"]
    )


def touch_change(change: dict[str, Any]) -> None:
    change["updatedAt"] = iso_now()


def prepend_timeline(change: dict[str, Any], title: str, note: str) -> None:
    change["timeline"].insert(0, {"title": title, "note": note})


def add_chief_event(change: dict[str, Any], title: str, note: str) -> None:
    change["chiefHistory"].insert(0, {"at": datetime.now(tz=UTC).strftime("%H:%M"), "title": title, "note": note})


def build_focus_graph(change: dict[str, Any], clarification_rounds: list[dict[str, Any]]) -> dict[str, Any]:
    items: list[dict[str, Any]] = []

    for title in change["memory"].get("activeFocus", []):
        items.append(
            {
                "id": f"focus-{len(items) + 1}",
                "kind": "memory",
                "title": title,
                "status": "active",
            }
        )

    for gap in change["gaps"]:
        if gap["status"] in {"open", "in_fix"}:
            items.append(
                {
                    "id": f"gap-{gap['id']}",
                    "kind": "gap",
                    "title": gap["summary"],
                    "status": gap["status"],
                }
            )

    for clarification_round in clarification_rounds:
        items.append(
            {
                "id": f"clarification-{clarification_round['id']}",
                "kind": "clarification",
                "title": clarification_round["rationale"],
                "status": clarification_round["status"],
            }
        )

    return {"items": items}


def curated_memory_packet(
    tenant_facts: list[dict[str, Any]],
    change: dict[str, Any],
    focus_graph: dict[str, Any],
) -> dict[str, Any]:
    return {
        "tenantMemory": {"facts": tenant_facts},
        "changeContract": change["contract"],
        "changeMemory": change["memory"],
        "focusGraph": focus_graph,
    }


def build_repository_catalog_entry(tenant: dict[str, Any], changes: list[dict[str, Any]]) -> dict[str, Any]:
    change_count = len(changes)
    blocked_change_count = sum(1 for change in changes if change["state"] in {"blocked_by_spec", "escalated"})
    ready_change_count = sum(1 for change in changes if change["state"] in {"approved", "ready_for_acceptance"})
    done_change_count = sum(1 for change in changes if change["state"] == "done")
    active_change_count = change_count - blocked_change_count - ready_change_count - done_change_count
    featured_change = _pick_repository_catalog_focus_change(changes)
    latest_activity_change = _pick_repository_catalog_latest_activity_change(changes)

    return {
        "tenantId": tenant["id"],
        "name": tenant["name"],
        "repoPath": tenant["repoPath"],
        "description": tenant.get("description", ""),
        "changeCount": change_count,
        "blockedChangeCount": blocked_change_count,
        "readyChangeCount": ready_change_count,
        "activeChangeCount": active_change_count,
        "attentionState": _repository_attention_state(change_count, blocked_change_count, ready_change_count, active_change_count),
        "lastActivity": latest_activity_change["lastRunAgo"] if latest_activity_change else "No activity yet",
        "nextRecommendedAction": _repository_next_action(
            change_count,
            blocked_change_count,
            ready_change_count,
            active_change_count,
        ),
        "featuredChange": (
            {
                "id": featured_change["id"],
                "title": featured_change["title"],
                "state": featured_change["state"],
                "nextAction": featured_change["nextAction"],
            }
            if featured_change
            else None
        ),
    }


def _repository_attention_state(
    change_count: int,
    blocked_change_count: int,
    ready_change_count: int,
    active_change_count: int,
) -> str:
    if change_count == 0:
        return "needs_setup"
    if blocked_change_count > 0:
        return "blocked"
    if ready_change_count > 0 or active_change_count > 0:
        return "active"
    return "quiet"


def _repository_next_action(
    change_count: int,
    blocked_change_count: int,
    ready_change_count: int,
    active_change_count: int,
) -> str:
    if change_count == 0:
        return "Create first change"
    if blocked_change_count > 0:
        return "Review blocked work"
    if ready_change_count > 0:
        return "Open ready queue"
    if active_change_count > 0:
        return "Review active work"
    return "Open queue"


def _pick_repository_catalog_focus_change(changes: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not changes:
        return None

    return max(
        changes,
        key=lambda change: (_repository_focus_priority(change["state"]), change.get("updatedAt", "")),
    )


def _pick_repository_catalog_latest_activity_change(changes: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not changes:
        return None

    return max(changes, key=lambda change: change.get("updatedAt", ""))


def _repository_focus_priority(state: str) -> int:
    if state in {"blocked_by_spec", "escalated"}:
        return 4
    if state in {"review_pending", "gap_fixing", "draft", "executing"}:
        return 3
    if state in {"approved", "ready_for_acceptance"}:
        return 2
    if state == "done":
        return 0
    return 1


def _next_run_id(change: dict[str, Any], existing_runs: list[dict[str, Any]]) -> str:
    del change, existing_runs
    return f"run-{uuid.uuid4().int % 10_000_000_000}"


def _base_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
    kind: str,
    run: dict[str, Any] | None = None,
) -> dict[str, Any]:
    run_record = run or {
        "id": _next_run_id(change, existing_runs),
        "changeId": change["id"],
        "tenantId": change["tenantId"],
        "kind": kind,
        "memoryPacket": memory_packet,
    }
    run_record.update(
        {
            "kind": kind,
            "status": runtime_result["status"],
            "transport": runtime_result["transport"],
            "threadId": runtime_result.get("threadId"),
            "turnId": runtime_result.get("turnId"),
            "worktree": change["git"]["worktree"],
            "result": run_record.get("result", "pending"),
            "duration": runtime_result.get("duration", "n/a"),
            "outcome": runtime_result.get("summary", "Run started"),
            "prompt": runtime_result["prompt"],
            "checks": runtime_result.get("checks", []),
            "decision": run_record.get("decision", "Chief will inspect the run outcome."),
            "memoryPacket": memory_packet,
        }
    )
    return run_record


def create_pending_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    kind: str,
    memory_packet: dict[str, Any],
) -> dict[str, Any]:
    return {
        "id": _next_run_id(change, existing_runs),
        "changeId": change["id"],
        "tenantId": change["tenantId"],
        "kind": kind,
        "status": "queued",
        "transport": "pending",
        "threadId": None,
        "turnId": None,
        "worktree": change["git"]["worktree"],
        "result": "pending",
        "duration": "n/a",
        "outcome": "Waiting for runtime adapter to start the run.",
        "prompt": f"/{kind} {change['id']}",
        "checks": [],
        "decision": "Chief will inspect the run outcome.",
        "memoryPacket": memory_packet,
    }


def mark_change_run_started(change: dict[str, Any], kind: str) -> dict[str, Any]:
    change["lastRunAgo"] = "just now"
    change["summary"] = "A backend-owned run is currently executing."
    change["nextAction"] = "Run in progress"
    change["blocker"] = "Waiting for runtime completion"
    if kind != "design":
        change["state"] = "executing"
    touch_change(change)
    prepend_timeline(change, f"{kind.title()} queued", "Chief recorded the run before runtime execution started.")
    add_chief_event(change, "Run queued", f"{kind} run was persisted before runtime execution started.")
    return change


def create_apply_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
    run: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    run = _base_run(change, existing_runs, runtime_result, memory_packet, "apply", run=run)
    run["result"] = "done" if runtime_result["status"] == "completed" else "failed"
    run["outcome"] = "initial implementation pass complete" if run["result"] == "done" else "apply run failed"
    run["decision"] = "Chief scheduled review next." if run["result"] == "done" else "Chief requires intervention."

    artifact = {
        "id": f"a-{run['id'].split('-')[1]}1",
        "changeId": change["id"],
        "runId": run["id"],
        "kind": "diff summary",
        "title": f"{change['id']}: apply pass",
        "body": "Chief launched the first apply run through the backend-owned runtime adapter.",
    }

    change["state"] = "executing" if run["result"] == "done" else "escalated"
    change["lastRunAgo"] = "just now"
    change["nextAction"] = "Run review" if run["result"] == "done" else "Investigate runtime failure"
    change["blocker"] = "Waiting for first acceptance review" if run["result"] == "done" else "Runtime adapter failed"
    change["summary"] = "Implementation pass finished through the real app stack." if run["result"] == "done" else "Run failed before execution completed."
    change["verificationStatus"] = "awaiting review" if run["result"] == "done" else "failed"
    change["git"]["worktree"] = runtime_result.get("worktree", f"wt-{change['id'].split('-')[1]}-a")
    change["git"]["branch"] = f"{change['id']}/apply"
    change["git"]["changedFiles"] = max(change["git"]["changedFiles"], 3)
    change["git"]["commitStatus"] = "worktree only"
    touch_change(change)
    prepend_timeline(change, f"Apply {run['id']}", "Chief started the first implementation pass.")
    add_chief_event(change, "Chief launched apply run", f"Thread {run.get('threadId') or 'pending'} created.")
    return run, [artifact], change


def create_design_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
    run: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    run = _base_run(change, existing_runs, runtime_result, memory_packet, "design", run=run)
    run["result"] = "done" if runtime_result["status"] == "completed" else "failed"
    run["outcome"] = "design refinement complete" if run["result"] == "done" else "design run failed"
    run["decision"] = "Chief can continue planning on the same change thread."

    artifact = {
        "id": f"a-{run['id'].split('-')[1]}1",
        "changeId": change["id"],
        "runId": run["id"],
        "kind": "design note",
        "title": f"{change['id']}: planning turn",
        "body": "Planning run executed against curated change memory.",
    }

    change["lastRunAgo"] = "just now"
    change["summary"] = "Planning run executed with curated memory packet."
    if not change["memory"].get("openQuestions"):
        change["state"] = "ready_to_propose"
        change["nextAction"] = "Create proposal"
        change["blocker"] = "No blocker"
    touch_change(change)
    prepend_timeline(change, f"Design {run['id']}", "Architect skill executed against current change memory.")
    add_chief_event(change, "Planning run executed", f"Thread {run.get('threadId') or 'pending'} used curated memory.")
    return run, [artifact], change


def create_review_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
    run: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    run = _base_run(change, existing_runs, runtime_result, memory_packet, "review", run=run)
    run["result"] = "partial"
    run["outcome"] = "review findings collected"
    run["decision"] = "Chief will decide whether to fix, accept, or escalate."

    artifact = {
        "id": f"a-{run['id'].split('-')[1]}1",
        "changeId": change["id"],
        "runId": run["id"],
        "kind": "review report",
        "title": f"{change['id']}: full review",
        "body": "Full review executed through runtime adapter; findings were normalized into backend state.",
    }

    if not change["gaps"]:
        change["gaps"].append(
            {
                "id": "g-201",
                "severity": "medium",
                "mandatory": True,
                "reqRef": "R-12",
                "status": "open",
                "recurrence": 1,
                "fingerprint": "fp_review_201",
                "summary": "Traceability evidence remains partial after review.",
                "firstSeen": run["id"],
                "lastSeen": run["id"],
                "introducedByRun": run["id"],
                "evidence": "Review requested stronger proof on the default path.",
            }
        )

    change["state"] = "review_pending"
    change["lastRunAgo"] = "just now"
    change["nextAction"] = "Create targeted fix run"
    change["blocker"] = "Mandatory findings need targeted closure"
    change["summary"] = "Chief has structured review findings backed by runtime lineage."
    change["verificationStatus"] = "partial"
    change["loopCount"] += 1
    touch_change(change)
    prepend_timeline(change, f"Review {run['id']}", "Chief recorded structured review findings.")
    add_chief_event(change, "Review findings recorded", f"Run {run['id']} populated backend-owned findings.")
    return run, [artifact], change


def infer_run_kind(change: dict[str, Any]) -> str:
    return {
        "approved": "apply",
        "executing": "review",
        "review_pending": "finish",
        "gap_fixing": "review",
        "draft": "design",
        "ready_to_propose": "design",
    }.get(change["state"], "design")


def create_targeted_fix_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
    run: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    run = _base_run(change, existing_runs, runtime_result, memory_packet, "finish", run=run)
    run["result"] = "done" if runtime_result["status"] == "completed" else "failed"
    run["outcome"] = "targeted fix pass complete" if run["result"] == "done" else "targeted fix failed"
    run["decision"] = "Chief will re-run review on the remaining surface."

    artifact = {
        "id": f"a-{run['id'].split('-')[1]}1",
        "changeId": change["id"],
        "runId": run["id"],
        "kind": "diff summary",
        "title": f"{change['id']}: targeted fix",
        "body": "Targeted fix run closed the highest-priority focus items.",
    }

    for gap in change["gaps"]:
        if gap["mandatory"] and gap["status"] in {"open", "in_fix"}:
            gap["status"] = "closed"
            gap["lastSeen"] = run["id"]
            break

    change["state"] = "gap_fixing"
    change["lastRunAgo"] = "just now"
    change["nextAction"] = "Re-review targeted gaps"
    change["blocker"] = "Awaiting re-review"
    change["summary"] = "Chief ran a targeted fix pass through the backend stack."
    change["verificationStatus"] = "awaiting re-review"
    touch_change(change)
    prepend_timeline(change, f"Finish {run['id']}", "Targeted fix pass completed.")
    add_chief_event(change, "Targeted fix run created", f"Run {run['id']} focused on the remaining mandatory gap.")
    return run, [artifact], change


def apply_run_transition(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
    kind: str,
    run: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    if kind == "apply":
        return create_apply_run(change, existing_runs, runtime_result, memory_packet, run=run)
    if kind == "review":
        return create_review_run(change, existing_runs, runtime_result, memory_packet, run=run)
    if kind == "finish":
        return create_targeted_fix_run(change, existing_runs, runtime_result, memory_packet, run=run)
    return create_design_run(change, existing_runs, runtime_result, memory_packet, run=run)


def create_auto_clarification_round(change: dict[str, Any]) -> dict[str, Any]:
    questions = []
    for index, prompt in enumerate(change["memory"].get("openQuestions", [])[:3], start=1):
        if "deploy" in prompt.lower() or "adapter" in prompt.lower():
            options = [
                {"id": "sidecar", "label": "Separate sidecar", "description": "Keeps protocol churn isolated."},
                {"id": "embedded", "label": "Embedded service", "description": "Simpler first deployment."},
            ]
        elif "approval" in prompt.lower():
            options = [
                {"id": "strict", "label": "Always prompt", "description": "Operator sees every sensitive decision."},
                {"id": "policy", "label": "Policy-based", "description": "Safe approvals auto-resolve."},
            ]
        else:
            options = [
                {"id": "yes", "label": "Yes", "description": "Accept the suggested direction."},
                {"id": "no", "label": "No", "description": "Reject and provide a correction."},
            ]

        questions.append(
            {
                "id": f"q-{index}",
                "label": prompt,
                "options": options,
                "allowOther": True,
            }
        )

    return {
        "id": f"clar-{uuid.uuid4().hex[:8]}",
        "tenantId": change["tenantId"],
        "changeId": change["id"],
        "status": "open",
        "rationale": "Planning is blocked on unresolved architecture ambiguity.",
        "questions": questions or [
            {
                "id": "q-1",
                "label": "Choose the preferred runtime adapter deployment topology.",
                "options": [
                    {"id": "sidecar", "label": "Separate sidecar", "description": "Keeps app-server churn isolated."},
                    {"id": "embedded", "label": "Embedded service", "description": "Minimizes early deployment complexity."},
                ],
                "allowOther": True,
            }
        ],
        "answers": [],
        "createdAt": iso_now(),
        "updatedAt": iso_now(),
    }


def answer_clarification_round(round_data: dict[str, Any], answers: list[dict[str, Any]]) -> dict[str, Any]:
    if round_data["status"] != "open":
        raise ValueError("Clarification round is already historical")
    round_data["answers"] = answers
    round_data["status"] = "answered"
    round_data["updatedAt"] = iso_now()
    return round_data


def record_clarification_answers(change: dict[str, Any], round_data: dict[str, Any]) -> dict[str, Any]:
    questions = {question["id"]: question for question in round_data["questions"]}
    clarifications = change["memory"].setdefault("clarifications", [])
    for answer in round_data["answers"]:
        question = questions[answer["questionId"]]
        clarifications.append(
            {
                "questionId": answer["questionId"],
                "question": question["label"],
                "selectedOptionId": answer["selectedOptionId"],
                "freeformNote": answer.get("freeformNote"),
            }
        )
        if question["label"] in change["memory"].get("openQuestions", []):
            change["memory"]["openQuestions"].remove(question["label"])
        decision_note = f"{question['label']} -> {answer['selectedOptionId']}"
        if answer.get("freeformNote"):
            decision_note = f"{decision_note} ({answer['freeformNote']})"
        change["memory"]["decisions"].append(decision_note)

    if not change["memory"].get("openQuestions"):
        change["state"] = "ready_to_propose"
        change["nextAction"] = "Create proposal"
        change["blocker"] = "No blocker"
        change["summary"] = "Clarifications are resolved and the change is ready for proposal."
    touch_change(change)
    prepend_timeline(change, "Clarifications answered", "Structured planning answers were written into change memory.")
    add_chief_event(change, "Clarifications stored", "Planning can resume on the same change thread.")
    return change


def create_tenant_fact(tenant_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": f"fact-{uuid.uuid4().hex[:8]}",
        "tenantId": tenant_id,
        "title": payload["title"],
        "body": payload["body"],
        "status": "approved",
    }


def create_tenant(name: str, repo_path: str, description: str | None = None) -> dict[str, Any]:
    return {
        "id": f"tenant-{uuid.uuid4().hex[:8]}",
        "name": name,
        "repoPath": repo_path,
        "description": description or "",
    }


def build_approval_record(tenant_id: str, run_id: str, event: dict[str, Any], index: int) -> dict[str, Any]:
    payload = event["payload"]
    return {
        "id": f"apr-{run_id}-{index}",
        "runId": run_id,
        "tenantId": tenant_id,
        "status": "pending",
        "kind": event["type"],
        "reason": payload.get("reason", ""),
        "payload": payload,
    }


def normalize_approvals(tenant_id: str, run_id: str, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        build_approval_record(tenant_id, run_id, event, index)
        for index, event in enumerate(events, start=1)
        if event["type"].endswith("requestApproval")
    ]


def apply_approval_decision(approval: dict[str, Any], decision: str) -> dict[str, Any]:
    approval["status"] = "accepted" if decision in {"accept", "acceptForSession"} else "declined"
    approval["decision"] = decision
    return approval


def create_change(tenant_id: str, title: str | None = None) -> dict[str, Any]:
    suffix = uuid.uuid4().hex[:4]
    human_title = title or "New change"
    return {
        "id": f"ch-{suffix}",
        "tenantId": tenant_id,
        "title": human_title,
        "subtitle": "Draft change created from the new product shell",
        "state": "draft",
        "owner": "chief",
        "createdAt": iso_now(),
        "updatedAt": iso_now(),
        "lastRunAgo": "not started",
        "blocker": "Clarify goals and scope",
        "nextAction": "Design change",
        "requirementsLinked": 0,
        "requirementsTotal": 0,
        "loopCount": 0,
        "specStatus": "draft",
        "verificationStatus": "not started",
        "summary": "Draft change created in the backend-owned shell.",
        "policy": {
            "maxAutoCycles": 3,
            "escalationRule": "fingerprint repeated twice",
            "acceptanceGate": "Req -> Code -> Test",
        },
        "chiefHistory": [],
        "traceability": [],
        "gaps": [],
        "git": {
            "worktree": "not created",
            "branch": "not created",
            "changedFiles": 0,
            "commitStatus": "not started",
            "prStatus": "no PR",
            "mergeReadiness": "not ready",
        },
        "timeline": [{"title": "Draft created", "note": "New change started from the operator shell."}],
        "contract": {
            "goal": human_title,
            "scope": [],
            "acceptanceCriteria": [],
            "constraints": [],
        },
        "memory": {
            "summary": "Draft change awaiting clarification.",
            "openQuestions": ["What problem should this change solve?"],
            "decisions": [],
            "facts": [],
            "activeFocus": ["Clarify goal"],
            "clarifications": [],
        },
    }


def escalate_change(change: dict[str, Any]) -> dict[str, Any]:
    change["state"] = "escalated"
    change["nextAction"] = "Operator intervention required"
    change["blocker"] = "Escalated by chief"
    change["summary"] = "Chief escalated the change for operator review."
    touch_change(change)
    prepend_timeline(change, "Escalated", "Chief escalated the change for human intervention.")
    add_chief_event(change, "Escalated", "Operator review is required.")
    return change


def block_change_by_spec(change: dict[str, Any]) -> dict[str, Any]:
    change["state"] = "blocked_by_spec"
    change["nextAction"] = "Clarify specification"
    change["blocker"] = "Blocked by specification ambiguity"
    change["summary"] = "Chief blocked the change until the specification is clarified."
    touch_change(change)
    prepend_timeline(change, "Blocked by spec", "Specification ambiguity blocks further runtime execution.")
    add_chief_event(change, "Blocked by spec", "Specification clarification is required.")
    return change
