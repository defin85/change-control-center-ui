from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB_ROOT = ROOT / "web"
FIXTURE_FILENAME = "src/components/__lint_tmp__/GovernanceFixture.tsx"


def _run_eslint(source: str, filename: str = FIXTURE_FILENAME) -> subprocess.CompletedProcess[str]:
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
            filename,
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


def test_lint_blocks_disabled_platform_actions_with_silent_return_guards() -> None:
    result = _run_eslint(
        """
        import { PlatformPrimitives } from "./platform/foundation";

        export function GovernanceFixture({ ready }: { ready: boolean }) {
          return (
            <PlatformPrimitives.Button
              type="button"
              data-platform-action="open-runs"
              disabled={!ready}
              onClick={() => {
                if (!ready) {
                  return;
                }
                console.log("opened");
              }}
            >
              Open runs
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


def test_lint_blocks_placeholder_fallback_copy() -> None:
    result = _run_eslint(
        """
        export function GovernanceFixture() {
          return <p>Temporary fallback copy for a future delivery pass.</p>;
        }
        """
    )

    assert result.returncode != 0
    assert any("placeholder fallback copy" in message.lower() for message in _eslint_messages(result))


def test_lint_blocks_second_primary_design_system_import() -> None:
    result = _run_eslint(
        """
        import Button from "@mui/material/Button";

        export function GovernanceFixture() {
          return <Button>Blocked</Button>;
        }
        """
    )

    assert result.returncode != 0
    assert any("second primary design system" in message.lower() for message in _eslint_messages(result))


def test_lint_blocks_root_surface_platform_bypass_even_without_reserved_filename() -> None:
    result = _run_eslint(
        """
        import { QueuePanel } from "./components/QueuePanel";

        export function RootSurface() {
          return <QueuePanel />;
        }
        """,
        filename="src/RootSurface.tsx",
    )

    assert result.returncode != 0
    assert any("route-level composition" in message.lower() for message in _eslint_messages(result))


def test_lint_blocks_nested_surface_platform_bypass_outside_approved_zones() -> None:
    result = _run_eslint(
        """
        import { QueuePanel } from "../../components/QueuePanel";

        export function NestedSurface() {
          return <QueuePanel />;
        }
        """,
        filename="src/features/review/NestedSurface.tsx",
    )

    assert result.returncode != 0
    assert any("route-level composition" in message.lower() for message in _eslint_messages(result))
