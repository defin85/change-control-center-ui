from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW_SURFACES = ROOT / "web/src/platform/workflow/surfaces.ts"
CHANGE_DETAIL = ROOT / "web/src/components/ChangeDetail.tsx"
RUN_STUDIO = ROOT / "web/src/components/RunStudio.tsx"
CLARIFICATION_PANEL = ROOT / "web/src/components/ClarificationPanel.tsx"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_workflow_surface_catalog_keeps_required_explicit_boundaries() -> None:
    source = _read(WORKFLOW_SURFACES)

    assert 'id: "run-execution"' in source
    assert 'id: "approval-resolution"' in source
    assert 'id: "clarification-rounds"' in source
    assert "useAsyncWorkflowCommandMachine.ts" in source


def test_workflow_surfaces_keep_machine_boundary_on_shipped_components() -> None:
    assert "useAsyncWorkflowCommandMachine" in _read(CHANGE_DETAIL)
    assert "useAsyncWorkflowCommandMachine" in _read(RUN_STUDIO)
    assert "useAsyncWorkflowCommandMachine" in _read(CLARIFICATION_PANEL)
