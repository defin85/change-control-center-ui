from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.domain import build_repository_catalog_entry, create_change
from backend.app.store import SQLiteStore


def test_bootstrap_returns_real_backend_state(client: TestClient) -> None:
    response = client.get("/api/bootstrap")

    assert response.status_code == 200
    payload = response.json()

    assert payload["tenants"]
    assert payload["repositoryCatalog"]
    assert payload["activeTenantId"]
    assert payload["changes"]
    assert any(change["id"] == "ch-142" for change in payload["changes"])
    bootstrap_change = next(change for change in payload["changes"] if change["id"] == "ch-142")
    assert bootstrap_change["owner"] == {"id": "codex-chief", "label": "Codex Chief"}
    demo_catalog_entry = next(entry for entry in payload["repositoryCatalog"] if entry["tenantId"] == "tenant-demo")
    assert demo_catalog_entry["changeCount"] >= 1
    assert demo_catalog_entry["attentionState"] in {"active", "blocked", "quiet", "needs_setup"}


def test_tenant_creation_persists_backend_owned_project_entry(client: TestClient) -> None:
    response = client.post(
        "/api/tenants",
        json={
            "name": "workspace-created-from-ui",
            "repoPath": "/tmp/workspace-created-from-ui",
            "description": "Created through the operator shell contract.",
        },
    )

    assert response.status_code == 201
    tenant = response.json()["tenant"]
    assert tenant["id"].startswith("tenant-")
    assert tenant["name"] == "workspace-created-from-ui"
    assert tenant["repoPath"] == "/tmp/workspace-created-from-ui"
    assert "defaultOwner" not in tenant

    internal_tenant = client.app.state.store.get_tenant(tenant["id"])
    assert internal_tenant["defaultOwner"] == {
        "id": "workspace-created-from-ui-chief",
        "label": "Workspace Created From Ui Chief",
    }

    bootstrap = client.get("/api/bootstrap")
    assert bootstrap.status_code == 200
    assert bootstrap.json()["activeTenantId"] == "tenant-demo"
    assert any(item["id"] == tenant["id"] for item in bootstrap.json()["tenants"])
    created_entry = next(entry for entry in bootstrap.json()["repositoryCatalog"] if entry["tenantId"] == tenant["id"])
    public_tenant = next(item for item in bootstrap.json()["tenants"] if item["id"] == tenant["id"])
    assert "defaultOwner" not in public_tenant
    assert created_entry["changeCount"] == 0
    assert created_entry["attentionState"] == "needs_setup"
    assert created_entry["nextRecommendedAction"] == "Create first change"

    changes = client.get(f"/api/tenants/{tenant['id']}/changes")
    assert changes.status_code == 200
    assert changes.json()["changes"] == []


def test_first_change_for_new_tenant_uses_persisted_tenant_default_owner(client: TestClient) -> None:
    tenant_response = client.post(
        "/api/tenants",
        json={
            "name": "fresh-review-repo",
            "repoPath": "/tmp/fresh-review-repo",
            "description": "Cold-start tenant owner proof.",
        },
    )

    assert tenant_response.status_code == 201
    tenant = tenant_response.json()["tenant"]
    internal_tenant = client.app.state.store.get_tenant(tenant["id"])

    response = client.post(
        f"/api/tenants/{tenant['id']}/changes",
        json={"title": "First change for a cold-start tenant"},
    )

    assert response.status_code == 201
    created_change = response.json()["change"]
    assert created_change["owner"] == internal_tenant["defaultOwner"]

    queue_response = client.get(f"/api/tenants/{tenant['id']}/changes")
    detail_response = client.get(f"/api/tenants/{tenant['id']}/changes/{created_change['id']}")

    assert queue_response.status_code == 200
    assert detail_response.status_code == 200

    queue_change = next(change for change in queue_response.json()["changes"] if change["id"] == created_change["id"])
    assert queue_change["owner"] == internal_tenant["defaultOwner"]
    assert detail_response.json()["change"]["owner"] == internal_tenant["defaultOwner"]


