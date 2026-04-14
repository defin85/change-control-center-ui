from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP_ENTRY = ROOT / "web/src/App.tsx"
BOOTSTRAP_CONTROLLER = ROOT / "web/src/platform/navigation/useShellBootstrapController.ts"
BOOTSTRAP_SHELL = ROOT / "web/src/platform/shells/ShellBootstrapApp.tsx"
REALTIME_BOUNDARY = ROOT / "web/src/platform/realtime/useTenantRealtimeBoundary.ts"
REALTIME_STATUS_HERO = ROOT / "web/src/platform/shells/RealtimeStatusHero.tsx"
REFERENCE_QUEUE_PAGE = ROOT / "web/src/reference/ReferenceTenantQueuePage.tsx"
REFERENCE_CATALOG_PAGE = ROOT / "web/src/reference/ReferenceRepositoryCatalogPage.tsx"
REFERENCE_RUNS_PAGE = ROOT / "web/src/reference/ReferenceRunsWorkspacePage.tsx"
REFERENCE_SELECTED_CHANGE_WORKSPACE = ROOT / "web/src/reference/ReferenceSelectedChangeWorkspace.tsx"
REPOSITORY_AUTHORING_DIALOG = ROOT / "web/src/platform/workbench/RepositoryAuthoringDialog.tsx"
REPOSITORY_CATALOG_PROFILE = ROOT / "web/src/platform/workbench/RepositoryCatalogProfile.tsx"
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
    assert "changesResponseSchema" in source
    assert "changeDetailResponseSchema" in source
    assert "runsResponseSchema" in source
    assert "runDetailResponseSchema" in source
    assert "createTenantResponseSchema" in source
    assert "createChangeResponseSchema" in source
    assert "runMutationResponseSchema" in source
    assert "deleteChangeResponseSchema" in source
    assert "clarificationRoundResponseSchema" in source
    assert "promotedFactResponseSchema" in source
    assert "approvalDecisionResponseSchema" in source
    assert "readOperatorRouteState" in source
    assert "buildOperatorRouteHref" in source
    assert "runSlice" in source
    assert "viewId" in source
    assert "filterId" in source
    assert "changeId" in source
    assert "runId" in source
    assert "tabId" in source
    assert "setRunSlice" in source
    assert "selectRun" in source
    assert "openSelectedRunChange" in source
    assert "setQueueView" in source
    assert "setQueueFilter" in source
    assert "setQueueTab" in source
    assert "selectQueueChange" in source
    assert "retrySelectedChangeDetail" in source
    assert "deleteSelectedChange" in source
    assert "runSelectedChangeNextStep" in source
    assert "escalateSelectedChange" in source
    assert "blockSelectedChangeBySpec" in source
    assert "createSelectedChangeClarificationRound" in source
    assert "answerSelectedChangeClarificationRound" in source
    assert "promoteSelectedChangeFact" in source
    assert "decideSelectedRunApproval" in source
    assert "setCatalogFilter" in source
    assert "selectCatalogTenant" in source
    assert "window.history.replaceState" in source
    assert "window.history.pushState" in source


def test_shell_bootstrap_controller_reconciles_shared_tenant_events_and_guards_stale_refreshes() -> None:
    source = _read(BOOTSTRAP_CONTROLLER)
    realtime_source = _read(REALTIME_BOUNDARY)
    hero_source = _read(REALTIME_STATUS_HERO)

    assert "useTenantRealtimeBoundary" in source
    assert "realtimeBoundary" in source
    assert "retryRealtime" in source
    assert "realtimeRetryCount" in source
    assert "routeRevisionRef" in source
    assert "bootstrapRequestSequenceRef" in source
    assert "realtimeRefreshInFlightRef" in source
    assert "realtimeRefreshQueuedRef" in source
    assert "preserveToast" in source
    assert "allowOnRouteChange" in source
    assert "buildRealtimeReconciliationNotice" in source
    assert "buildRealtimeDegradedNotice" in source
    assert "resolveNextRouteState" in source
    assert "resolveExplicitCatalogSelection" in source

    assert "connectionKey" in realtime_source
    assert "onRealtimeOpen" in realtime_source
    assert 'socket.send("subscribe")' in realtime_source

    assert "realtime-degraded" in hero_source
    assert "realtime-reconciling" in hero_source
    assert 'data-platform-action="retry-realtime"' in hero_source


