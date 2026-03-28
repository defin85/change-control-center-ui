from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


def test_bootstrap_returns_real_backend_state(client: TestClient) -> None:
    response = client.get("/api/bootstrap")

    assert response.status_code == 200
    payload = response.json()

    assert payload["tenants"]
    assert payload["activeTenantId"]
    assert payload["changes"]
    assert any(change["id"] == "ch-142" for change in payload["changes"])


def test_change_detail_restores_contract_memory_and_focus(client: TestClient) -> None:
    response = client.get("/api/tenants/tenant-demo/changes/ch-142")

    assert response.status_code == 200
    payload = response.json()

    assert payload["change"]["contract"]["goal"]
    assert payload["change"]["memory"]["summary"]
    assert payload["focusGraph"]["items"]


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

        run_response = client.post(
            "/api/tenants/tenant-demo/changes/ch-150/runs",
            json={"kind": "design"},
        )
    assert run_response.status_code == 201

    memory_packet = run_response.json()["run"]["memoryPacket"]
    facts = memory_packet["tenantMemory"]["facts"]
    assert any(fact["title"] == "Runtime adapter default deployment" for fact in facts)


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