def test_legacy_string_owner_resolves_to_canonical_contract(client: TestClient) -> None:
    tenant_response = client.post(
        "/api/tenants",
        json={
            "name": "Legacy migration tenant",
            "repoPath": "/tmp/legacy-migration-tenant",
            "description": "Validates legacy scalar owner migration.",
        },
    )

    assert tenant_response.status_code == 201
    tenant = tenant_response.json()["tenant"]
    internal_tenant = client.app.state.store.get_tenant(tenant["id"])

    legacy_label_change = create_change(tenant["id"], "Legacy display-label owner migration proof")
    legacy_label_change["owner"] = internal_tenant["defaultOwner"]["label"]
    client.app.state.store.add_change(legacy_label_change)

    legacy_chief_change = create_change(tenant["id"], "Legacy chief owner migration proof")
    legacy_chief_change["owner"] = "chief"
    client.app.state.store.add_change(legacy_chief_change)

    queue_response = client.get(f"/api/tenants/{tenant['id']}/changes")
    detail_response = client.get(f"/api/tenants/{tenant['id']}/changes/{legacy_chief_change['id']}")

    assert queue_response.status_code == 200
    assert detail_response.status_code == 200

    queue_payload = {change["id"]: change for change in queue_response.json()["changes"]}
    assert queue_payload[legacy_label_change["id"]]["owner"] == internal_tenant["defaultOwner"]
    assert queue_payload[legacy_chief_change["id"]]["owner"] == internal_tenant["defaultOwner"]
    assert detail_response.json()["change"]["owner"] == internal_tenant["defaultOwner"]


def test_tenant_creation_rejects_duplicate_repo_path(client: TestClient) -> None:
    response = client.post(
        "/api/tenants",
        json={
            "name": "duplicate-repo-path",
            "repoPath": "/home/egor/code/change-control-center-ui",
            "description": "Should fail because tenant-demo already owns this repo path.",
        },
    )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_repository_catalog_entry_uses_latest_activity_even_when_featured_change_is_priority_selected() -> None:
    entry = build_repository_catalog_entry(
        {
            "id": "tenant-review",
            "name": "review-repo",
            "repoPath": "/tmp/review-repo",
            "description": "Review fixture",
        },
        [
            {
                "id": "ch-blocked",
                "title": "Blocked but older",
                "state": "blocked_by_spec",
                "updatedAt": "2026-03-28T10:00:00Z",
                "lastRunAgo": "3d ago",
                "nextAction": "Review blocked work",
            },
            {
                "id": "ch-active",
                "title": "Active and newer",
                "state": "draft",
                "updatedAt": "2026-03-28T15:45:00Z",
                "lastRunAgo": "5m ago",
                "nextAction": "Continue planning",
            },
        ],
    )

    assert entry["featuredChange"]["id"] == "ch-blocked"
    assert entry["lastActivity"] == "5m ago"


def test_change_detail_restores_contract_memory_and_focus(client: TestClient) -> None:
    response = client.get("/api/tenants/tenant-demo/changes/ch-142")

    assert response.status_code == 200
    payload = response.json()

    assert payload["change"]["contract"]["goal"]
    assert payload["change"]["memory"]["summary"]
    assert payload["focusGraph"]["items"]
    assert payload["change"]["owner"] == {"id": "codex-chief", "label": "Codex Chief"}


def test_seeded_demo_change_reflects_canonical_runs_shell_copy(client: TestClient) -> None:
    response = client.get("/api/tenants/tenant-demo/changes/ch-142")

    assert response.status_code == 200
    payload = response.json()

    assert "run studio" not in payload["change"]["subtitle"].lower()
    assert "legacy template" not in payload["change"]["gaps"][0]["summary"].lower()
    assert "legacy entrypoint" not in payload["change"]["gaps"][0]["evidence"].lower()
    assert "launcher" in payload["change"]["gaps"][0]["summary"].lower()
    assert all("run studio" not in fact["body"].lower() for fact in payload["tenantMemory"])
    assert all("legacy" not in focus.lower() for focus in payload["change"]["memory"]["activeFocus"])


def test_queue_and_detail_share_same_canonical_owner_contract(client: TestClient) -> None:
    queue_response = client.get("/api/tenants/tenant-demo/changes")
    detail_response = client.get("/api/tenants/tenant-demo/changes/ch-142")

    assert queue_response.status_code == 200
    assert detail_response.status_code == 200

    queue_change = next(change for change in queue_response.json()["changes"] if change["id"] == "ch-142")
    detail_owner = detail_response.json()["change"]["owner"]

    assert queue_change["owner"] == {"id": "codex-chief", "label": "Codex Chief"}
    assert queue_change["owner"] == detail_owner