def test_bootstrap_shell_surfaces_explicit_loading_and_failure_states() -> None:
    source = _read(BOOTSTRAP_SHELL)

    assert "Hydrating operator shell" in source
    assert "Operator shell bootstrap failed" in source
    assert "functional shell" in source


def test_bootstrap_shell_routes_queue_workspace_into_backend_owned_reference_page() -> None:
    source = _read(BOOTSTRAP_SHELL)

    assert "ReferenceTenantQueuePage" in source
    assert 'if (routeState.workspaceMode === "queue")' in source
    assert "queueWorkspace={controller.queueWorkspace}" in source
    assert "realtimeBoundary={controller.realtimeBoundary}" in source
    assert "toast={toast}" in source
    assert "onSelectQueueView={controller.setQueueView}" in source
    assert "onSelectQueueTab={controller.setQueueTab}" in source
    assert "onSelectQueueChange={controller.selectQueueChange}" in source
    assert "onRetrySelectedChangeDetail={controller.retrySelectedChangeDetail}" in source
    assert "onDeleteSelectedChange={controller.deleteSelectedChange}" in source
    assert "onRunSelectedChangeNextStep={controller.runSelectedChangeNextStep}" in source
    assert "onEscalateSelectedChange={controller.escalateSelectedChange}" in source
    assert "onBlockSelectedChangeBySpec={controller.blockSelectedChangeBySpec}" in source
    assert "onCreateSelectedChangeClarificationRound={controller.createSelectedChangeClarificationRound}" in source
    assert "onAnswerSelectedChangeClarificationRound={controller.answerSelectedChangeClarificationRound}" in source
    assert "onPromoteSelectedChangeFact={controller.promoteSelectedChangeFact}" in source
    assert "onRetryRealtime={controller.retryRealtime}" in source


def test_bootstrap_shell_routes_catalog_workspace_into_backend_owned_reference_page() -> None:
    source = _read(BOOTSTRAP_SHELL)

    assert "ReferenceRepositoryCatalogPage" in source
    assert 'if (routeState.workspaceMode === "catalog")' in source
    assert "realtimeBoundary={controller.realtimeBoundary}" in source
    assert "onCreateTenant={controller.createTenant}" in source
    assert "onCreateChange={controller.createChange}" in source
    assert "onSelectFilter={controller.setCatalogFilter}" in source
    assert "onRetryRealtime={controller.retryRealtime}" in source


def test_bootstrap_shell_routes_runs_workspace_into_backend_owned_reference_page() -> None:
    source = _read(BOOTSTRAP_SHELL)

    assert "ReferenceRunsWorkspacePage" in source
    assert 'return (' in source
    assert "runsWorkspace={controller.runsWorkspace}" in source
    assert "realtimeBoundary={controller.realtimeBoundary}" in source
    assert "onSelectRunSlice={controller.setRunSlice}" in source
    assert "onSelectRun={controller.selectRun}" in source
    assert "onOpenSelectedRunChange={controller.openSelectedRunChange}" in source
    assert "onRetrySelectedRunDetail={controller.retrySelectedRunDetail}" in source
    assert "toast={toast}" in source
    assert "onDecideSelectedRunApproval={controller.decideSelectedRunApproval}" in source
    assert "onRetryRealtime={controller.retryRealtime}" in source


def test_reference_queue_page_is_wired_for_live_queue_navigation_and_selected_change_handoff() -> None:
    source = _read(REFERENCE_QUEUE_PAGE)

    assert "buildWorkspaceHref" in source
    assert "queueWorkspace" in source
    assert "onSelectQueueView" in source
    assert "onSelectQueueFilter" in source
    assert "onSelectQueueTab" in source
    assert "onSelectQueueChange" in source
    assert "onRetrySelectedChangeDetail" in source
    assert "RealtimeStatusHero" in source
    assert "realtimeBoundary" in source
    assert "onRetryRealtime" in source
    assert "toast" in source
    assert "onDeleteSelectedChange" in source
    assert "onRunSelectedChangeNextStep" in source
    assert "onEscalateSelectedChange" in source
    assert "onBlockSelectedChangeBySpec" in source
    assert "onCreateSelectedChangeClarificationRound" in source
    assert "onAnswerSelectedChangeClarificationRound" in source
    assert "onPromoteSelectedChangeFact" in source
    assert "backend-owned queue" in source
    assert "full detail hydration" not in source
    assert "Queue summary only" not in source
    assert "window.location.assign" not in source


