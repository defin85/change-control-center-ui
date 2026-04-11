from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP_ENTRY = ROOT / "web/src/App.tsx"
BOOTSTRAP_CONTROLLER = ROOT / "web/src/platform/navigation/useShellBootstrapController.ts"
BOOTSTRAP_SHELL = ROOT / "web/src/platform/shells/ShellBootstrapApp.tsx"
REFERENCE_CATALOG_PAGE = ROOT / "web/src/reference/ReferenceRepositoryCatalogPage.tsx"
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


def test_shipped_app_entry_uses_bootstrap_shell_app() -> None:
    source = _read(APP_ENTRY)

    assert "ShellBootstrapApp" in source
    assert "OperatorStyleSamplePage" not in source
    assert "SimpleReferenceWorkbench" not in source


def test_shell_bootstrap_controller_uses_shared_control_api_and_canonical_route_state() -> None:
    source = _read(BOOTSTRAP_CONTROLLER)

    assert 'requestControlApi(BOOTSTRAP_ENDPOINT, bootstrapResponseSchema)' in source
    assert "createTenantResponseSchema" in source
    assert "createChangeResponseSchema" in source
    assert "readOperatorRouteState" in source
    assert "buildOperatorRouteHref" in source
    assert "filterId" in source
    assert "setCatalogFilter" in source
    assert "selectCatalogTenant" in source
    assert "window.history.replaceState" in source
    assert "window.history.pushState" in source


def test_bootstrap_shell_surfaces_explicit_loading_and_failure_states() -> None:
    source = _read(BOOTSTRAP_SHELL)

    assert "Hydrating operator shell" in source
    assert "Operator shell bootstrap failed" in source
    assert "functional shell" in source


def test_bootstrap_shell_routes_catalog_workspace_into_backend_owned_reference_page() -> None:
    source = _read(BOOTSTRAP_SHELL)

    assert "ReferenceRepositoryCatalogPage" in source
    assert 'if (routeState.workspaceMode === "catalog")' in source
    assert "onCreateTenant={controller.createTenant}" in source
    assert "onCreateChange={controller.createChange}" in source
    assert "onSelectFilter={controller.setCatalogFilter}" in source


def test_reference_catalog_page_is_wired_for_live_workspace_navigation_and_authoring() -> None:
    source = _read(REFERENCE_CATALOG_PAGE)

    assert "buildWorkspaceHref" in source
    assert "onWorkspaceModeChange" in source
    assert "backend-owned catalog" in source
    assert "static catalog reference" not in source
    assert "window.location.assign" not in source


def test_static_reference_shell_remains_a_repo_artifact_without_live_bridge_affordances() -> None:
    source = _read(STATIC_REFERENCE)

    assert "codex-lb style" in source
    assert "static default" in source
    assert "Open live workbench" not in source
    assert "?workspace=catalog" not in source


def test_legacy_live_workbench_sources_are_removed_from_the_repo() -> None:
    missing = [path for path in REMOVED_LEGACY_FILES if path.exists()]

    assert missing == []