def test_tenant_run_list_defaults_to_attention_slice_with_change_handoff_fields(client: TestClient) -> None:
    response = client.get("/api/tenants/tenant-demo/runs")

    assert response.status_code == 200
    payload = response.json()

    assert payload["slice"] == "attention"
    assert [run["id"] for run in payload["runs"]] == ["run-30"]

    run_entry = payload["runs"][0]
    assert run_entry["requiresAttention"] is True
    assert run_entry["pendingApprovalCount"] == 0
    assert run_entry["change"]["id"] == "ch-142"
    assert run_entry["change"]["owner"] == {"id": "codex-chief", "label": "Codex Chief"}
    assert run_entry["recentActivity"] == run_entry["change"]["lastRunAgo"]


def test_tenant_run_list_supports_full_history_and_newest_first_ordering(client: TestClient) -> None:
    store: SQLiteStore = client.app.state.store
    store.create_run(
        {
            "id": "run-40",
            "changeId": "ch-146",
            "tenantId": "tenant-demo",
            "kind": "apply",
            "status": "completed",
            "transport": "stdio",
            "threadId": "thr_seed_146_40",
            "turnId": "turn_seed_146_40",
            "worktree": "wt-146-a",
            "result": "success",
            "duration": "04:10",
            "outcome": "All checks passed",
            "prompt": "/openspec-apply ch-146",
            "checks": ["pytest targeted ✅", "ui smoke ✅"],
            "decision": "Ready for merge.",
            "memoryPacket": {
                "tenantMemory": {"facts": []},
                "changeContract": {"goal": "Start the first real apply run through the new stack."},
                "changeMemory": {"summary": "Initial apply completed cleanly."},
                "focusGraph": {"items": []},
            },
        }
    )

    attention_response = client.get("/api/tenants/tenant-demo/runs?slice=attention")
    history_response = client.get("/api/tenants/tenant-demo/runs?slice=all")

    assert attention_response.status_code == 200
    assert history_response.status_code == 200
    assert [run["id"] for run in attention_response.json()["runs"]] == ["run-30"]
    assert [run["id"] for run in history_response.json()["runs"][:2]] == ["run-40", "run-30"]
    assert history_response.json()["runs"][0]["requiresAttention"] is False


def test_run_detail_returns_seeded_events_and_approvals(client: TestClient) -> None:
    response = client.get("/api/tenants/tenant-demo/runs/run-30")

    assert response.status_code == 200
    payload = response.json()

    assert payload["run"]["id"] == "run-30"
    assert [event["type"] for event in payload["events"]] == [
        "item/commandExecution/requestApproval",
        "serverRequest/resolved",
    ]
    assert payload["approvals"] == [
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
    ]


@pytest.mark.parametrize(
    ("tenant_id", "expected_owner"),
    [
        ("tenant-demo", {"id": "codex-chief", "label": "Codex Chief"}),
        ("tenant-sandbox", {"id": "sandbox-chief", "label": "Sandbox Chief"}),
    ],
)
def test_created_change_inherits_tenant_scoped_default_owner_contract(
    client: TestClient,
    tenant_id: str,
    expected_owner: dict[str, str],
) -> None:
    response = client.post(
        f"/api/tenants/{tenant_id}/changes",
        json={"title": f"Owner contract proof for {tenant_id}"},
    )

    assert response.status_code == 201
    created_change = response.json()["change"]
    assert created_change["owner"] == expected_owner

    queue_response = client.get(f"/api/tenants/{tenant_id}/changes")
    detail_response = client.get(f"/api/tenants/{tenant_id}/changes/{created_change['id']}")

    assert queue_response.status_code == 200
    assert detail_response.status_code == 200

    queue_change = next(change for change in queue_response.json()["changes"] if change["id"] == created_change["id"])
    assert queue_change["owner"] == expected_owner
    assert detail_response.json()["change"]["owner"] == expected_owner


