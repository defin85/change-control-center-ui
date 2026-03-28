from __future__ import annotations

import json
import sys


def send(message: dict) -> None:
    sys.stdout.write(json.dumps(message) + "\n")
    sys.stdout.flush()


thread_counter = 1
fork_counter = 0
current_thread_id = ""
current_turn_id = ""
pending_request_id: int | None = None
pending_item_id = ""
pending_command = ["apply_patch", "change patch"]
pending_cwd = "/tmp/change-worktree"


for raw_line in sys.stdin:
    line = raw_line.strip()
    if not line:
        continue

    message = json.loads(line)
    method = message.get("method")
    message_id = message.get("id")

    if method == "initialize":
        send({"id": message_id, "result": {"platformFamily": "linux", "platformOs": "arch"}})
        continue

    if method == "initialized":
        continue

    if method == "thread/start":
        current_thread_id = f"thr_stdio_{thread_counter:03d}"
        thread_counter += 1
        send({"id": message_id, "result": {"thread": {"id": current_thread_id}}})
        send({"method": "thread/started", "params": {"thread": {"id": current_thread_id}}})
        continue

    if method == "thread/fork":
        parent_thread_id = message["params"]["threadId"]
        fork_counter += 1
        current_thread_id = f"{parent_thread_id}_fork_{fork_counter}"
        send({"id": message_id, "result": {"thread": {"id": current_thread_id}}})
        send({"method": "thread/started", "params": {"thread": {"id": current_thread_id}}})
        continue

    if method == "turn/start":
        current_turn_id = f"turn_{current_thread_id.split('thr_')[-1]}"
        pending_request_id = 9000 + fork_counter + thread_counter
        pending_item_id = f"cmd_{current_turn_id}"
        send({"id": message_id, "result": {"turn": {"id": current_turn_id, "status": "inProgress"}}})
        send(
            {
                "method": "item/started",
                "params": {
                    "threadId": current_thread_id,
                    "turnId": current_turn_id,
                    "item": {
                        "id": pending_item_id,
                        "type": "commandExecution",
                        "status": "inProgress",
                        "command": pending_command,
                        "cwd": pending_cwd,
                    },
                },
            }
        )
        send(
            {
                "id": pending_request_id,
                "method": "item/commandExecution/requestApproval",
                "params": {
                    "threadId": current_thread_id,
                    "turnId": current_turn_id,
                    "itemId": pending_item_id,
                    "reason": "Allow applying structured edits to the change worktree.",
                    "command": pending_command,
                    "cwd": pending_cwd,
                    "availableDecisions": ["accept", "decline"],
                },
            }
        )
        continue

    if pending_request_id is not None and message_id == pending_request_id:
        decision = message.get("result", "cancel")
        final_status = "declined" if decision in {"decline", "cancel"} else "completed"
        send(
            {
                "method": "serverRequest/resolved",
                "params": {
                    "threadId": current_thread_id,
                    "turnId": current_turn_id,
                    "requestId": pending_request_id,
                },
            }
        )
        send(
            {
                "method": "item/completed",
                "params": {
                    "threadId": current_thread_id,
                    "turnId": current_turn_id,
                    "item": {
                        "id": pending_item_id,
                        "type": "commandExecution",
                        "status": final_status,
                        "command": pending_command,
                        "cwd": pending_cwd,
                    },
                },
            }
        )
        send(
            {
                "method": "turn/completed",
                "params": {"turn": {"id": current_turn_id, "status": "completed"}},
            }
        )
        pending_request_id = None
        pending_item_id = ""
        continue

    send({"id": message_id, "result": {}})
