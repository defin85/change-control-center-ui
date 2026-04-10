import { useEffect, useMemo, useState } from "react";

import { ChangeDetail } from "../../components/ChangeDetail";
import { RunStudio } from "../../components/RunStudio";
import { formatStateLabel } from "../../lib";
import type { ChangeDetailResponse, ChangeSummary, RepositoryCatalogEntry } from "../../types";
import { PlatformPrimitives } from "../foundation";
import type { OperatorWorkspaceMode } from "../navigation";
import { describeFilter, filterRepositoryCatalog, REPOSITORY_CATALOG_FILTERS, buildViewCounts, OPERATOR_FILTERS } from "../server-state";
import type { RepositoryCatalogFilterId } from "../server-state/filtering";
import { DetailWorkspaceShell } from "../shells/DetailWorkspaceShell";
import { RepositoryCatalogWorkspaceShell } from "../shells/RepositoryCatalogWorkspaceShell";
import { WorkspacePageShell } from "../shells/WorkspacePageShell";
import { useAsyncWorkflowCommandMachine } from "../workflow";
import { RepositoryAuthoringDialog } from "./RepositoryAuthoringDialog";
import type { OperatorWorkbenchProps } from "./types";

import "./SimpleReferenceWorkbench.css";

type ReferenceTone = "blue" | "violet" | "emerald" | "amber";

type MetricCardModel = {
  label: string;
  value: string;
  meta: string;
  tone: ReferenceTone;
  trend: number[];
};

type RingItem = {
  label: string;
  value: string;
  color: string;
};

type ExecutionLane = {
  label: string;
  detail: string;
  tone: ReferenceTone;
  percent: number;
};

const DONUT_COLORS = {
  blue: "#4f8cff",
  violet: "#8c63ff",
  emerald: "#12b886",
  amber: "#f59f00",
} as const;

const NAV_ITEMS = [
  { id: "queue", label: "Workbench" },
  { id: "catalog", label: "Repositories" },
] as const;

const STATIC_NAV_ITEMS = ["Runs", "Governance"] as const;

