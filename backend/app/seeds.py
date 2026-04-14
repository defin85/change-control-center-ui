from __future__ import annotations

from copy import deepcopy


SEED_FIXTURES = {
    "tenants": [
        {
            "id": "tenant-demo",
            "name": "change-control-center-ui",
            "repoPath": "/home/egor/code/change-control-center-ui",
            "description": "Primary tenant for the application foundation migration.",
            "defaultOwner": {"id": "codex-chief", "label": "Codex Chief"},
        },
        {
            "id": "tenant-sandbox",
            "name": "sandbox-repo",
            "repoPath": "/home/egor/code/sandbox-repo",
            "description": "Secondary tenant used to validate repository-scoped isolation.",
            "defaultOwner": {"id": "sandbox-chief", "label": "Sandbox Chief"},
        },
    ],
    "tenantMemory": [
        {
            "id": "fact-001",
            "tenantId": "tenant-demo",
            "title": "Operator IA is stable",
            "body": "Control Queue, Change Detail, Runs, and Chief must remain first-class surfaces.",
            "status": "approved",
        }
    ],
    "changes": [
        {
            "id": "ch-142",
            "tenantId": "tenant-demo",
            "title": "Land the canonical operator shell",
            "subtitle": "Queue, detail, and runs now live on the served operator workspace",
            "state": "review_pending",
            "owner": {"id": "codex-chief", "label": "Codex Chief"},
            "createdAt": "2026-03-27T10:00:00Z",
            "updatedAt": "2026-03-28T15:49:00Z",
            "lastRunAgo": "14m ago",
            "blocker": "Launcher false-ready lifecycle masks local runtime health",
            "nextAction": "Harden launcher health checks and rerun local proof",
            "requirementsLinked": 9,
            "requirementsTotal": 16,
            "loopCount": 2,
            "specStatus": "approved",
            "verificationStatus": "partial",
            "summary": "The canonical operator shell is live, but launcher lifecycle proof still drifts under local dev restarts.",
            "policy": {
                "maxAutoCycles": 3,
                "escalationRule": "fingerprint repeated twice",
                "acceptanceGate": "Req -> Code -> Test",
            },
            "chiefHistory": [
                {
                    "at": "15:49",
                    "title": "Chief routed change into compact review",
                    "note": "Canonical shell landed, but launcher false-ready remained open after the last review run.",
                }
            ],
            "traceability": [
                {
                    "req": "R-12",
                    "code": "backend/app/main.py",
                    "tests": "backend/tests/test_api.py",
                    "evidence": "run-30",
                    "status": "partial",
                },
                {
                    "req": "R-14",
                    "code": "scripts/lib/ccc/process.sh",
                    "tests": "scripts launcher verification",
                    "evidence": "gap g-91",
                    "status": "gap open",
                },
            ],
            "gaps": [
                {
                    "id": "g-91",
                    "severity": "high",
                    "mandatory": True,
                    "reqRef": "R-14",
                    "status": "open",
                    "recurrence": 2,
                    "fingerprint": "fp_8d21",
                    "summary": "Launcher dev profile can report ready while managed processes are already stopped.",
                    "firstSeen": "run-28",
                    "lastSeen": "run-30",
                    "introducedByRun": "run-28",
                    "evidence": "scripts/ccc start dev reported ready, but status immediately returned stopped and no listeners survived startup.",
                }
            ],
            "git": {
                "worktree": "wt-142-c",
                "branch": "ch-142/review-loop",
                "changedFiles": 4,
                "commitStatus": "not committed",
                "prStatus": "no PR",
                "mergeReadiness": "not ready",
            },
            "timeline": [
                {"title": "Go! approved", "note": "OpenSpec change approved for implementation."},
                {"title": "Review run-30", "note": "Recurring runtime mismatch still open."},
            ],
            "contract": {
                "goal": "Replace the static prototype with a real application foundation.",
                "scope": [
                    "Operator UI shell",
                    "Backend-owned state",
                    "Codex runtime adapter",
                    "Clarification loop",
                ],
                "acceptanceCriteria": [
                    "UI starts against a real backend entrypoint",
                    "Tenant-scoped change state is persistent",
                    "Runs persist thread lineage and runtime events",
                ],
                "constraints": [
                    "UI never talks to Codex transport directly",
                    "Change remains the primary task thread",
                ],
            },
            "memory": {
                "summary": "Work is centered on preserving IA while replacing runtime and persistence foundations.",
                "openQuestions": [
                    "Should runtime adapter deploy as a sidecar or embedded unit?",
                    "Which approvals can be auto-resolved by policy?",
                ],
                "decisions": [
                    "Backend is the source of truth",
                    "UI reads normalized state only",
                ],
                "facts": [],
                "activeFocus": [
                    "Stabilize launcher lifecycle proofs",
                    "Persist runtime lineage and approvals",
                ],
            },
        },
        {
            "id": "ch-146",
            "tenantId": "tenant-demo",
            "title": "Bootstrap real app stack",
            "subtitle": "Happy-path migration from approved spec to first apply run",
            "state": "approved",
            "owner": {"id": "codex-chief", "label": "Codex Chief"},
            "createdAt": "2026-03-28T10:00:00Z",
            "updatedAt": "2026-03-28T10:00:00Z",
            "lastRunAgo": "not started",
            "blocker": "No blocker",
            "nextAction": "Run next step",
            "requirementsLinked": 0,
            "requirementsTotal": 16,
            "loopCount": 0,
            "specStatus": "approved",
            "verificationStatus": "not started",
            "summary": "Ready to enter the first real apply run against the new application skeleton.",
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
            "timeline": [],
            "contract": {
                "goal": "Start the first real apply run through the new stack.",
                "scope": ["Backend skeleton", "Frontend shell", "Runtime adapter"],
                "acceptanceCriteria": [
                    "Run receives curated memory packet",
                    "Thread lineage is persisted",
                ],
                "constraints": ["Keep UI backend-owned"],
            },
            "memory": {
                "summary": "Waiting for first apply run.",
                "openQuestions": [],
                "decisions": [],
                "facts": [],
                "activeFocus": ["Start apply run"],
            },
        },
        {
            "id": "ch-150",
            "tenantId": "tenant-demo",
            "title": "Design tenant memory and clarification loop",
            "subtitle": "Planning-only change that exercises clarification rounds",
            "state": "draft",
            "owner": {"id": "codex-architect", "label": "Codex Architect"},
            "createdAt": "2026-03-28T12:00:00Z",
            "updatedAt": "2026-03-28T12:00:00Z",
            "lastRunAgo": "planning",
            "blocker": "Need clarification",
            "nextAction": "Clarify design",
            "requirementsLinked": 2,
            "requirementsTotal": 16,
            "loopCount": 0,
            "specStatus": "designing",
            "verificationStatus": "n/a",
            "summary": "Planning is blocked on a few architecture choices and requires operator answers.",
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
                "branch": "planning-only",
                "changedFiles": 0,
                "commitStatus": "n/a",
                "prStatus": "n/a",
                "mergeReadiness": "not ready",
            },
            "timeline": [{"title": "Draft created", "note": "Waiting for structured clarification."}],
            "contract": {
                "goal": "Define durable memory model and clarification workflow for future runs.",
                "scope": ["Tenant memory", "Change contract", "Clarification loop"],
                "acceptanceCriteria": [
                    "Clarification rounds persist across sessions",
                    "Promoted facts enter tenant memory",
                ],
                "constraints": [
                    "Do not mix contract and mutable working context",
                    "Keep clarification rounds small",
                ],
            },
            "memory": {
                "summary": "Need to pin runtime adapter topology and approval policy before finalizing design.",
                "openQuestions": [
                    "How should the runtime adapter be deployed?",
                    "What approval policy is acceptable for early runs?",
                ],
                "decisions": [],
                "facts": [],
                "activeFocus": ["Resolve architecture ambiguities", "Persist clarification history"],
            },
        },
        {
            "id": "ch-201",
            "tenantId": "tenant-sandbox",
            "title": "Isolated sandbox change",
            "subtitle": "Used to validate tenant scoping",
            "state": "approved",
            "owner": {"id": "sandbox-chief", "label": "Sandbox Chief"},
            "createdAt": "2026-03-28T09:00:00Z",
            "updatedAt": "2026-03-28T09:00:00Z",
            "lastRunAgo": "not started",
            "blocker": "No blocker",
            "nextAction": "Run next step",
            "requirementsLinked": 0,
            "requirementsTotal": 3,
            "loopCount": 0,
            "specStatus": "approved",
            "verificationStatus": "not started",
            "summary": "Secondary tenant used to prove repo-level state isolation.",
            "policy": {
                "maxAutoCycles": 1,
                "escalationRule": "human review",
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
            "timeline": [],
            "contract": {
                "goal": "Validate tenant isolation.",
                "scope": ["tenant boundary"],
                "acceptanceCriteria": ["No cross-tenant memory leakage"],
                "constraints": [],
            },
            "memory": {
                "summary": "No work has started.",
                "openQuestions": [],
                "decisions": [],
                "facts": [],
                "activeFocus": [],
            },
        },
    ],
    "runs": [
        {
            "id": "run-30",
            "changeId": "ch-142",
            "tenantId": "tenant-demo",
            "kind": "review",
            "status": "completed",
            "transport": "stdio",
            "threadId": "thr_seed_142_30",
            "turnId": "turn_seed_142_30",
            "worktree": "wt-142-c",
            "result": "partial",
            "duration": "08:12",
            "outcome": "1 launcher lifecycle gap",
            "prompt": "/openspec-review-impl-vs-plan-compact ch-142",
            "checks": ["pytest targeted ✅", "ui-platform ✅", "launcher lifecycle ❌"],
            "decision": "Keep the hardening loop active.",
            "memoryPacket": {
                "tenantMemory": {
                    "facts": [
                        {
                            "id": "fact-001",
                            "tenantId": "tenant-demo",
                            "title": "Operator IA is stable",
                            "body": "Control Queue, Change Detail, Runs, and Chief must remain first-class surfaces.",
                            "status": "approved",
                        }
                    ]
                },
                "changeContract": {"goal": "Replace the static prototype with a real application foundation."},
                "changeMemory": {"summary": "Launcher false-ready still open."},
                "focusGraph": {"items": [{"id": "gap-g91", "kind": "gap", "title": "Close launcher false-ready drift"}]},
            },
        }
    ],
    "runEvents": [
        {
            "runId": "run-30",
            "type": "item/commandExecution/requestApproval",
            "payload": {
                "_requestId": "req-seed-run-30-1",
                "reason": "Launcher lifecycle needs operator review before the next apply loop.",
                "command": "bash ./scripts/ccc start dev",
            },
        },
        {
            "runId": "run-30",
            "type": "serverRequest/resolved",
            "payload": {
                "requestId": "req-seed-run-30-1",
                "status": "accepted",
                "text": "Operator accepted the lifecycle investigation request.",
            },
        },
    ],
    "approvals": [
        {
            "id": "approval-30-1",
            "runId": "run-30",
            "tenantId": "tenant-demo",
            "status": "accepted",
            "kind": "commandExecution",
            "reason": "Launcher lifecycle needs operator review before the next apply loop.",
            "decision": "accept",
            "payload": {
                "_requestId": "req-seed-run-30-1",
                "command": "bash ./scripts/ccc start dev",
                "source": "seed-fixture",
            },
        }
    ],
    "evidence": [
        {
            "id": "a-301",
            "changeId": "ch-142",
            "runId": "run-30",
            "kind": "review report",
            "title": "Compact review output",
            "body": "Overall status: partial. Launcher can report ready while no managed listeners survive startup.",
        }
    ],
}


def build_seed_fixtures() -> dict:
    return deepcopy(SEED_FIXTURES)