def _wait_for_run_completion(client: TestClient, tenant_id: str, run_id: str) -> dict:
    deadline = time.time() + 5
    last_payload: dict | None = None
    while time.time() < deadline:
        response = client.get(f"/api/tenants/{tenant_id}/runs/{run_id}")
        assert response.status_code == 200
        last_payload = response.json()
        if last_payload["run"]["status"] == "completed":
            return last_payload
        time.sleep(0.05)
    raise AssertionError(f"Run {run_id} did not complete. Last payload: {last_payload}")


def test_run_creation_persists_run_before_completion_and_supports_approval_decision(
    make_client,
    app_env: dict[str, str],
) -> None:
    script_path = Path(__file__).with_name("fake_stdio_app_server.py")
    app_env["CCC_RUNTIME_TRANSPORT"] = "stdio"
    app_env["CCC_RUNTIME_COMMAND"] = f"{sys.executable} {script_path}"
    os.environ.update(app_env)

    with make_client() as client:
        response = client.post(
            "/api/tenants/tenant-demo/changes/ch-146/runs",
            json={"kind": "apply"},
        )
        assert response.status_code == 201
        payload = response.json()
        run_id = payload["run"]["id"]
        approval_id = payload["approvals"][0]["id"]

        assert payload["run"]["status"] == "inProgress"
        assert payload["run"]["threadId"] == "thr_stdio_001"
        assert payload["run"]["turnId"] == "turn_stdio_001"
        assert payload["run"]["transport"] == "stdio"
        assert payload["run"]["memoryPacket"]["tenantMemory"]["facts"]
        assert payload["events"]
        assert payload["approvals"]
        assert payload["approvals"][0]["status"] == "pending"

        in_flight = client.get(f"/api/tenants/tenant-demo/runs/{run_id}")
        assert in_flight.status_code == 200
        in_flight_payload = in_flight.json()
        assert in_flight_payload["run"]["status"] == "inProgress"
        assert any(event["type"] == "item/commandExecution/requestApproval" for event in in_flight_payload["events"])

        decision_response = client.post(
            f"/api/tenants/tenant-demo/approvals/{approval_id}/decision",
            json={"decision": "accept"},
        )
        assert decision_response.status_code == 200

        completed_payload = _wait_for_run_completion(client, "tenant-demo", run_id)

    assert any(event["type"] == "serverRequest/resolved" for event in completed_payload["events"])
    assert any(approval["status"] == "accepted" for approval in completed_payload["approvals"])


def test_follow_up_run_forks_previous_thread_lineage(
    make_client,
    app_env: dict[str, str],
) -> None:
    script_path = Path(__file__).with_name("fake_stdio_app_server.py")
    app_env["CCC_RUNTIME_TRANSPORT"] = "stdio"
    app_env["CCC_RUNTIME_COMMAND"] = f"{sys.executable} {script_path}"
    os.environ.update(app_env)

    with make_client() as client:
        first = client.post("/api/tenants/tenant-demo/changes/ch-146/runs", json={"kind": "apply"})
        assert first.status_code == 201
        first_payload = first.json()
        first_run_id = first_payload["run"]["id"]
        first_approval_id = first_payload["approvals"][0]["id"]
        decision = client.post(
            f"/api/tenants/tenant-demo/approvals/{first_approval_id}/decision",
            json={"decision": "accept"},
        )
        assert decision.status_code == 200
        _wait_for_run_completion(client, "tenant-demo", first_run_id)

        second = client.post("/api/tenants/tenant-demo/changes/ch-146/runs", json={"kind": "review"})
        assert second.status_code == 201
        second_payload = second.json()

    assert second_payload["run"]["threadId"].startswith("thr_stdio_001_fork_")
    assert second_payload["run"]["threadId"] != first_payload["run"]["threadId"]
    assert second_payload["run"]["turnId"]


