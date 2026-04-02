from __future__ import annotations

import json
import os
import subprocess
import sys
from copy import deepcopy
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[2]
WEB_ROOT = ROOT / "web"


def _base_change_detail_payload() -> dict[str, object]:
    return {
        "change": {
            "id": "ch-demo",
            "tenantId": "tenant-demo",
            "title": "Demo change",
            "subtitle": "Backend-owned operator workbench",
            "state": "draft",
            "summary": "Draft change awaiting clarification.",
            "createdAt": "2026-03-25T12:00:00Z",
            "updatedAt": "2026-03-26T08:30:00Z",
            "blocker": "No blocker",
            "nextAction": "Clarify goal",
            "verificationStatus": "not started",
            "loopCount": 0,
            "lastRunAgo": "not yet run",
            "requirementsLinked": 0,
            "requirementsTotal": 1,
            "specStatus": "draft",
            "owner": "chief",
            "policy": {
                "maxAutoCycles": 3,
                "escalationRule": "fingerprint repeated twice",
                "acceptanceGate": "Req -> Code -> Test",
            },
            "contract": {
                "goal": "Demo change",
                "scope": ["operator shell"],
                "acceptanceCriteria": ["Render backend-owned state"],
                "constraints": ["No silent fallback"],
            },
            "memory": {
                "summary": "Draft change awaiting clarification.",
                "openQuestions": ["What problem should this change solve?"],
                "decisions": [],
                "facts": [],
                "activeFocus": ["Clarify goal"],
                "clarifications": [
                    {
                        "questionId": "q-1",
                        "question": "What problem should this change solve?",
                        "selectedOptionId": "option-1",
                    }
                ],
            },
            "chiefHistory": [],
            "traceability": [],
            "gaps": [],
            "timeline": [{"title": "Draft created", "note": "New change started from the operator shell."}],
            "git": {
                "worktree": "not created",
                "branch": "not created",
                "changedFiles": 0,
                "commitStatus": "not started",
                "mergeReadiness": "not ready",
                "prStatus": "no PR",
            },
        },
        "runs": [],
        "evidence": [],
        "clarificationRounds": [],
        "focusGraph": {"items": []},
        "tenantMemory": [],
    }


def _validate_payload(payload: dict[str, object]) -> dict[str, object]:
    return _validate_against_schema("changeDetailResponseSchema", payload)


def _validate_against_schema(schema_name: str, payload: dict[str, object]) -> dict[str, object]:
    script = f"""
import fs from "node:fs";
import path from "node:path";
import {{ pathToFileURL }} from "node:url";
import * as ts from "typescript";

const source = fs.readFileSync("src/platform/contracts/schemas.ts", "utf8");
const transpiled = ts.transpileModule(source, {{
  compilerOptions: {{
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  }},
}}).outputText;

const tempDir = fs.mkdtempSync(path.join(process.cwd(), ".schema-boundary-"));
const tempFile = path.join(tempDir, "schemas.mjs");
fs.writeFileSync(tempFile, transpiled, "utf8");

try {{
  const module = await import(pathToFileURL(tempFile).href);
  const schema = module[{json.dumps(schema_name)}];
  const payload = {json.dumps(payload)};
  const result = schema.safeParse(payload);
  console.log(JSON.stringify({{
    success: result.success,
    issues: result.success ? [] : result.error.issues,
  }}));
}} finally {{
  fs.rmSync(tempDir, {{ recursive: true, force: true }});
}}
"""
    completed = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=WEB_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode == 0, completed.stderr
    return json.loads(completed.stdout)


def test_change_detail_schema_accepts_shipped_clarification_memory_shape() -> None:
    result = _validate_payload(_base_change_detail_payload())

    assert result["success"] is True
    assert result["issues"] == []


def test_change_detail_schema_accepts_seeded_payload_without_clarification_memory_entries() -> None:
    payload = deepcopy(_base_change_detail_payload())
    del payload["change"]["memory"]["clarifications"]
    payload["change"]["gaps"] = [
        {
            "id": "g-91",
            "severity": "high",
            "mandatory": True,
            "status": "closed",
            "summary": "Default startup path still points at the legacy template.",
            "recurrence": 2,
            "reqRef": "R-14",
            "evidence": "Operator shell exists, but the main startup path still resolves legacy entrypoint.",
            "fingerprint": "fp_8d21",
            "firstSeen": "run-28",
            "introducedByRun": "run-28",
            "lastSeen": "run-31",
        }
    ]

    result = _validate_payload(payload)

    assert result["success"] is True
    assert result["issues"] == []


def test_change_detail_schema_accepts_real_backend_payload(client: TestClient) -> None:
    payload = client.get("/api/tenants/tenant-demo/changes/ch-142").json()

    result = _validate_payload(payload)

    assert result["success"] is True
    assert result["issues"] == []


def test_promoted_fact_schema_accepts_canonical_backend_payload(client: TestClient) -> None:
    response = client.post(
        "/api/tenants/tenant-demo/changes/ch-150/promotions",
        json={
            "fact": {
                "title": "Runtime adapter default deployment",
                "body": "Sidecar rollout is approved for the first release.",
            }
        },
    )
    assert response.status_code == 201

    result = _validate_against_schema("promotedFactResponseSchema", response.json())

    assert result["success"] is True
    assert result["issues"] == []


def test_approval_decision_schema_accepts_real_backend_payload(
    make_client,
    app_env: dict[str, str],
) -> None:
    script_path = Path(__file__).with_name("fake_stdio_app_server.py")
    app_env["CCC_RUNTIME_COMMAND"] = f"{sys.executable} {script_path}"
    os.environ.update(app_env)
    with make_client() as client:
        run_response = client.post("/api/tenants/tenant-demo/changes/ch-146/runs", json={"kind": "apply"})
        assert run_response.status_code == 201
        approval_id = run_response.json()["approvals"][0]["id"]
        response = client.post(
            f"/api/tenants/tenant-demo/approvals/{approval_id}/decision",
            json={"decision": "accept"},
        )
        assert response.status_code == 200

    result = _validate_against_schema("approvalDecisionResponseSchema", response.json())

    assert result["success"] is True
    assert result["issues"] == []


def test_change_detail_schema_rejects_nested_contract_drift() -> None:
    payload = deepcopy(_base_change_detail_payload())
    payload["change"]["memory"]["unexpectedDrift"] = "silent"
    payload["change"]["memory"]["clarifications"][0]["unexpectedDrift"] = "silent"

    result = _validate_payload(payload)

    assert result["success"] is False
    assert any(issue["code"] == "unrecognized_keys" for issue in result["issues"])


def test_change_detail_schema_rejects_top_level_contract_drift() -> None:
    payload = deepcopy(_base_change_detail_payload())
    payload["unexpectedEnvelope"] = True

    result = _validate_payload(payload)

    assert result["success"] is False
    assert any(issue["code"] == "unrecognized_keys" for issue in result["issues"])