def test_reference_catalog_page_is_wired_for_live_workspace_navigation_and_authoring() -> None:
    source = _read(REFERENCE_CATALOG_PAGE)

    assert "buildWorkspaceHref" in source
    assert "onWorkspaceModeChange" in source
    assert "RealtimeStatusHero" in source
    assert "realtimeBoundary" in source
    assert "onRetryRealtime" in source
    assert "backend-owned catalog" in source
    assert "static catalog reference" not in source
    assert "window.location.assign" not in source


def test_reference_runs_page_is_wired_for_live_run_navigation_and_handoff() -> None:
    source = _read(REFERENCE_RUNS_PAGE)

    assert "buildWorkspaceHref" in source
    assert "runsWorkspace" in source
    assert "onSelectRunSlice" in source
    assert "onSelectRun" in source
    assert "onOpenSelectedRunChange" in source
    assert "onRetrySelectedRunDetail" in source
    assert "onDecideSelectedRunApproval" in source
    assert "RealtimeStatusHero" in source
    assert "realtimeBoundary" in source
    assert "onRetryRealtime" in source
    assert "toast" in source
    assert "backend-owned runs" in source
    assert "hidden legacy run surface" in source
    assert "window.location.assign" not in source


def test_selected_change_workspace_surfaces_supported_command_boundaries_and_fail_closed_copy() -> None:
    source = _read(REFERENCE_SELECTED_CHANGE_WORKSPACE)

    assert "useAsyncWorkflowCommandMachine" in source
    assert "Explicit backend-owned mutation boundaries" in source
    assert 'data-platform-action="run-next-step"' in source
    assert 'data-platform-action="escalate-change"' in source
    assert 'data-platform-action="block-change-by-spec"' in source
    assert 'data-platform-action="delete-change"' in source
    assert 'data-platform-governance="selected-change-command-pending"' in source
    assert 'data-platform-governance="selected-change-command-error"' in source
    assert 'data-platform-governance="selected-change-command-unavailable"' in source
    assert 'data-platform-action="generate-clarification-round"' in source
    assert 'data-platform-action="submit-clarification-answers"' in source
    assert 'data-platform-action="promote-tenant-fact"' in source
    assert 'data-platform-governance="promote-fact-pending"' in source
    assert 'data-platform-governance="promote-fact-error"' in source
    assert 'data-platform-surface="tenant-memory-list"' in source
    assert 'data-platform-surface="change-memory-facts"' in source
    assert 'data-platform-surface="open-clarification-round"' in source
    assert "Run next step stays disabled while a backend-owned run is already active." in source
    assert "Delete change stays disabled while a backend-owned run is still active." in source
    assert "Clarification generation stays disabled while an open round already exists." in source
    assert "Answer submission stays disabled until every open question has an option." in source


def test_selected_run_workspace_surfaces_approval_decision_boundaries() -> None:
    source = _read(REFERENCE_RUNS_PAGE)

    assert "useAsyncWorkflowCommandMachine" in source
    assert 'data-platform-surface="run-approvals"' in source
    assert 'data-platform-action="accept-approval"' in source
    assert 'data-platform-action="decline-approval"' in source
    assert 'data-platform-governance="run-approval-pending"' in source
    assert 'data-platform-governance="run-approval-error"' in source
    assert "Resolved approvals remain read-only after reconciliation." in source


def test_repository_authoring_and_change_creation_surface_explicit_command_boundaries() -> None:
    dialog_source = _read(REPOSITORY_AUTHORING_DIALOG)
    profile_source = _read(REPOSITORY_CATALOG_PROFILE)

    assert 'data-platform-governance="create-repository-error"' in dialog_source
    assert 'data-platform-governance="create-repository-pending"' in dialog_source
    assert 'data-platform-governance="create-change-error"' in profile_source
    assert 'data-platform-governance="create-change-pending"' in profile_source
    assert 'data-platform-action="new-repository"' in profile_source
    assert 'data-platform-action="new-change"' in profile_source
    assert 'data-platform-action={entry.changeCount === 0 ? "create-first-change" : "open-queue"}' in profile_source


def test_static_reference_shell_remains_a_repo_artifact_without_live_bridge_affordances() -> None:
    source = _read(STATIC_REFERENCE)

    assert "codex-lb style" in source
    assert "static default" in source
    assert "Open live workbench" not in source
    assert "?workspace=catalog" not in source


def test_legacy_live_workbench_sources_are_removed_from_the_repo() -> None:
    missing = [path for path in REMOVED_LEGACY_FILES if path.exists()]

    assert missing == []