export function SimpleReferenceWorkbench({
  bootstrap,
  activeWorkspaceMode,
  activeTenantId,
  hasExplicitCatalogSelection,
  activeViewId,
  activeFilterId,
  activeViewCount,
  activeTenantRepoPath,
  repositoryCatalog,
  searchQuery,
  activeTabId,
  selectedChangeId,
  selectedRunId,
  detail,
  changes,
  filteredChanges,
  selectedRunApprovals,
  selectedRunEvents,
  realtimeNotice,
  toast,
  onSearchQueryChange,
  onWorkspaceModeChange,
  onCreateTenant,
  onCreateChange,
  onGlobalRunNext,
  onRunNext,
  onTenantChange,
  onSelectCatalogTenant,
  onClearCatalogSelection,
  onSelectView,
  onSelectFilter,
  onSelectChange,
  onClearSelection,
  onClearSelectedRun,
  onOpenRuns,
  onEscalate,
  onBlockBySpec,
  onDeleteChange,
  onCreateClarificationRound,
  onAnswerClarificationRound,
  onSelectRun,
  onSelectTab,
  onPromoteFact,
  onApprovalDecision,
}: OperatorWorkbenchProps) {
  const [isCompactViewport, setIsCompactViewport] = useState(() => window.matchMedia("(max-width: 1080px)").matches);
  const [dismissedChangeId, setDismissedChangeId] = useState<string | null>(null);
  const [isCreateTenantDialogOpen, setIsCreateTenantDialogOpen] = useState(false);
  const [activeRepositoryCatalogFilterId, setActiveRepositoryCatalogFilterId] =
    useState<RepositoryCatalogFilterId>("all");
  const [workflowDetailOpenByUser, setWorkflowDetailOpenByUser] = useState(false);

  const globalWorkflow = useAsyncWorkflowCommandMachine();
  const detailWorkflow = useAsyncWorkflowCommandMachine();
  const catalogSelectionWorkflow = useAsyncWorkflowCommandMachine();

  const activeTenant = bootstrap.tenants.find((tenant) => tenant.id === activeTenantId) ?? bootstrap.tenants[0];
  const activeViewLabel = bootstrap.views.find((view) => view.id === activeViewId)?.label ?? "Inbox";
  const activeFilter = describeFilter(activeFilterId);
  const viewCounts = buildViewCounts(bootstrap.views, changes);
  const activeRepositoryCatalogEntry = repositoryCatalog.find((entry) => entry.tenantId === activeTenantId) ?? null;
  const selectedRun = detail?.runs.find((run) => run.id === selectedRunId) ?? null;
  const hasVisibleContextualPrimaryAction = Boolean(selectedChangeId) && (!isCompactViewport || dismissedChangeId !== selectedChangeId);
  const isDetailWorkspaceOpen = Boolean(selectedChangeId) && dismissedChangeId !== selectedChangeId;
  const isRepositoryCatalogWorkspaceOpen = Boolean(activeRepositoryCatalogEntry) && hasExplicitCatalogSelection;
  const toolbarItems = bootstrap.tenants.map((tenant) => ({
    label: tenant.name,
    value: tenant.id,
  }));
  const filteredRepositoryCatalog = filterRepositoryCatalog(repositoryCatalog, {
    activeFilterId: activeRepositoryCatalogFilterId,
    searchQuery,
  });
  const repositoryOverviewEntries = useMemo(() => sortRepositoryOverview(repositoryCatalog, activeTenantId), [activeTenantId, repositoryCatalog]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1080px)");
    const handleChange = (event: MediaQueryListEvent) => setIsCompactViewport(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const metrics = buildMetricCards({
    activeWorkspaceMode,
    activeTenantName: activeTenant?.name ?? activeTenantId,
    activeViewLabel,
    activeViewCount,
    detail,
    filteredRepositoryCatalog,
    repositoryCatalog,
  });
  const pressureItems = buildPressureItems(repositoryCatalog);
  const executionLanes = buildExecutionLanes({
    activeViewCount,
    detail,
    filteredChangeCount: filteredChanges.length,
  });
  const isWorkflowDetailOpen = workflowDetailOpenByUser || activeTabId !== "overview" || Boolean(selectedRunId);

  async function handleCreateChange() {
    await globalWorkflow.runCommand({
      label: "New change",
      execute: onCreateChange,
    });
  }

  async function handleHeaderRunNext() {
    await globalWorkflow.runCommand({
      label: "Run next step",
      execute: onGlobalRunNext,
    });
  }

  function handleWorkspaceSelection(changeId: string | null) {
    setDismissedChangeId(null);
    onSelectChange(changeId);
  }

  function handleCloseWorkspace() {
    setDismissedChangeId(selectedChangeId);
  }

  function handleCloseCatalogWorkspace() {
    catalogSelectionWorkflow.clearError();
    onClearCatalogSelection();
  }

  async function handleCatalogSelection(tenantId: string) {
    if (tenantId === activeTenantId && hasExplicitCatalogSelection) {
      catalogSelectionWorkflow.clearError();
      return;
    }
    await catalogSelectionWorkflow.runCommand({
      label: `Open repository ${repositoryCatalog.find((entry) => entry.tenantId === tenantId)?.name ?? tenantId}`,
      execute: async () => {
        await onSelectCatalogTenant(tenantId);
      },
    });
  }

  async function handleCreateChangeFromCatalog() {
    await onCreateChange();
    onWorkspaceModeChange("queue");
  }

  const headerRunNextClassName =
    activeWorkspaceMode === "catalog" || hasVisibleContextualPrimaryAction
      ? "ghost-button operator-style-live__masthead-button"
      : "primary-button operator-style-live__masthead-button";

  const detailWorkspace = (
    <DetailWorkspaceShell
      isCompactViewport={isCompactViewport}
      isOpen={isDetailWorkspaceOpen && Boolean(selectedChangeId)}
      selectedChangeId={selectedChangeId}
      onClose={handleCloseWorkspace}
      detail={
        <SelectedChangeStage
          activeTabId={activeTabId}
          compactViewport={isCompactViewport}
          detail={detail}
          selectedRun={selectedRun}
          selectedRunApprovals={selectedRunApprovals}
          selectedRunEvents={selectedRunEvents}
          selectedRunId={selectedRunId}
          isWorkflowDetailOpen={isWorkflowDetailOpen}
          actionWorkflow={detailWorkflow}
          onWorkflowDetailOpenChange={setWorkflowDetailOpenByUser}
          onRunNext={onRunNext}
          onOpenRuns={onOpenRuns}
          onEscalate={onEscalate}
          onBlockBySpec={onBlockBySpec}
          onDeleteChange={onDeleteChange}
          onCreateClarificationRound={onCreateClarificationRound}
          onAnswerClarificationRound={onAnswerClarificationRound}
          onSelectRun={onSelectRun}
          onSelectTab={onSelectTab}
          onPromoteFact={onPromoteFact}
          onApprovalDecision={onApprovalDecision}
          onClearSelectedRun={onClearSelectedRun}
        />
      }
    />
  );

  const repositoryWorkspace = (
    <RepositoryCatalogWorkspaceShell
      isCompactViewport={isCompactViewport}
      isOpen={isRepositoryCatalogWorkspaceOpen && Boolean(activeRepositoryCatalogEntry)}
      selectedTenantId={activeTenantId}
      onClose={handleCloseCatalogWorkspace}
      detail={
        <SelectedRepositoryStage
          entry={activeRepositoryCatalogEntry}
          onOpenQueue={() => onWorkspaceModeChange("queue")}
          onCreateChange={handleCreateChangeFromCatalog}
          onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
        />
      }
    />
  );

  const workspace = (
    <div
      className={`operator-style-sample operator-style-live-workbench ${activeWorkspaceMode === "catalog" ? "operator-style-live-workbench--catalog" : ""}`}
      data-platform-surface={activeWorkspaceMode === "catalog" ? "repository-catalog-workbench" : "operator-workbench"}
    >
      <header className="operator-style-sample__masthead" data-platform-surface="workbench-header">
        <div className="operator-style-sample__masthead-inner">
          <div className="operator-style-sample__brand">
            <div className="operator-style-sample__brand-mark" aria-hidden="true">
              CC
            </div>
            <div>
              <strong>Change Control Center</strong>
              <p>{activeWorkspaceMode === "catalog" ? "Repository portfolio" : "Simple reference shell"}</p>
            </div>
          </div>

          <nav className="operator-style-sample__nav" aria-label="Primary sections">
            {NAV_ITEMS.map((item) => {
              const isActive =
                (item.id === "queue" && activeWorkspaceMode === "queue") ||
                (item.id === "catalog" && activeWorkspaceMode === "catalog");
              return (
                <PlatformPrimitives.Button
                  key={item.id}
                  type="button"
                  className={`operator-style-sample__nav-pill${isActive ? " operator-style-sample__nav-pill--active" : ""}`}
                  data-platform-action={item.id === "queue" ? "workspace-queue" : "workspace-catalog"}
                  aria-pressed={isActive}
                  onClick={() => onWorkspaceModeChange(item.id as OperatorWorkspaceMode)}
                >
                  {item.label}
                </PlatformPrimitives.Button>
              );
            })}
            {STATIC_NAV_ITEMS.map((item) => (
              <span key={item} className="operator-style-sample__nav-pill">
                {item}
              </span>
            ))}
          </nav>

          <div className="operator-style-sample__actions" data-platform-surface="global-actions">
            <PlatformPrimitives.Toolbar.Root className="operator-style-live__masthead-toolbar" data-platform-foundation="base-ui-toolbar">
              <label className="operator-style-live__search-field">
                <span>Search</span>
                <PlatformPrimitives.Toolbar.Input
                  aria-label="Search"
                  className="operator-style-live__toolbar-input"
                  name="search"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  placeholder={activeWorkspaceMode === "catalog" ? "repository, path, attention" : "change, requirement, blocker"}
                  type="search"
                />
              </label>
              {activeWorkspaceMode === "queue" ? (
                <div className="operator-style-live__tenant-picker">
                  <span>Repository</span>
                  <PlatformPrimitives.Select.Root
                    items={toolbarItems}
                    name="tenant"
                    value={activeTenantId}
                    onValueChange={(tenantId) => {
                      if (typeof tenantId === "string") {
                        void onTenantChange(tenantId);
                      }
                    }}
                  >
                    <PlatformPrimitives.Select.Trigger
                      aria-label="Repository"
                      className="operator-style-live__tenant-select"
                      data-platform-foundation="base-ui-select"
                      disabled={globalWorkflow.isPending}
                    >
                      <PlatformPrimitives.Select.Value placeholder="Choose repository" />
                      <PlatformPrimitives.Select.Icon className="operator-style-live__tenant-select-icon">▾</PlatformPrimitives.Select.Icon>
                    </PlatformPrimitives.Select.Trigger>
                    <PlatformPrimitives.Select.Portal>
                      <PlatformPrimitives.Select.Positioner sideOffset={8}>
                        <PlatformPrimitives.Select.Popup className="operator-style-live__tenant-select-popup">
                          <PlatformPrimitives.Select.List className="operator-style-live__tenant-select-list">
                            {bootstrap.tenants.map((tenant) => (
                              <PlatformPrimitives.Select.Item
                                key={tenant.id}
                                className="operator-style-live__tenant-select-item"
                                value={tenant.id}
                              >
                                <PlatformPrimitives.Select.ItemText>{tenant.name}</PlatformPrimitives.Select.ItemText>
                              </PlatformPrimitives.Select.Item>
                            ))}
                          </PlatformPrimitives.Select.List>
                        </PlatformPrimitives.Select.Popup>
                      </PlatformPrimitives.Select.Positioner>
                    </PlatformPrimitives.Select.Portal>
                  </PlatformPrimitives.Select.Root>
                </div>
              ) : null}
              <PlatformPrimitives.Toolbar.Button
                type="button"
                className="ghost-button operator-style-live__masthead-button"
                data-platform-action="new-repository"
                disabled={globalWorkflow.isPending}
                onClick={() => setIsCreateTenantDialogOpen(true)}
              >
                New repository
              </PlatformPrimitives.Toolbar.Button>
              <PlatformPrimitives.Toolbar.Button
                type="button"
                className="ghost-button operator-style-live__masthead-button"
                data-platform-action="new-change"
                disabled={globalWorkflow.isPending}
                onClick={() => {
                  void handleCreateChange();
                }}
              >
                New change
              </PlatformPrimitives.Toolbar.Button>
              {activeWorkspaceMode === "queue" ? (
                <PlatformPrimitives.Toolbar.Button
                  type="button"
                  className={headerRunNextClassName}
                  data-platform-action="run-next-step"
                  data-platform-hierarchy={hasVisibleContextualPrimaryAction ? "secondary" : "primary"}
                  disabled={!selectedChangeId || globalWorkflow.isPending}
                  title={
                    !selectedChangeId
                      ? "Select a change to continue."
                      : hasVisibleContextualPrimaryAction
                        ? "Use the selected change stage for the primary next step."
                        : undefined
                  }
                  onClick={() => {
                    void handleHeaderRunNext();
                  }}
                >
                  Run next step
                </PlatformPrimitives.Toolbar.Button>
              ) : null}
            </PlatformPrimitives.Toolbar.Root>
            <div className="operator-style-live__masthead-meta">
              <span className="operator-style-sample__ghost-chip">
                {activeWorkspaceMode === "catalog" ? "portfolio review" : "live queue"}
              </span>
              <span className="operator-style-sample__ghost-chip">backend-owned state</span>
            </div>
          </div>
        </div>
        {!selectedChangeId && activeWorkspaceMode === "queue" ? (
          <div className="operator-style-live__notice-strip">
            <p className="governance-note" data-platform-governance="run-next-selection-required">
              Select a change to run the next step.
            </p>
          </div>
        ) : null}
        {globalWorkflow.error ? (
          <div className="operator-style-live__notice-strip">
            <p className="governance-note" data-platform-governance="global-command-error">
              <strong>Global command failed.</strong> {globalWorkflow.error}
            </p>
          </div>
        ) : null}
        {globalWorkflow.isPending ? (
          <div className="operator-style-live__notice-strip">
            <p className="governance-note" data-platform-governance="global-command-pending">
              {globalWorkflow.activeLabel ?? "Global operator command in progress."}
            </p>
          </div>
        ) : null}
        {realtimeNotice ? (
          <div className="operator-style-live__notice-strip">
            <p className="governance-note" data-platform-governance="realtime-degraded">
              {realtimeNotice}
            </p>
          </div>
        ) : null}
      </header>

      <main className="operator-style-sample__page">
        <section className="operator-style-sample__page-header">
          <div>
            <h1>{activeWorkspaceMode === "catalog" ? "Repository Portfolio" : "Operator Workbench"}</h1>
            <p>
              {activeWorkspaceMode === "catalog"
                ? "Backend-owned catalog for choosing where operator attention should move next."
                : `Live backend-owned queue and selected-change workspace for ${activeTenant?.name ?? activeTenantId}.`}
            </p>
          </div>
          <div className="operator-style-sample__header-note">
            <span className="operator-style-sample__live-dot" aria-hidden="true" />
            {activeWorkspaceMode === "catalog" ? "Served repository mode" : `Served workbench · ${activeTenantRepoPath}`}
          </div>
        </section>

        <section className="operator-style-sample__metrics-grid" aria-label="Workbench metrics" data-platform-surface="workbench-overview">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="operator-style-sample__overview-grid">
          <article className="operator-style-sample__panel operator-style-sample__panel--wide">
            <div className="operator-style-sample__panel-heading">
              <div>
                <h2>{activeWorkspaceMode === "catalog" ? "Portfolio pressure" : "Repository pressure"}</h2>
                <p>
                  {activeWorkspaceMode === "catalog"
                    ? "Attention distribution across the tracked repository fleet."
                    : "Portfolio distribution behind the current queue slice."}
                </p>
              </div>
            </div>
            <div className="operator-style-sample__donut-layout">
              <PressureDonut items={pressureItems} />
              <div className="operator-style-sample__legend">
                {pressureItems.map((item) => (
                  <div key={item.label} className="operator-style-sample__legend-row">
                    <span className="operator-style-sample__legend-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    <span className="operator-style-sample__legend-label">{item.label}</span>
                    <span className="operator-style-sample__legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="operator-style-sample__panel">
            <div className="operator-style-sample__panel-heading">
              <div>
                <h2>Execution health</h2>
                <p>Where operator attention is being consumed right now.</p>
              </div>
            </div>
            <div className="operator-style-sample__execution-lanes">
              {executionLanes.map((lane) => (
                <ExecutionLaneRow key={lane.label} lane={lane} />
              ))}
            </div>
          </article>
        </section>

        <section className="operator-style-sample__section">
          <div className="operator-style-sample__section-heading">
            <h2>Repositories</h2>
            <div className="operator-style-sample__section-rule" aria-hidden="true" />
          </div>
          {activeWorkspaceMode === "catalog" ? (
            <div className="operator-style-sample__queue-layout operator-style-live__catalog-layout" data-platform-surface="repository-overview">
              <RepositoryCatalogListPanel
                entries={filteredRepositoryCatalog}
                selectedTenantId={isCompactViewport && !hasExplicitCatalogSelection ? null : activeTenantId}
                activeFilterId={activeRepositoryCatalogFilterId}
                isSelectionPending={catalogSelectionWorkflow.isPending}
                selectionPendingLabel={catalogSelectionWorkflow.activeLabel}
                selectionError={catalogSelectionWorkflow.error}
                searchQuery={searchQuery}
                onSelectFilter={setActiveRepositoryCatalogFilterId}
                onSelectTenant={(tenantId) => {
                  void handleCatalogSelection(tenantId);
                }}
                onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
              />
              {!isCompactViewport ? repositoryWorkspace : null}
            </div>
          ) : (
            <div className="operator-style-sample__repository-grid" data-platform-surface="repository-overview">
              {repositoryOverviewEntries.map((entry) => (
                <RepositoryOverviewCard
                  key={entry.tenantId}
                  entry={entry}
                  active={entry.tenantId === activeTenantId}
                  onSelect={() => {
                    if (entry.tenantId !== activeTenantId) {
                      void onTenantChange(entry.tenantId);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {activeWorkspaceMode === "queue" ? (
          <section className="operator-style-sample__section">
            <div className="operator-style-sample__section-heading">
              <h2>Live queue</h2>
              <div className="operator-style-sample__section-rule" aria-hidden="true" />
            </div>
            <div className="operator-style-sample__queue-layout" data-platform-surface="queue-detail-stage">
              <QueueStagePanel
                activeFilterId={activeFilterId}
                activeFilterLabel={activeFilter.label}
                activeViewCount={activeViewCount}
                activeViewId={activeViewId}
                activeViewLabel={activeViewLabel}
                changes={filteredChanges}
                repositoryCatalog={repositoryCatalog}
                searchQuery={searchQuery}
                selectedChangeId={selectedChangeId}
                viewCounts={viewCounts}
                views={bootstrap.views}
                onClearSelection={onClearSelection}
                onSearchQueryChange={onSearchQueryChange}
                onSelectChange={handleWorkspaceSelection}
                onSelectFilter={onSelectFilter}
                onSelectView={onSelectView}
              />
              {!isCompactViewport ? detailWorkspace : null}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="operator-style-sample__status-bar">
        <div className="operator-style-sample__status-inner">
          <span>
            <span className="operator-style-sample__live-dot" aria-hidden="true" /> Workspace: {activeWorkspaceMode}
          </span>
          <span>Repository: {activeTenant?.name ?? activeTenantId}</span>
          <span>Search: {searchQuery.trim() || "No active query"}</span>
        </div>
      </footer>
    </div>
  );

  return (
    <WorkspacePageShell
      header={null}
      workspace={workspace}
      detailWorkspace={isCompactViewport ? (activeWorkspaceMode === "catalog" ? repositoryWorkspace : detailWorkspace) : null}
      toast={
        <>
          <RepositoryAuthoringDialog
            open={isCreateTenantDialogOpen}
            onOpenChange={setIsCreateTenantDialogOpen}
            onCreateTenant={onCreateTenant}
          />
          {toast ? <div className="toast">{toast}</div> : null}
        </>
      }
    />
  );
}

type QueueStagePanelProps = {
  changes: ChangeSummary[];
  selectedChangeId: string | null;
  views: Array<{ id: string; label: string }>;
  viewCounts: Record<string, number>;
  activeViewId: string;
  activeViewLabel: string;
  activeViewCount: number;
  activeFilterId: string;
  activeFilterLabel: string;
  searchQuery: string;
  repositoryCatalog: RepositoryCatalogEntry[];
  onSearchQueryChange: (value: string) => void;
  onSelectView: (viewId: string) => void;
  onSelectFilter: (filterId: string) => void;
  onClearSelection: () => void;
  onSelectChange: (changeId: string | null) => void;
};

function QueueStagePanel({
  changes,
  selectedChangeId,
  views,
  viewCounts,
  activeViewId,
  activeViewLabel,
  activeViewCount,
  activeFilterId,
  activeFilterLabel,
  searchQuery,
  repositoryCatalog,
  onSearchQueryChange,
  onSelectView,
  onSelectFilter,
  onClearSelection,
  onSelectChange,
}: QueueStagePanelProps) {
  return (
    <article className="queue-panel operator-style-sample__panel operator-style-sample__queue-panel" data-platform-surface="control-queue">
      <div className="operator-style-sample__queue-toolbar" data-platform-surface="queue-filter-context">
        <label className="operator-style-sample__queue-search">
          <span>Search queue</span>
          <input
            aria-label="Queue search"
            className="operator-style-live__queue-input"
            name="queue-search"
            placeholder="gap, approval, blocker"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </label>
        <div className="operator-style-live__queue-pill-groups">
          <div className="operator-style-sample__queue-filters">
            {views.map((view) => (
              <PlatformPrimitives.Button
                key={view.id}
                type="button"
                className={`operator-style-live__queue-pill ${activeViewId === view.id ? "is-active" : ""}`}
                data-platform-foundation="base-ui-operator-rail-view-action"
                onClick={() => onSelectView(view.id)}
              >
                <span>{view.label}</span>
                <strong>{viewCounts[view.id] ?? 0}</strong>
              </PlatformPrimitives.Button>
            ))}
          </div>
          <div className="operator-style-sample__queue-filters operator-style-live__queue-filters-secondary">
            {OPERATOR_FILTERS.map((filter) => (
              <PlatformPrimitives.Button
                key={filter.id}
                type="button"
                className={`operator-style-live__queue-pill ${activeFilterId === filter.id ? "is-active" : ""}`}
                data-platform-foundation="base-ui-operator-rail-filter-action"
                onClick={() => onSelectFilter(filter.id)}
              >
                <span>{filter.label}</span>
              </PlatformPrimitives.Button>
            ))}
          </div>
        </div>
      </div>

      <div className="operator-style-live__queue-context">
        <div>
          <strong>{activeViewLabel}</strong>
          <span>{activeViewCount} backend-owned changes in the current slice</span>
        </div>
        <div>
          <strong>{activeFilterLabel}</strong>
          <span>{searchQuery.trim() ? `Filtered by "${searchQuery.trim()}"` : "Showing the current queue slice."}</span>
        </div>
        <PlatformPrimitives.Button
          type="button"
          className="ghost-button operator-style-live__queue-clear"
          data-platform-action="clear-selection"
          data-platform-foundation="base-ui-queue-actions"
          disabled={!selectedChangeId}
          onClick={onClearSelection}
        >
          Clear selection
        </PlatformPrimitives.Button>
      </div>

      <div className="operator-style-sample__queue-table" data-platform-foundation="tanstack-table">
        {changes.length === 0 ? (
          <div className="empty-state">No changes match the current slice. Try another view or clear search.</div>
        ) : (
          changes.map((change) => {
            const repo = repositoryCatalog.find((entry) => entry.tenantId === change.tenantId);
            const queueStatus = mapQueueStatus(change);
            return (
              <PlatformPrimitives.Button
                key={change.id}
                className={`operator-style-sample__queue-row${selectedChangeId === change.id ? " is-active" : ""}`}
                data-change-id={change.id}
                data-platform-foundation="base-ui-queue-row"
                aria-label={`${change.id} ${change.title}`}
                aria-pressed={selectedChangeId === change.id}
                onClick={() => onSelectChange(change.id)}
              >
                <div className="operator-style-sample__queue-row-main" data-platform-compact-field="change">
                  <span className="operator-style-live__compact-label" data-platform-compact-label>
                    Change
                  </span>
                  <strong>{change.title}</strong>
                  <p>{buildQueueSummary(change)}</p>
                </div>
                <div className="operator-style-sample__queue-row-meta">
                  <span>{change.id}</span>
                  <span>{repo?.name ?? change.tenantId}</span>
                  <span className="operator-style-live__compact-label" data-platform-compact-label>
                    Owner
                  </span>
                  <span>{change.owner.label}</span>
                  <span className="operator-style-live__compact-label" data-platform-compact-label>
                    Next step
                  </span>
                  <span>{change.nextAction}</span>
                  <span>{change.lastRunAgo}</span>
                </div>
                <span className={`operator-style-sample__queue-status operator-style-sample__queue-status--${queueStatus.tone}`}>
                  {queueStatus.label}
                </span>
              </PlatformPrimitives.Button>
            );
          })
        )}
      </div>
    </article>
  );
}

type SelectedChangeStageProps = {
  detail: ChangeDetailResponse | null;
  selectedRun: ChangeDetailResponse["runs"][number] | null;
  selectedRunId: string | null;
  selectedRunApprovals: OperatorWorkbenchProps["selectedRunApprovals"];
  selectedRunEvents: OperatorWorkbenchProps["selectedRunEvents"];
  compactViewport: boolean;
  activeTabId: OperatorWorkbenchProps["activeTabId"];
  isWorkflowDetailOpen: boolean;
  actionWorkflow: ReturnType<typeof useAsyncWorkflowCommandMachine>;
  onWorkflowDetailOpenChange: (open: boolean) => void;
  onRunNext: () => Promise<void>;
  onOpenRuns: () => void;
  onEscalate: () => Promise<void>;
  onBlockBySpec: () => Promise<void>;
  onDeleteChange: () => Promise<void>;
  onCreateClarificationRound: () => Promise<void>;
  onAnswerClarificationRound: OperatorWorkbenchProps["onAnswerClarificationRound"];
  onSelectRun: (runId: string) => void;
  onSelectTab: (tabId: OperatorWorkbenchProps["activeTabId"]) => void;
  onPromoteFact: (title: string, body: string) => Promise<void>;
  onApprovalDecision: OperatorWorkbenchProps["onApprovalDecision"];
  onClearSelectedRun: () => void;
};

function SelectedChangeStage({
  detail,
  selectedRun,
  selectedRunId,
  selectedRunApprovals,
  selectedRunEvents,
  compactViewport,
  activeTabId,
  isWorkflowDetailOpen,
  actionWorkflow,
  onWorkflowDetailOpenChange,
  onRunNext,
  onOpenRuns,
  onEscalate,
  onBlockBySpec,
  onDeleteChange,
  onCreateClarificationRound,
  onAnswerClarificationRound,
  onSelectRun,
  onSelectTab,
  onPromoteFact,
  onApprovalDecision,
  onClearSelectedRun,
}: SelectedChangeStageProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!detail) {
    return (
      <article className="operator-style-sample__panel operator-style-sample__detail-panel" data-platform-shell="detail-panel">
        <div className="operator-style-sample__detail-head">
          <div>
            <span className="operator-style-sample__eyebrow">Selected change</span>
            <h2>No change selected</h2>
            <p>Select a change from the queue to inspect backend-owned state.</p>
          </div>
        </div>
        <div className="empty-state">The queue remains live while the selected-change workspace is empty.</div>
      </article>
    );
  }

  const { change, runs } = detail;
  const openMandatoryGapCount = change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length;
  const timelineEntries = buildTimelineEntries(detail);
  const stageStatus = mapQueueStatus({
    id: change.id,
    tenantId: change.tenantId,
    title: change.title,
    subtitle: change.subtitle,
    state: change.state,
    owner: change.owner,
    nextAction: change.nextAction,
    blocker: change.blocker,
    loopCount: change.loopCount,
    lastRunAgo: change.lastRunAgo,
    verificationStatus: change.verificationStatus,
    mandatoryGapCount: openMandatoryGapCount,
  });
  const workflowSummary =
    activeTabId === "overview"
      ? "Overview, traceability, runs, gaps, evidence, git, chief, and clarifications"
      : `Expanded on ${activeTabId}`;

  return (
    <article className="operator-style-sample__panel operator-style-sample__detail-panel" data-platform-shell="detail-panel">
      <div className="operator-style-sample__detail-head">
        <div>
          <span className="operator-style-sample__eyebrow">Selected change</span>
          <h2>{change.title}</h2>
          <p>
            {change.id} / {change.owner.label}
          </p>
        </div>
        <span className={`operator-style-sample__status operator-style-sample__status--${stageStatus.tone}`}>
          {formatStateLabel(change.state)}
        </span>
      </div>

      {actionWorkflow.error ? (
        <div className="empty-state">
          <strong>Change command failed.</strong> {actionWorkflow.error}
        </div>
      ) : null}
      {actionWorkflow.isPending ? (
        <div className="empty-state">{actionWorkflow.activeLabel ?? "Operator command in progress."}</div>
      ) : null}

      <div className="operator-style-sample__detail-card">
        <div className="operator-style-sample__detail-stats">
          <div>
            <span>Run lineage</span>
            <strong>{selectedRun ? selectedRun.id : runs.length > 0 ? `${runs.length} runs ready` : "No run selected"}</strong>
          </div>
          <div>
            <span>Mandatory gaps</span>
            <strong>{openMandatoryGapCount > 0 ? `${openMandatoryGapCount} open` : "Clear"}</strong>
          </div>
          <div>
            <span>Next action</span>
            <strong>{change.nextAction}</strong>
          </div>
          <div>
            <span>Verification</span>
            <strong>{change.verificationStatus}</strong>
          </div>
        </div>
        <div className="operator-style-live__detail-action-cluster">
          <PlatformPrimitives.Button
            type="button"
            className="primary-button"
            data-platform-action="run-next-step"
            data-platform-hierarchy="primary"
            disabled={actionWorkflow.isPending}
            onClick={() =>
              actionWorkflow.runCommand({
                label: "Run next step",
                execute: onRunNext,
              })
            }
          >
            Run next step
          </PlatformPrimitives.Button>
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button"
            data-platform-action="open-run-studio"
            aria-controls="run-studio"
            onClick={onOpenRuns}
            disabled={actionWorkflow.isPending || runs.length === 0}
            title={runs.length === 0 ? "Generate or select a backend-owned run before opening Run Studio." : undefined}
          >
            Open run studio
          </PlatformPrimitives.Button>
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button"
            data-platform-action="escalate-change"
            disabled={actionWorkflow.isPending}
            onClick={() =>
              actionWorkflow.runCommand({
                label: "Escalate change",
                execute: onEscalate,
              })
            }
          >
            Escalate
          </PlatformPrimitives.Button>
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button"
            data-platform-action="block-by-spec"
            disabled={actionWorkflow.isPending}
            onClick={() =>
              actionWorkflow.runCommand({
                label: "Mark blocked by spec",
                execute: onBlockBySpec,
              })
            }
          >
            Mark blocked by spec
          </PlatformPrimitives.Button>
          <PlatformPrimitives.AlertDialog.Root
            open={isDeleteDialogOpen}
            onOpenChange={(open) => {
              if (!actionWorkflow.isPending) {
                setIsDeleteDialogOpen(open);
              }
            }}
          >
            <PlatformPrimitives.AlertDialog.Trigger
              type="button"
              className="destructive-button"
              data-platform-action="delete-change"
              disabled={actionWorkflow.isPending}
            >
              Delete change
            </PlatformPrimitives.AlertDialog.Trigger>
            <PlatformPrimitives.AlertDialog.Portal>
              <PlatformPrimitives.AlertDialog.Backdrop className="modal-backdrop" />
              <PlatformPrimitives.AlertDialog.Viewport className="modal-viewport">
                <PlatformPrimitives.AlertDialog.Popup className="modal-popup">
                  <div className="dialog-stack">
                    <div className="dialog-header">
                      <div className="stack">
                        <p className="eyebrow">Destructive action</p>
                        <PlatformPrimitives.AlertDialog.Title>Delete {change.id}</PlatformPrimitives.AlertDialog.Title>
                        <PlatformPrimitives.AlertDialog.Description className="muted">
                          Removing this change also removes its runs, approvals, evidence, and clarification rounds from
                          backend-owned state.
                        </PlatformPrimitives.AlertDialog.Description>
                      </div>
                    </div>
                    <div className="stack">
                      <p className="muted">This action cannot be undone from the operator shell.</p>
                      <div className="dialog-actions">
                        <PlatformPrimitives.AlertDialog.Close
                          type="button"
                          className="ghost-button"
                          disabled={actionWorkflow.isPending}
                        >
                          Cancel
                        </PlatformPrimitives.AlertDialog.Close>
                        <button
                          type="button"
                          className="destructive-button"
                          data-platform-action="confirm-delete-change"
                          disabled={actionWorkflow.isPending}
                          onClick={() =>
                            actionWorkflow.runCommand({
                              label: "Delete change",
                              execute: async () => {
                                await onDeleteChange();
                                setIsDeleteDialogOpen(false);
                              },
                            })
                          }
                        >
                          Delete change
                        </button>
                      </div>
                    </div>
                  </div>
                </PlatformPrimitives.AlertDialog.Popup>
              </PlatformPrimitives.AlertDialog.Viewport>
            </PlatformPrimitives.AlertDialog.Portal>
          </PlatformPrimitives.AlertDialog.Root>
        </div>
      </div>

      <div className="operator-style-sample__detail-block">
        <div className="operator-style-sample__detail-block-head">
          <h3>Operator note</h3>
          <span>Gate-aware summary</span>
        </div>
        <p>{change.summary}</p>
      </div>

      <div className="operator-style-sample__detail-block">
        <div className="operator-style-sample__detail-block-head">
          <h3>Timeline</h3>
          <span>Latest milestones</span>
        </div>
        {timelineEntries.length > 0 ? (
          <div className="operator-style-sample__timeline">
            {timelineEntries.slice(0, 4).map((entry) => (
              <div key={`${entry.title}-${entry.detail}`} className="operator-style-sample__timeline-row">
                <span className="operator-style-sample__timeline-dot" aria-hidden="true" />
                <div>
                  <strong>{entry.title}</strong>
                  <p>{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="operator-style-live__muted">No timeline milestones captured yet.</p>
        )}
      </div>

      {!runs.length ? (
        <p className="governance-note" data-platform-governance="run-studio-run-required">
          Run the change once before opening runtime details.
        </p>
      ) : null}

      <details
        className="operator-style-live__workflow-disclosure"
        open={isWorkflowDetailOpen}
        onToggle={(event) => onWorkflowDetailOpenChange((event.currentTarget as HTMLDetailsElement).open)}
        data-platform-surface="workflow-detail"
      >
        <summary className="operator-style-live__workflow-summary">
          <div>
            <strong>Workflow detail</strong>
            <span>{workflowSummary}</span>
          </div>
          <span>{isWorkflowDetailOpen ? "Collapse" : "Expand"}</span>
        </summary>
        <div className="operator-style-live__workflow-detail">
          <div className="operator-style-live__embedded-detail">
            <ChangeDetail
              activeTab={activeTabId}
              compactViewport={compactViewport}
              detail={detail}
              selectedRunId={selectedRunId}
              onRunNext={onRunNext}
              onOpenRuns={onOpenRuns}
              onEscalate={onEscalate}
              onBlockBySpec={onBlockBySpec}
              onDeleteChange={onDeleteChange}
              onCreateClarificationRound={onCreateClarificationRound}
              onAnswerClarificationRound={onAnswerClarificationRound}
              onSelectRun={onSelectRun}
              onSelectTab={onSelectTab}
              onPromoteFact={onPromoteFact}
            />
          </div>
          {selectedRun ? (
            <div className="operator-style-live__embedded-run-studio">
              <RunStudio
                run={selectedRun}
                events={selectedRunEvents}
                approvals={selectedRunApprovals}
                onApprovalDecision={onApprovalDecision}
                onClose={onClearSelectedRun}
              />
            </div>
          ) : null}
        </div>
      </details>
    </article>
  );
}

type RepositoryCatalogListPanelProps = {
  entries: RepositoryCatalogEntry[];
  selectedTenantId: string | null;
  activeFilterId: RepositoryCatalogFilterId;
  isSelectionPending: boolean;
  selectionPendingLabel: string | null;
  selectionError: string | null;
  searchQuery: string;
  onSelectFilter: (filterId: RepositoryCatalogFilterId) => void;
  onSelectTenant: (tenantId: string) => void;
  onOpenCreateTenant: () => void;
};

function RepositoryCatalogListPanel({
  entries,
  selectedTenantId,
  activeFilterId,
  isSelectionPending,
  selectionPendingLabel,
  selectionError,
  searchQuery,
  onSelectFilter,
  onSelectTenant,
  onOpenCreateTenant,
}: RepositoryCatalogListPanelProps) {
  return (
    <article className="operator-style-sample__panel operator-style-sample__queue-panel" data-platform-surface="repository-catalog">
      <div className="operator-style-sample__queue-toolbar" data-platform-surface="repository-catalog-filter-context">
        <div className="operator-style-sample__queue-search">
          <span>Search</span>
          <div className="operator-style-live__queue-readout">{searchQuery.trim() || "No active search query"}</div>
        </div>
        <div className="operator-style-sample__queue-filters">
          {REPOSITORY_CATALOG_FILTERS.map((filter) => (
            <PlatformPrimitives.Button
              key={filter.id}
              type="button"
              className={`operator-style-live__queue-pill ${activeFilterId === filter.id ? "is-active" : ""}`}
              onClick={() => onSelectFilter(filter.id)}
            >
              <span>{filter.label}</span>
            </PlatformPrimitives.Button>
          ))}
        </div>
      </div>

      <div className="operator-style-live__queue-context">
        <div>
          <strong>{selectedTenantId ?? "No repository selected"}</strong>
          <span>Select a repository to inspect workload and move back into queue work.</span>
        </div>
        <PlatformPrimitives.Button
          type="button"
          className="ghost-button operator-style-live__queue-clear"
          data-platform-action="new-repository"
          onClick={onOpenCreateTenant}
        >
          New repository
        </PlatformPrimitives.Button>
      </div>

      <div className="operator-style-sample__queue-table">
        {selectionError ? (
          <p className="governance-note" data-platform-governance="catalog-selection-error">
            <strong>Repository selection failed.</strong> {selectionError}
          </p>
        ) : null}
        {isSelectionPending ? (
          <p className="governance-note" data-platform-governance="catalog-selection-pending">
            {selectionPendingLabel ?? "Opening repository workspace..."}
          </p>
        ) : null}
        {entries.length === 0 ? (
          <div className="empty-state">
            No repositories match the current slice. Clear search or register a new repository.
          </div>
        ) : (
          entries.map((entry) => {
            const statusTone = mapRepositoryStatus(entry.attentionState);
            return (
              <PlatformPrimitives.Button
                key={entry.tenantId}
                className={`operator-style-sample__queue-row${selectedTenantId === entry.tenantId ? " is-active" : ""}`}
                data-platform-foundation="base-ui-repository-row"
                data-tenant-id={entry.tenantId}
                aria-pressed={selectedTenantId === entry.tenantId}
                disabled={isSelectionPending}
                onClick={() => onSelectTenant(entry.tenantId)}
              >
                <div className="operator-style-sample__queue-row-main" data-platform-compact-field="repository">
                  <span className="operator-style-live__compact-label" data-platform-compact-label>
                    Repository
                  </span>
                  <strong>{entry.name}</strong>
                  <p>{entry.description || "No repository description yet."}</p>
                </div>
                <div className="operator-style-sample__queue-row-meta">
                  <span className="operator-style-live__compact-label" data-platform-compact-label>
                    Recent
                  </span>
                  <span>{entry.repoPath}</span>
                  <span>{entry.lastActivity}</span>
                  <span className="operator-style-live__compact-label" data-platform-compact-label>
                    Next
                  </span>
                  <span>{entry.nextRecommendedAction}</span>
                </div>
                <span className={`operator-style-sample__queue-status operator-style-sample__queue-status--${statusTone}`}>
                  {formatAttentionLabel(entry.attentionState)}
                </span>
              </PlatformPrimitives.Button>
            );
          })
        )}
      </div>
    </article>
  );
}

type SelectedRepositoryStageProps = {
  entry: RepositoryCatalogEntry | null;
  onOpenQueue: () => void;
  onCreateChange: () => void;
  onOpenCreateTenant: () => void;
};

function SelectedRepositoryStage({ entry, onOpenQueue, onCreateChange, onOpenCreateTenant }: SelectedRepositoryStageProps) {
  if (!entry) {
    return (
      <article className="operator-style-sample__panel operator-style-sample__detail-panel" data-platform-surface="repository-profile">
        <div className="operator-style-sample__detail-head">
          <div>
            <span className="operator-style-sample__eyebrow">Selected repository</span>
            <h2>No repository selected</h2>
            <p>Choose a repository from the catalog to inspect workload and next steps.</p>
          </div>
        </div>
        <div className="empty-state">
          Repository catalog management stays backend-owned. Start by selecting an existing repository or registering a
          new one.
          <div className="empty-state-actions">
            <button type="button" className="ghost-button" onClick={onOpenCreateTenant}>
              New repository
            </button>
          </div>
        </div>
      </article>
    );
  }

  const readyPercent = percent(entry.readyChangeCount, entry.changeCount);
  const blockedPercent = percent(entry.blockedChangeCount, entry.changeCount);
  const primaryActionLabel = entry.changeCount === 0 ? "Create first change" : "Open queue";
  const statusTone = mapRepositoryStatus(entry.attentionState);

  return (
    <article className="operator-style-sample__panel operator-style-sample__detail-panel" data-platform-surface="repository-profile">
      <div className="operator-style-sample__detail-head">
        <div>
          <span className="operator-style-sample__eyebrow">Selected repository</span>
          <h2>{entry.name}</h2>
          <p>{entry.repoPath}</p>
        </div>
        <span className={`operator-style-sample__status operator-style-sample__status--${statusTone}`}>
          {formatAttentionLabel(entry.attentionState)}
        </span>
      </div>

      <div className="operator-style-sample__detail-card">
        <div className="operator-style-sample__detail-stats">
          <div>
            <span>Changes</span>
            <strong>{entry.changeCount}</strong>
          </div>
          <div>
            <span>Ready</span>
            <strong>{entry.readyChangeCount}</strong>
          </div>
          <div>
            <span>Blocked</span>
            <strong>{entry.blockedChangeCount}</strong>
          </div>
          <div>
            <span>Active</span>
            <strong>{entry.activeChangeCount}</strong>
          </div>
        </div>
        <div className="operator-style-live__detail-action-cluster">
          <button type="button" className="primary-button" onClick={entry.changeCount === 0 ? onCreateChange : onOpenQueue}>
            {primaryActionLabel}
          </button>
          <button type="button" className="ghost-button" onClick={onCreateChange}>
            New change
          </button>
        </div>
      </div>

      <div className="operator-style-sample__detail-block">
        <div className="operator-style-sample__detail-block-head">
          <h3>Repository note</h3>
          <span>Backend-owned context</span>
        </div>
        <p>{entry.description || "No repository description yet."}</p>
      </div>

      <div className="operator-style-sample__detail-block">
        <div className="operator-style-sample__detail-block-head">
          <h3>Current pressure</h3>
          <span>Live portfolio signals</span>
        </div>
        <div className="operator-style-live__repository-bars">
          <RepositoryBar label="Ready" percent={readyPercent} tone="blue" />
          <RepositoryBar label="Blocked" percent={blockedPercent} tone="amber" />
        </div>
      </div>

      <div className="operator-style-sample__detail-block">
        <div className="operator-style-sample__detail-block-head">
          <h3>Featured change</h3>
          <span>Queue handoff</span>
        </div>
        {entry.featuredChange ? (
          <div className="operator-style-live__featured-change">
            <strong>{entry.featuredChange.id}</strong>
            <p>{entry.featuredChange.title}</p>
            <span>
              {entry.featuredChange.state} · {entry.featuredChange.nextAction}
            </span>
          </div>
        ) : (
          <div className="empty-state">This repository has no change history yet. Create the first change to begin queue work.</div>
        )}
      </div>
    </article>
  );
}

function MetricCard({ metric }: { metric: MetricCardModel }) {
  return (
    <article className="operator-style-sample__metric-card">
      <div className="operator-style-sample__metric-header">
        <span className="operator-style-sample__eyebrow">{metric.label}</span>
        <span className={`operator-style-sample__metric-icon operator-style-sample__metric-icon--${metric.tone}`} aria-hidden="true" />
      </div>
      <div className="operator-style-sample__metric-body">
        <strong>{metric.value}</strong>
        <p>{metric.meta}</p>
      </div>
      <Sparkline values={metric.trend} tone={metric.tone} />
    </article>
  );
}

function Sparkline({ values, tone }: { values: number[]; tone: ReferenceTone }) {
  const path = buildSparklinePath(values);

  return (
    <svg className={`operator-style-sample__sparkline operator-style-live__sparkline--${tone}`} viewBox="0 0 160 42" aria-hidden="true" focusable="false">
      <path className="operator-style-sample__sparkline-area" d={`${path} L 160 42 L 0 42 Z`} />
      <path className="operator-style-sample__sparkline-line" d={path} />
    </svg>
  );
}

function PressureDonut({ items }: { items: RingItem[] }) {
  const gradientStops = items.map((item, index) => {
    const step = 100 / Math.max(items.length, 1);
    const start = index * step;
    const end = start + step;
    return `${item.color} ${start}% ${end}%`;
  }).join(", ");
  const total = items.reduce((sum, item) => sum + Number(item.value), 0);

  return (
    <div className="operator-style-sample__donut" aria-hidden="true" style={{ backgroundImage: `conic-gradient(${gradientStops})` }}>
      <div className="operator-style-sample__donut-core">
        <span>Focus</span>
        <strong>{total}</strong>
      </div>
    </div>
  );
}

function ExecutionLaneRow({ lane }: { lane: ExecutionLane }) {
  return (
    <div className="operator-style-sample__lane">
      <div className="operator-style-sample__lane-header">
        <span>{lane.label}</span>
        <strong>{lane.detail}</strong>
      </div>
      <div className="operator-style-sample__lane-track">
        <span
          className={`operator-style-sample__lane-fill operator-style-sample__lane-fill--${lane.tone}`}
          style={{ width: `${Math.max(lane.percent, 10)}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function RepositoryOverviewCard({
  entry,
  active,
  onSelect,
}: {
  entry: RepositoryCatalogEntry;
  active: boolean;
  onSelect: () => void;
}) {
  const statusTone = mapRepositoryStatus(entry.attentionState);
  return (
    <PlatformPrimitives.Button
      type="button"
      className={`operator-style-sample__repository-card${active ? " operator-style-live__repository-card--active" : ""}`}
      data-tenant-id={entry.tenantId}
      aria-label={`${entry.name} repository overview`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <div className="operator-style-sample__repository-head">
        <div>
          <h3>{entry.name}</h3>
          <p>{entry.repoPath}</p>
        </div>
        <span className={`operator-style-sample__status operator-style-sample__status--${statusTone}`}>
          {formatAttentionLabel(entry.attentionState)}
        </span>
      </div>
      <div className="operator-style-sample__repository-metrics">
        <div>
          <span>Changes</span>
          <strong>{entry.changeCount}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{entry.activeChangeCount}</strong>
        </div>
      </div>
      <div className="operator-style-live__repository-bars">
        <RepositoryBar label="Ready" percent={percent(entry.readyChangeCount, entry.changeCount)} tone="blue" />
        <RepositoryBar label="Blocked" percent={percent(entry.blockedChangeCount, entry.changeCount)} tone="amber" />
      </div>
      <p className="operator-style-sample__repository-foot">{entry.nextRecommendedAction}</p>
      <span className="operator-style-live__repository-featured">
        {entry.featuredChange
          ? `${entry.featuredChange.id} · ${entry.featuredChange.title}`
          : "Create the first change to start this repository workspace."}
      </span>
    </PlatformPrimitives.Button>
  );
}

function RepositoryBar({ label, percent, tone }: { label: string; percent: number; tone: "blue" | "amber" }) {
  return (
    <div className="operator-style-sample__repository-bar">
      <span>{label}</span>
      <div className="operator-style-sample__bar-track">
        <span className={`operator-style-sample__bar-fill operator-style-sample__bar-fill--${tone}`} style={{ width: `${Math.max(percent, 8)}%` }} aria-hidden="true" />
      </div>
    </div>
  );
}

function buildMetricCards({
  activeWorkspaceMode,
  activeTenantName,
  activeViewLabel,
  activeViewCount,
  detail,
  filteredRepositoryCatalog,
  repositoryCatalog,
}: {
  activeWorkspaceMode: OperatorWorkspaceMode;
  activeTenantName: string;
  activeViewLabel: string;
  activeViewCount: number;
  detail: ChangeDetailResponse | null;
  filteredRepositoryCatalog: RepositoryCatalogEntry[];
  repositoryCatalog: RepositoryCatalogEntry[];
}): MetricCardModel[] {
  const blockedRepositoryCount = repositoryCatalog.filter((entry) => entry.attentionState === "blocked").length;
  const activeRepositoryCount = repositoryCatalog.filter((entry) => entry.attentionState === "active").length;
  const totalChangeCount = repositoryCatalog.reduce((sum, entry) => sum + entry.changeCount, 0);
  const mandatoryGapCount = detail?.change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length ?? 0;
  const clarificationCount = detail?.clarificationRounds.length ?? 0;
  const runCount = detail?.runs.length ?? 0;
  const repoCount = activeWorkspaceMode === "catalog" ? filteredRepositoryCatalog.length : repositoryCatalog.length;

  return [
    {
      label: "Repositories",
      value: String(repoCount),
      meta: blockedRepositoryCount > 0 ? `${blockedRepositoryCount} need operator attention` : `Tracking ${activeTenantName}`,
      tone: "blue",
      trend: buildTrendSeries(repoCount, blockedRepositoryCount, activeRepositoryCount),
    },
    {
      label: activeWorkspaceMode === "catalog" ? "Fleet changes" : "Visible queue",
      value: String(activeWorkspaceMode === "catalog" ? totalChangeCount : activeViewCount),
      meta: activeWorkspaceMode === "catalog" ? "Tracked across the backend catalog" : `Slice ${activeViewLabel}`,
      tone: "violet",
      trend: buildTrendSeries(totalChangeCount, activeViewCount, blockedRepositoryCount),
    },
    {
      label: "Active runs",
      value: String(runCount),
      meta: clarificationCount > 0 ? `${clarificationCount} clarification rounds recorded` : "No clarification backlog selected",
      tone: "emerald",
      trend: buildTrendSeries(runCount, clarificationCount, activeRepositoryCount),
    },
    {
      label: "SLA risk",
      value: String(mandatoryGapCount),
      meta: mandatoryGapCount > 0 ? `${mandatoryGapCount} mandatory gaps still open` : "No mandatory blockers in focus",
      tone: "amber",
      trend: buildTrendSeries(mandatoryGapCount, blockedRepositoryCount, clarificationCount),
    },
  ];
}

function buildPressureItems(repositoryCatalog: RepositoryCatalogEntry[]): RingItem[] {
  const blocked = repositoryCatalog.filter((entry) => entry.attentionState === "blocked").length;
  const active = repositoryCatalog.filter((entry) => entry.attentionState === "active").length;
  const needsSetup = repositoryCatalog.filter((entry) => entry.attentionState === "needs_setup").length;
  const quiet = repositoryCatalog.filter((entry) => entry.attentionState === "quiet").length;

  return [
    { label: "Active", value: String(active), color: DONUT_COLORS.blue },
    { label: "Blocked", value: String(blocked), color: DONUT_COLORS.amber },
    { label: "Needs setup", value: String(needsSetup), color: DONUT_COLORS.violet },
    { label: "Quiet", value: String(quiet), color: DONUT_COLORS.emerald },
  ];
}

function buildExecutionLanes({
  activeViewCount,
  detail,
  filteredChangeCount,
}: {
  activeViewCount: number;
  detail: ChangeDetailResponse | null;
  filteredChangeCount: number;
}): ExecutionLane[] {
  const runCount = detail?.runs.length ?? 0;
  const clarificationCount = detail?.clarificationRounds.length ?? 0;
  const mandatoryGapCount = detail?.change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length ?? 0;
  const denominator = Math.max(filteredChangeCount, runCount, clarificationCount, mandatoryGapCount, 1);

  return [
    {
      label: "Queue slice",
      detail: `${activeViewCount} visible changes`,
      tone: "blue",
      percent: percent(activeViewCount, denominator),
    },
    {
      label: "Run lineage",
      detail: runCount > 0 ? `${runCount} runs captured` : "No runs selected",
      tone: "violet",
      percent: percent(runCount, denominator),
    },
    {
      label: "Clarifications",
      detail: clarificationCount > 0 ? `${clarificationCount} rounds open` : "No clarification backlog",
      tone: "emerald",
      percent: percent(clarificationCount, denominator),
    },
    {
      label: "Mandatory gaps",
      detail: mandatoryGapCount > 0 ? `${mandatoryGapCount} still open` : "No mandatory blockers",
      tone: "amber",
      percent: percent(mandatoryGapCount, denominator),
    },
  ];
}

function buildTimelineEntries(detail: ChangeDetailResponse | null) {
  if (!detail) {
    return [];
  }

  if (detail.change.timeline.length > 0) {
    return detail.change.timeline.map((entry) => ({
      title: entry.title,
      detail: entry.note,
    }));
  }

  return detail.change.chiefHistory.map((entry) => ({
    title: entry.title,
    detail: `${entry.at} · ${entry.note}`,
  }));
}

function buildTrendSeries(primary: number, secondary: number, tertiary: number) {
  const first = Math.max(primary - secondary, 0);
  const second = Math.max(primary - tertiary, 0);
  const third = Math.max(primary, 0);
  const fourth = Math.max(primary + secondary, 0);

  return [first, second, third, second, third, fourth, Math.max(fourth - tertiary, 0), third].map((value) => value || 1);
}

function buildSparklinePath(values: number[]) {
  if (values.length === 0) {
    return "";
  }

  const width = 160;
  const height = 42;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildQueueSummary(change: ChangeSummary) {
  return `${change.subtitle} Next: ${change.nextAction}. Blocker: ${change.blocker}`;
}

function mapQueueStatus(change: ChangeSummary | ChangeDetailResponse["change"]) {
  const normalizedState = change.state.toLowerCase();
  const normalizedBlocker = change.blocker.toLowerCase();

  if (normalizedState.includes("blocked") || normalizedBlocker.includes("blocked")) {
    return { tone: "blocked", label: "blocked" };
  }
  if (
    normalizedState.includes("run") ||
    normalizedState.includes("active") ||
    normalizedState.includes("execut") ||
    normalizedState.includes("progress")
  ) {
    return { tone: "running", label: "running" };
  }
  return { tone: "review", label: formatStateLabel(change.state) };
}

function mapRepositoryStatus(attentionState: RepositoryCatalogEntry["attentionState"]) {
  switch (attentionState) {
    case "blocked":
      return "blocked";
    case "needs_setup":
      return "attention";
    case "quiet":
      return "ready";
    default:
      return "ready";
  }
}

function sortRepositoryOverview(repositoryCatalog: RepositoryCatalogEntry[], activeTenantId: string) {
  const priority = {
    blocked: 0,
    active: 1,
    needs_setup: 2,
    quiet: 3,
  } as const;

  return [...repositoryCatalog].sort((left, right) => {
    if (left.tenantId === activeTenantId) {
      return -1;
    }
    if (right.tenantId === activeTenantId) {
      return 1;
    }
    const stateDelta = priority[left.attentionState] - priority[right.attentionState];
    if (stateDelta !== 0) {
      return stateDelta;
    }
    return right.changeCount - left.changeCount;
  });
}

function percent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function formatAttentionLabel(attentionState: RepositoryCatalogEntry["attentionState"]) {
  switch (attentionState) {
    case "needs_setup":
      return "Needs setup";
    case "blocked":
      return "Blocked";
    case "quiet":
      return "Quiet";
    default:
      return "Active";
  }
}
