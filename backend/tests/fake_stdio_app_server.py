from __future__ import annotations

import json
import sys


def send(message: dict) -> None:
    sys.stdout.write(json.dumps(message) + "\n")
    sys.stdout.flush()


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
        send({"id": message_id, "result": {"thread": {"id": "thr_stdio_001"}}})
        send({"method": "thread/started", "params": {"thread": {"id": "thr_stdio_001"}}})
        continue

    if method == "turn/start":
        send({"id": message_id, "result": {"turn": {"id": "turn_stdio_001", "status": "inProgress"}}})
        send(
            {
                "method": "item/started",
                "params": {
                    "threadId": "thr_stdio_001",
                    "turnId": "turn_stdio_001",
                    "item": {
                        "id": "item_agent_1",
                        "type": "agentMessage",
                        "text": "Started stdio run",
                        "phase": "commentary",
                    },
                },
            }
        )
        send(
            {
                "method": "item/commandExecution/requestApproval",
                "params": {
                    "threadId": "thr_stdio_001",
                    "turnId": "turn_stdio_001",
                    "itemId": "cmd_approval_1",
                    "reason": "Allow applying structured edits to the change worktree.",
                    "command": ["apply_patch", "change patch"],
                    "cwd": "/tmp/change-worktree",
                    "availableDecisions": ["accept", "decline"],
                },
            }
        )
        send(
            {
                "method": "item/completed",
                "params": {
                    "threadId": "thr_stdio_001",
                    "turnId": "turn_stdio_001",
                    "item": {
                        "id": "item_agent_1",
                        "type": "agentMessage",
                        "text": "Completed stdio run",
                        "phase": "final_answer",
                    },
                },
            }
        )
        send({"method": "turn/completed", "params": {"turn": {"id": "turn_stdio_001", "status": "completed"}}})
        continue

    send({"id": message_id, "result": {}})
