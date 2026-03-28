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


def _next_run_id(change: dict[str, Any], existing_runs: list[dict[str, Any]]) -> str:
    numeric_ids = [
        int(run["id"].split("-")[1])
        for run in existing_runs
        if run["id"].startswith("run-") and run["id"].split("-")[1].isdigit()
    ]
    next_value = max(numeric_ids or [40]) + 1
    return f"run-{next_value}"


def _base_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
    kind: str,
) -> dict[str, Any]:
    return {
        "id": _next_run_id(change, existing_runs),
        "changeId": change["id"],
        "tenantId": change["tenantId"],
        "kind": kind,
        "status": runtime_result["status"],
        "transport": runtime_result["transport"],
        "threadId": runtime_result.get("threadId"),
        "turnId": runtime_result.get("turnId"),
        "worktree": change["git"]["worktree"],
        "result": "pending",
        "duration": runtime_result.get("duration", "n/a"),
        "outcome": runtime_result.get("summary", "Run started"),
        "prompt": runtime_result["prompt"],
        "checks": runtime_result.get("checks", []),
        "decision": "Chief will inspect the run outcome.",
        "memoryPacket": memory_packet,
    }


def create_apply_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    run = _base_run(change, existing_runs, runtime_result, memory_packet, "apply")
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
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    run = _base_run(change, existing_runs, runtime_result, memory_packet, "design")
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
    touch_change(change)
    prepend_timeline(change, f"Design {run['id']}", "Architect skill executed against current change memory.")
    add_chief_event(change, "Planning run executed", f"Thread {run.get('threadId') or 'pending'} used curated memory.")
    return run, [artifact], change


def create_review_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    run = _base_run(change, existing_runs, runtime_result, memory_packet, "review")
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
    }.get(change["state"], "design")


def create_targeted_fix_run(
    change: dict[str, Any],
    existing_runs: list[dict[str, Any]],
    runtime_result: dict[str, Any],
    memory_packet: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    run = _base_run(change, existing_runs, runtime_result, memory_packet, "finish")
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
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    if kind == "apply":
        return create_apply_run(change, existing_runs, runtime_result, memory_packet)
    if kind == "review":
        return create_review_run(change, existing_runs, runtime_result, memory_packet)
    if kind == "finish":
        return create_targeted_fix_run(change, existing_runs, runtime_result, memory_packet)
    return create_design_run(change, existing_runs, runtime_result, memory_packet)


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
    round_data["answers"] = answers
    round_data["status"] = "answered"
    round_data["updatedAt"] = iso_now()
    return round_data


def create_tenant_fact(tenant_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": f"fact-{uuid.uuid4().hex[:8]}",
        "tenantId": tenant_id,
        "title": payload["title"],
        "body": payload["body"],
        "status": "approved",
    }


def normalize_approvals(tenant_id: str, run_id: str, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    approvals: list[dict[str, Any]] = []
    for index, event in enumerate(events, start=1):
        if not event["type"].endswith("requestApproval"):
            continue
        payload = event["payload"]
        approvals.append(
            {
                "id": f"apr-{run_id}-{index}",
                "runId": run_id,
                "tenantId": tenant_id,
                "status": "pending",
                "kind": event["type"],
                "reason": payload.get("reason", ""),
                "payload": payload,
            }
        )
    return approvals
