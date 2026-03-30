from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB_ROOT = ROOT / "web"
FIXTURE_FILENAME = "src/__lint_tmp__/GovernanceFixture.tsx"


def _run_eslint(source: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            "npm",
            "exec",
            "eslint",
            "--",
            "--format",
            "json",
            "--stdin",
            "--stdin-filename",
            FIXTURE_FILENAME,
        ],
        cwd=WEB_ROOT,
        input=source,
        text=True,
        capture_output=True,
        check=False,
    )


def _eslint_messages(result: subprocess.CompletedProcess[str]) -> list[str]:
    assert result.stdout.strip(), result.stderr
    payload = json.loads(result.stdout)
    return [message["message"] for file_result in payload for message in file_result["messages"]]


def test_lint_blocks_silent_platform_action_handlers() -> None:
    result = _run_eslint(
        """
        import { PlatformPrimitives } from "./platform/foundation";

        export function GovernanceFixture({ ready }: { ready: boolean }) {
          return (
            <PlatformPrimitives.Button
              type="button"
              data-platform-action="promote-fact"
              onClick={() => {
                if (!ready) {
                  return;
                }
                console.log("promoted");
              }}
            >
              Promote fact
            </PlatformPrimitives.Button>
          );
        }
        """
    )

    assert result.returncode != 0
    assert any("silent platform actions" in message.lower() for message in _eslint_messages(result))


def test_lint_allows_explicitly_disabled_platform_actions() -> None:
    result = _run_eslint(
        """
        import { PlatformPrimitives } from "./platform/foundation";

        export function GovernanceFixture({ ready }: { ready: boolean }) {
          return (
            <PlatformPrimitives.Button
              type="button"
              data-platform-action="promote-fact"
              disabled={!ready}
              onClick={() => {
                if (!ready) {
                  return;
                }
                console.log("promoted");
              }}
            >
              Promote fact
            </PlatformPrimitives.Button>
          );
        }
        """
    )

    assert result.returncode == 0, _eslint_messages(result)