def test_clarification_round_persists_answers_in_change_memory_and_reaches_ready_to_propose(client: TestClient) -> None:
    round_response = client.post("/api/tenants/tenant-demo/changes/ch-150/clarifications/auto")
    assert round_response.status_code == 201
    clarification_round = round_response.json()["round"]
    questions = clarification_round["questions"]

    answer_response = client.post(
        f"/api/tenants/tenant-demo/clarifications/{clarification_round['id']}/answers",
        json={
            "answers": [
                {
                    "questionId": question["id"],
                    "selectedOptionId": question["options"][0]["id"],
                    "freeformNote": f"Ответ для {question['id']}.",
                }
                for question in questions
            ]
        },
    )
    assert answer_response.status_code == 200

    detail_response = client.get("/api/tenants/tenant-demo/changes/ch-150")
    assert detail_response.status_code == 200
    detail = detail_response.json()

    assert detail["clarificationRounds"]
    assert detail["clarificationRounds"][0]["answers"][0]["freeformNote"]
    assert any(item["kind"] == "clarification" for item in detail["focusGraph"]["items"])
    assert detail["change"]["memory"]["clarifications"]
    assert detail["change"]["state"] == "ready_to_propose"
    assert detail["change"]["nextAction"] == "Create proposal"


def test_clarification_answers_reject_empty_payload(client: TestClient) -> None:
    round_response = client.post("/api/tenants/tenant-demo/changes/ch-150/clarifications/auto")
    assert round_response.status_code == 201
    clarification_round = round_response.json()["round"]

    answer_response = client.post(
        f"/api/tenants/tenant-demo/clarifications/{clarification_round['id']}/answers",
        json={"answers": []},
    )

    assert answer_response.status_code == 422


def test_answered_clarification_rounds_become_history_and_reject_resubmission(client: TestClient) -> None:
    round_response = client.post("/api/tenants/tenant-demo/changes/ch-150/clarifications/auto")
    assert round_response.status_code == 201
    first_round = round_response.json()["round"]

    answer_payload = {
        "answers": [
            {
                "questionId": question["id"],
                "selectedOptionId": question["options"][0]["id"],
                "freeformNote": f"History answer for {question['id']}.",
            }
            for question in first_round["questions"]
        ]
    }
    answer_response = client.post(
        f"/api/tenants/tenant-demo/clarifications/{first_round['id']}/answers",
        json=answer_payload,
    )
    assert answer_response.status_code == 200

    duplicate_response = client.post(
        f"/api/tenants/tenant-demo/clarifications/{first_round['id']}/answers",
        json=answer_payload,
    )
    assert duplicate_response.status_code == 409

    second_round_response = client.post("/api/tenants/tenant-demo/changes/ch-150/clarifications/auto")
    assert second_round_response.status_code == 201
    second_round = second_round_response.json()["round"]
    assert second_round["status"] == "open"
    assert second_round["answers"] == []

    detail_response = client.get("/api/tenants/tenant-demo/changes/ch-150")
    assert detail_response.status_code == 200
    detail = detail_response.json()

    answered_round = next(round_data for round_data in detail["clarificationRounds"] if round_data["id"] == first_round["id"])
    active_round = next(round_data for round_data in detail["clarificationRounds"] if round_data["id"] == second_round["id"])

    assert answered_round["status"] == "answered"
    assert answered_round["answers"] == answer_payload["answers"]
    assert active_round["status"] == "open"
    assert active_round["answers"] == []


def test_open_clarification_rounds_reject_parallel_auto_generation(client: TestClient) -> None:
    first_round_response = client.post("/api/tenants/tenant-demo/changes/ch-150/clarifications/auto")
    assert first_round_response.status_code == 201

    second_round_response = client.post("/api/tenants/tenant-demo/changes/ch-150/clarifications/auto")

    assert second_round_response.status_code == 409
    assert second_round_response.json()["detail"] == "An open clarification round already exists"


def test_runs_list_newest_inserted_run_first_even_when_ids_are_not_lexically_sorted(tmp_path: Path) -> None:
    store = SQLiteStore(tmp_path / "ccc.db")
    store.initialize()
    base_run = {
        "changeId": "ch-150",
        "tenantId": "tenant-demo",
        "kind": "design",
        "status": "completed",
        "transport": "stdio",
        "threadId": "thr_ordering",
        "turnId": "turn_ordering",
        "worktree": "wt-ordering",
        "result": "done",
        "duration": "1s",
        "outcome": "ordering proof",
        "prompt": "/design ch-150",
        "checks": [],
        "decision": "ordering proof",
        "memoryPacket": {
            "tenantMemory": {"facts": []},
            "changeContract": {},
            "changeMemory": {
                "summary": "",
                "openQuestions": [],
                "decisions": [],
                "facts": [],
                "activeFocus": [],
                "clarifications": [],
            },
            "focusGraph": {"items": []},
        },
    }

    store.create_run({
        **base_run,
        "id": "run-z-last-lexically",
    })
    store.create_run({
        **base_run,
        "id": "run-a-latest-inserted",
        "turnId": "turn_ordering_latest",
    })

    runs = store.list_runs("tenant-demo", "ch-150")

    assert [run["id"] for run in runs[:2]] == ["run-a-latest-inserted", "run-z-last-lexically"]


