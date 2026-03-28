from __future__ import annotations

import json
import sqlite3
import threading
from pathlib import Path
from typing import Any

from backend.app.seeds import build_seed_fixtures


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True, sort_keys=True)


class SQLiteStore:
    def __init__(self, db_path: Path):
        self._connection = sqlite3.connect(db_path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._lock = threading.RLock()

    def _fetchall(self, query: str, params: tuple[Any, ...] = ()) -> list[sqlite3.Row]:
        with self._lock:
            return self._connection.execute(query, params).fetchall()

    def _fetchone(self, query: str, params: tuple[Any, ...] = ()) -> sqlite3.Row | None:
        with self._lock:
            return self._connection.execute(query, params).fetchone()

    def _execute(self, query: str, params: tuple[Any, ...] = ()) -> None:
        with self._lock:
            self._connection.execute(query, params)
            self._connection.commit()

    def initialize(self) -> None:
        with self._lock:
            cursor = self._connection.cursor()
            cursor.executescript(
                """
                create table if not exists tenants (
                  id text primary key,
                  tenant_json text not null
                );
                create table if not exists tenant_memory (
                  id text primary key,
                  tenant_id text not null,
                  fact_json text not null
                );
                create table if not exists changes (
                  id text primary key,
                  tenant_id text not null,
                  change_json text not null
                );
                create table if not exists runs (
                  id text primary key,
                  change_id text not null,
                  tenant_id text not null,
                  kind text not null,
                  status text not null,
                  transport text not null,
                  thread_id text,
                  turn_id text,
                  memory_packet_json text not null,
                  run_json text not null
                );
                create table if not exists run_events (
                  id integer primary key autoincrement,
                  run_id text not null,
                  event_type text not null,
                  payload_json text not null
                );
                create table if not exists clarification_rounds (
                  id text primary key,
                  change_id text not null,
                  tenant_id text not null,
                  round_json text not null
                );
                create table if not exists approval_requests (
                  id text primary key,
                  run_id text not null,
                  tenant_id text not null,
                  approval_json text not null
                );
                create table if not exists evidence_artifacts (
                  id text primary key,
                  change_id text not null,
                  run_id text,
                  evidence_json text not null
                );
                """
            )
            self._connection.commit()
        self._seed_if_empty()

    def _seed_if_empty(self) -> None:
        with self._lock:
            existing = self._connection.execute("select count(*) from tenants").fetchone()[0]
            if existing:
                return

            fixtures = build_seed_fixtures()
            for tenant in fixtures["tenants"]:
                self._connection.execute("insert into tenants(id, tenant_json) values (?, ?)", (tenant["id"], _json_dumps(tenant)))
            for fact in fixtures["tenantMemory"]:
                self._connection.execute(
                    "insert into tenant_memory(id, tenant_id, fact_json) values (?, ?, ?)",
                    (fact["id"], fact["tenantId"], _json_dumps(fact)),
                )
            for change in fixtures["changes"]:
                self._connection.execute(
                    "insert into changes(id, tenant_id, change_json) values (?, ?, ?)",
                    (change["id"], change["tenantId"], _json_dumps(change)),
                )
            for run in fixtures["runs"]:
                self._connection.execute(
                    """
                    insert into runs(id, change_id, tenant_id, kind, status, transport, thread_id, turn_id, memory_packet_json, run_json)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        run["id"],
                        run["changeId"],
                        run["tenantId"],
                        run["kind"],
                        run["status"],
                        run["transport"],
                        run.get("threadId"),
                        run.get("turnId"),
                        _json_dumps(run["memoryPacket"]),
                        _json_dumps(run),
                    ),
                )
            for evidence in fixtures["evidence"]:
                self._connection.execute(
                    "insert into evidence_artifacts(id, change_id, run_id, evidence_json) values (?, ?, ?, ?)",
                    (evidence["id"], evidence["changeId"], evidence.get("runId"), _json_dumps(evidence)),
                )
            self._connection.commit()

    def list_tenants(self) -> list[dict[str, Any]]:
        rows = self._fetchall("select tenant_json from tenants order by id")
        return [json.loads(row["tenant_json"]) for row in rows]

    def get_tenant(self, tenant_id: str) -> dict[str, Any] | None:
        row = self._fetchone("select tenant_json from tenants where id = ?", (tenant_id,))
        return json.loads(row["tenant_json"]) if row else None

    def list_tenant_memory(self, tenant_id: str) -> list[dict[str, Any]]:
        rows = self._fetchall(
            "select fact_json from tenant_memory where tenant_id = ? order by id",
            (tenant_id,),
        )
        return [json.loads(row["fact_json"]) for row in rows]

    def add_tenant_memory(self, fact: dict[str, Any]) -> None:
        self._execute(
            "insert into tenant_memory(id, tenant_id, fact_json) values (?, ?, ?)",
            (fact["id"], fact["tenantId"], _json_dumps(fact)),
        )

    def list_changes(self, tenant_id: str) -> list[dict[str, Any]]:
        rows = self._fetchall(
            "select change_json from changes where tenant_id = ? order by id",
            (tenant_id,),
        )
        return [json.loads(row["change_json"]) for row in rows]

    def get_change(self, tenant_id: str, change_id: str) -> dict[str, Any] | None:
        row = self._fetchone(
            "select change_json from changes where tenant_id = ? and id = ?",
            (tenant_id, change_id),
        )
        return json.loads(row["change_json"]) if row else None

    def save_change(self, change: dict[str, Any]) -> None:
        self._execute(
            "update changes set change_json = ? where id = ? and tenant_id = ?",
            (_json_dumps(change), change["id"], change["tenantId"]),
        )

    def add_change(self, change: dict[str, Any]) -> None:
        self._execute(
            "insert into changes(id, tenant_id, change_json) values (?, ?, ?)",
            (change["id"], change["tenantId"], _json_dumps(change)),
        )

    def list_runs(self, tenant_id: str, change_id: str) -> list[dict[str, Any]]:
        rows = self._fetchall(
            "select run_json from runs where tenant_id = ? and change_id = ? order by id desc",
            (tenant_id, change_id),
        )
        return [json.loads(row["run_json"]) for row in rows]

    def get_run(self, tenant_id: str, run_id: str) -> dict[str, Any] | None:
        row = self._fetchone(
            "select run_json from runs where tenant_id = ? and id = ?",
            (tenant_id, run_id),
        )
        return json.loads(row["run_json"]) if row else None

    def create_run(self, run: dict[str, Any]) -> None:
        self._execute(
            """
            insert into runs(id, change_id, tenant_id, kind, status, transport, thread_id, turn_id, memory_packet_json, run_json)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                run["id"],
                run["changeId"],
                run["tenantId"],
                run["kind"],
                run["status"],
                run["transport"],
                run.get("threadId"),
                run.get("turnId"),
                _json_dumps(run["memoryPacket"]),
                _json_dumps(run),
            ),
        )

    def update_run(self, run: dict[str, Any]) -> None:
        self._execute(
            """
            update runs
               set status = ?, transport = ?, thread_id = ?, turn_id = ?, memory_packet_json = ?, run_json = ?
             where id = ? and tenant_id = ?
            """,
            (
                run["status"],
                run["transport"],
                run.get("threadId"),
                run.get("turnId"),
                _json_dumps(run["memoryPacket"]),
                _json_dumps(run),
                run["id"],
                run["tenantId"],
            ),
        )

    def append_run_event(self, run_id: str, event_type: str, payload: dict[str, Any]) -> None:
        self._execute(
            "insert into run_events(run_id, event_type, payload_json) values (?, ?, ?)",
            (run_id, event_type, _json_dumps(payload)),
        )

    def list_run_events(self, run_id: str) -> list[dict[str, Any]]:
        rows = self._fetchall(
            "select event_type, payload_json from run_events where run_id = ? order by id",
            (run_id,),
        )
        return [{"type": row["event_type"], "payload": json.loads(row["payload_json"])} for row in rows]

    def list_evidence(self, change_id: str) -> list[dict[str, Any]]:
        rows = self._fetchall(
            "select evidence_json from evidence_artifacts where change_id = ? order by id desc",
            (change_id,),
        )
        return [json.loads(row["evidence_json"]) for row in rows]

    def add_evidence(self, artifact: dict[str, Any]) -> None:
        self._execute(
            "insert into evidence_artifacts(id, change_id, run_id, evidence_json) values (?, ?, ?, ?)",
            (artifact["id"], artifact["changeId"], artifact.get("runId"), _json_dumps(artifact)),
        )

    def list_clarification_rounds(self, change_id: str) -> list[dict[str, Any]]:
        rows = self._fetchall(
            "select round_json from clarification_rounds where change_id = ? order by id",
            (change_id,),
        )
        return [json.loads(row["round_json"]) for row in rows]

    def add_clarification_round(self, round_data: dict[str, Any]) -> None:
        self._execute(
            "insert into clarification_rounds(id, change_id, tenant_id, round_json) values (?, ?, ?, ?)",
            (round_data["id"], round_data["changeId"], round_data["tenantId"], _json_dumps(round_data)),
        )

    def save_clarification_round(self, round_data: dict[str, Any]) -> None:
        self._execute(
            "update clarification_rounds set round_json = ? where id = ? and tenant_id = ?",
            (_json_dumps(round_data), round_data["id"], round_data["tenantId"]),
        )

    def get_clarification_round(self, tenant_id: str, round_id: str) -> dict[str, Any] | None:
        row = self._fetchone(
            "select round_json from clarification_rounds where tenant_id = ? and id = ?",
            (tenant_id, round_id),
        )
        return json.loads(row["round_json"]) if row else None

    def add_approval(self, approval: dict[str, Any]) -> None:
        self._execute(
            "insert into approval_requests(id, run_id, tenant_id, approval_json) values (?, ?, ?, ?)",
            (approval["id"], approval["runId"], approval["tenantId"], _json_dumps(approval)),
        )

    def list_approvals(self, run_id: str) -> list[dict[str, Any]]:
        rows = self._fetchall(
            "select approval_json from approval_requests where run_id = ? order by id",
            (run_id,),
        )
        return [json.loads(row["approval_json"]) for row in rows]

    def get_approval(self, tenant_id: str, approval_id: str) -> dict[str, Any] | None:
        row = self._fetchone(
            "select approval_json from approval_requests where tenant_id = ? and id = ?",
            (tenant_id, approval_id),
        )
        return json.loads(row["approval_json"]) if row else None

    def save_approval(self, approval: dict[str, Any]) -> None:
        self._execute(
            "update approval_requests set approval_json = ? where id = ? and tenant_id = ?",
            (_json_dumps(approval), approval["id"], approval["tenantId"]),
        )
