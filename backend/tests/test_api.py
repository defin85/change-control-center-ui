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


def test_run_creation_uses_curated_memory_and_persists_lineage_over_stdio(
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

    assert payload["run"]["threadId"] == "thr_stdio_001"
    assert payload["run"]["turnId"] == "turn_stdio_001"
    assert payload["run"]["transport"] == "stdio"
    assert payload["run"]["memoryPacket"]["tenantMemory"]["facts"]
    assert payload["events"]
    assert payload["approvals"]
    assert payload["approvals"][0]["status"] == "pending"


def test_clarification_round_persists_answers_across_requests(client: TestClient) -> None:
    round_response = client.post("/api/tenants/tenant-demo/changes/ch-150/clarifications/auto")
    assert round_response.status_code == 201
    clarification_round = round_response.json()["round"]
    question = clarification_round["questions"][0]

    answer_response = client.post(
        f"/api/tenants/tenant-demo/clarifications/{clarification_round['id']}/answers",
        json={
            "answers": [
                {
                    "questionId": question["id"],
                    "selectedOptionId": question["options"][0]["id"],
                    "freeformNote": "Зафиксируем sidecar deployment на первом этапе.",
                }
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