def test_memory_promotion_updates_tenant_memory_and_future_run_packets(
    make_client,
    app_env: dict[str, str],
) -> None:
    script_path = Path(__file__).with_name("fake_stdio_app_server.py")
    app_env["CCC_RUNTIME_TRANSPORT"] = "stdio"
    app_env["CCC_RUNTIME_COMMAND"] = f"{sys.executable} {script_path}"
    os.environ.update(app_env)

    with make_client() as client:
        promote_response = client.post(
            "/api/tenants/tenant-demo/changes/ch-150/promotions",
            json={
                "fact": {
                    "title": "Runtime adapter default deployment",
                    "body": "Sidecar rollout is approved for the first release.",
                }
            }
        )
        assert promote_response.status_code == 201
        promoted_fact = promote_response.json()["fact"]
        assert promoted_fact["id"].startswith("fact-")
        assert promoted_fact["tenantId"] == "tenant-demo"
        assert promoted_fact["status"] == "approved"

        detail_response = client.get("/api/tenants/tenant-demo/changes/ch-150")
        assert detail_response.status_code == 200
        detail = detail_response.json()
        assert any(
            fact["id"] == promoted_fact["id"]
            and fact["tenantId"] == "tenant-demo"
            and fact["status"] == "approved"
            for fact in detail["tenantMemory"]
        )

        run_response = client.post(
            "/api/tenants/tenant-demo/changes/ch-150/runs",
            json={"kind": "design"},
        )
    assert run_response.status_code == 201

    memory_packet = run_response.json()["run"]["memoryPacket"]
    facts = memory_packet["tenantMemory"]["facts"]
    matching_fact = next(fact for fact in facts if fact["id"] == promoted_fact["id"])
    assert matching_fact["title"] == "Runtime adapter default deployment"
    assert matching_fact["tenantId"] == "tenant-demo"
    assert matching_fact["status"] == "approved"


def test_change_detail_normalizes_legacy_run_memory_packet_fact_shape(
    client: TestClient,
    app_env: dict[str, str],
) -> None:
    store = SQLiteStore(Path(app_env["CCC_DB_PATH"]))
    run = store.get_run("tenant-demo", "run-30")
    assert run is not None

    run["memoryPacket"]["tenantMemory"]["facts"] = [
        {
            "title": "Legacy tenant fact",
            "body": "Legacy run payload stored before canonical fact records landed.",
        }
    ]
    with store._lock:
        store._connection.execute(
            "update runs set memory_packet_json = ?, run_json = ? where id = ?",
            (
                json.dumps(run["memoryPacket"]),
                json.dumps(run),
                "run-30",
            ),
        )
        store._connection.commit()

    response = client.get("/api/tenants/tenant-demo/changes/ch-142")
    assert response.status_code == 200

    facts = response.json()["runs"][0]["memoryPacket"]["tenantMemory"]["facts"]
    assert len(facts) == 1
    assert facts[0]["id"].startswith("fact-legacy-")
    assert facts[0]["tenantId"] == "tenant-demo"
    assert facts[0]["status"] == "approved"


def test_run_creation_normalizes_legacy_tenant_memory_fact_shape(
    make_client,
    app_env: dict[str, str],
) -> None:
    script_path = Path(__file__).with_name("fake_stdio_app_server.py")
    app_env["CCC_RUNTIME_TRANSPORT"] = "stdio"
    app_env["CCC_RUNTIME_COMMAND"] = f"{sys.executable} {script_path}"
    os.environ.update(app_env)

    with make_client() as client:
        store = SQLiteStore(Path(app_env["CCC_DB_PATH"]))
        with store._lock:
            store._connection.execute(
                "update tenant_memory set fact_json = ? where id = ?",
                (
                    json.dumps(
                        {
                            "title": "Legacy promoted fact",
                            "body": "Stored before canonical fact metadata was added.",
                        }
                    ),
                    "fact-001",
                ),
            )
            store._connection.commit()

        response = client.post(
            "/api/tenants/tenant-demo/changes/ch-150/runs",
            json={"kind": "design"},
        )

    assert response.status_code == 201
    facts = response.json()["run"]["memoryPacket"]["tenantMemory"]["facts"]
    assert facts
    assert facts[0]["id"].startswith("fact-legacy-")
    assert facts[0]["tenantId"] == "tenant-demo"
    assert facts[0]["status"] == "approved"


