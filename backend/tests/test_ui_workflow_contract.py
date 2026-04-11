from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP_ENTRY = ROOT / "web/src/App.tsx"
STATIC_REFERENCE = ROOT / "web/src/reference/OperatorStyleSamplePage.tsx"
REMOVED_LEGACY_FILES = [
    ROOT / "web/src/api.ts",
    ROOT / "web/src/components/ChangeDetail.tsx",
    ROOT / "web/src/components/ClarificationPanel.tsx",
    ROOT / "web/src/components/DetailTabularSection.tsx",
    ROOT / "web/src/components/OperatorRail.tsx",
    ROOT / "web/src/components/QueuePanel.tsx",
    ROOT / "web/src/components/RunDetailPanel.tsx",
    ROOT / "web/src/components/RunsWorkspacePanel.tsx",
    ROOT / "web/src/components/RunStudio.tsx",
    ROOT / "web/src/platform/server-state/useOperatorServerState.ts",
    ROOT / "web/src/platform/workbench/OperatorWorkbench.tsx",
    ROOT / "web/src/platform/workbench/RepositoryCatalogPanel.tsx",
    ROOT / "web/src/platform/workbench/RepositoryCatalogRail.tsx",
    ROOT / "web/src/platform/workbench/SimpleReferenceWorkbench.css",
    ROOT / "web/src/platform/workbench/SimpleReferenceWorkbench.tsx",
    ROOT / "web/src/platform/workbench/WorkbenchHeader.tsx",
    ROOT / "web/src/platform/workbench/WorkbenchStatusStrip.tsx",
    ROOT / "web/src/platform/workflow/surfaces.ts",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_shipped_app_entry_renders_static_reference_shell_directly() -> None:
    source = _read(APP_ENTRY)

    assert "OperatorStyleSamplePage" in source
    assert "useOperatorServerState" not in source
    assert "SimpleReferenceWorkbench" not in source
    assert "window.history.replaceState" in source


def test_static_reference_shell_removes_live_bridge_affordances() -> None:
    source = _read(STATIC_REFERENCE)

    assert "codex-lb style" in source
    assert "static default" in source
    assert "Open live workbench" not in source
    assert "?workspace=catalog" not in source


def test_legacy_live_workbench_sources_are_removed_from_the_repo() -> None:
    missing = [path for path in REMOVED_LEGACY_FILES if path.exists()]

    assert missing == []