def test_fact_promotion_rejects_empty_title_or_body(client: TestClient) -> None:
    response = client.post(
        "/api/tenants/tenant-demo/changes/ch-150/promotions",
        json={"fact": {"title": "", "body": ""}},
    )

    assert response.status_code == 422


def test_tenant_scoping_prevents_cross_tenant_leakage(client: TestClient) -> None:
    demo_changes = client.get("/api/tenants/tenant-demo/changes")
    sandbox_changes = client.get("/api/tenants/tenant-sandbox/changes")
    assert demo_changes.status_code == 200
    assert sandbox_changes.status_code == 200

    demo_ids = {item["id"] for item in demo_changes.json()["changes"]}
    sandbox_ids = {item["id"] for item in sandbox_changes.json()["changes"]}
    assert "ch-142" in demo_ids
    assert "ch-201" not in demo_ids
    assert "ch-201" in sandbox_ids
    assert "ch-142" not in sandbox_ids

    sandbox_detail = client.get("/api/tenants/tenant-sandbox/changes/ch-201")
    assert sandbox_detail.status_code == 200
    payload = sandbox_detail.json()
    assert payload["tenantMemory"] == []
    assert payload["clarificationRounds"] == []


def test_run_next_action_starts_inferred_backend_owned_run_and_reconciles_queue(
    make_client,
    app_env: dict[str, str],
) -> None:
    script_path = Path(__file__).with_name("fake_stdio_app_server.py")
    app_env["CCC_RUNTIME_TRANSPORT"] = "stdio"
    app_env["CCC_RUNTIME_COMMAND"] = f"{sys.executable} {script_path}"
    os.environ.update(app_env)

    with make_client() as client:
        tenant_response = client.post(
            "/api/tenants",
            json={
                "name": "command-workflow-run-next",
                "repoPath": "/tmp/command-workflow-run-next",
                "description": "Fresh tenant for run-next action proof.",
            },
        )
        assert tenant_response.status_code == 201
        tenant_id = tenant_response.json()["tenant"]["id"]

        change_response = client.post(
            f"/api/tenants/{tenant_id}/changes",
            json={"title": "Run next from the shipped operator shell"},
        )
        assert change_response.status_code == 201
        change_id = change_response.json()["change"]["id"]

        response = client.post(f"/api/tenants/{tenant_id}/changes/{change_id}/actions/run-next")

        assert response.status_code == 201
        payload = response.json()
        assert payload["run"]["changeId"] == change_id
        assert payload["run"]["kind"] == "design"
        assert payload["run"]["status"] == "inProgress"
        assert payload["approvals"]
        assert payload["change"]["id"] == change_id
        assert payload["change"]["summary"] == "A backend-owned run is currently executing."
        assert payload["change"]["nextAction"] == "Run in progress"
        assert payload["change"]["blocker"] == "Waiting for runtime completion"

        detail_response = client.get(f"/api/tenants/{tenant_id}/changes/{change_id}")
        assert detail_response.status_code == 200
        assert detail_response.json()["change"]["summary"] == "A backend-owned run is currently executing."

        runs_response = client.get(f"/api/tenants/{tenant_id}/runs")
        assert runs_response.status_code == 200
        run_entry = next(run for run in runs_response.json()["runs"] if run["id"] == payload["run"]["id"])
        assert run_entry["change"]["id"] == change_id
        assert run_entry["requiresAttention"] is True


def test_escalate_action_updates_change_state_across_detail_and_queue(client: TestClient) -> None:
    create_response = client.post(
        "/api/tenants/tenant-demo/changes",
        json={"title": "Escalate me from the supported shell"},
    )
    assert create_response.status_code == 201
    change_id = create_response.json()["change"]["id"]

    response = client.post(f"/api/tenants/tenant-demo/changes/{change_id}/actions/escalate")

    assert response.status_code == 200
    payload = response.json()
    assert payload["change"]["id"] == change_id
    assert payload["change"]["state"] == "escalated"
    assert payload["change"]["nextAction"] == "Operator intervention required"
    assert payload["change"]["blocker"] == "Escalated by chief"
    assert payload["change"]["summary"] == "Chief escalated the change for operator review."

    detail_response = client.get(f"/api/tenants/tenant-demo/changes/{change_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["change"]["state"] == "escalated"

    queue_response = client.get("/api/tenants/tenant-demo/changes")
    assert queue_response.status_code == 200
    queue_change = next(change for change in queue_response.json()["changes"] if change["id"] == change_id)
    assert queue_change["state"] == "escalated"
    assert queue_change["nextAction"] == "Operator intervention required"


def test_block_by_spec_action_updates_change_state_across_detail_and_queue(client: TestClient) -> None:
    create_response = client.post(
        "/api/tenants/tenant-demo/changes",
        json={"title": "Block me from the supported shell"},
    )
    assert create_response.status_code == 201
    change_id = create_response.json()["change"]["id"]

    response = client.post(f"/api/tenants/tenant-demo/changes/{change_id}/actions/block-by-spec")

    assert response.status_code == 200
    payload = response.json()
    assert payload["change"]["id"] == change_id
    assert payload["change"]["state"] == "blocked_by_spec"
    assert payload["change"]["nextAction"] == "Clarify specification"
    assert payload["change"]["blocker"] == "Blocked by specification ambiguity"
    assert payload["change"]["summary"] == "Chief blocked the change until the specification is clarified."

    detail_response = client.get(f"/api/tenants/tenant-demo/changes/{change_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["change"]["state"] == "blocked_by_spec"

    queue_response = client.get("/api/tenants/tenant-demo/changes")
    assert queue_response.status_code == 200
    queue_change = next(change for change in queue_response.json()["changes"] if change["id"] == change_id)
    assert queue_change["state"] == "blocked_by_spec"
    assert queue_change["nextAction"] == "Clarify specification"


def test_change_deletion_cascades_backend_owned_records(
    make_client,
    app_env: dict[str, str],
) -> None:
    script_path = Path(__file__).with_name("fake_stdio_app_server.py")
    app_env["CCC_RUNTIME_TRANSPORT"] = "stdio"
    app_env["CCC_RUNTIME_COMMAND"] = f"{sys.executable} {script_path}"
    os.environ.update(app_env)

    with make_client() as client:
        create_response = client.post(
            "/api/tenants/tenant-demo/changes",
            json={"title": "Delete me from the operator shell"},
        )
        assert create_response.status_code == 201
        change_id = create_response.json()["change"]["id"]

        clarification_response = client.post(f"/api/tenants/tenant-demo/changes/{change_id}/clarifications/auto")
        assert clarification_response.status_code == 201

        run_response = client.post(
            f"/api/tenants/tenant-demo/changes/{change_id}/runs",
            json={"kind": "design"},
        )
        assert run_response.status_code == 201
        run_id = run_response.json()["run"]["id"]
        assert run_response.json()["approvals"]

        delete_response = client.delete(f"/api/tenants/tenant-demo/changes/{change_id}")
        assert delete_response.status_code == 200
        assert delete_response.json() == {"deletedChangeId": change_id}

        detail_response = client.get(f"/api/tenants/tenant-demo/changes/{change_id}")
        assert detail_response.status_code == 404

        run_detail_response = client.get(f"/api/tenants/tenant-demo/runs/{run_id}")
        assert run_detail_response.status_code == 404

        remaining_changes = client.get("/api/tenants/tenant-demo/changes")
        assert remaining_changes.status_code == 200
        assert change_id not in {change["id"] for change in remaining_changes.json()["changes"]}

    store = SQLiteStore(Path(app_env["CCC_DB_PATH"]))
    assert store.list_runs("tenant-demo", change_id) == []
    assert store.list_evidence(change_id) == []
    assert store.list_clarification_rounds("tenant-demo", change_id) == []
    assert store.list_run_events(run_id) == []
    assert store.list_approvals(run_id) == []
