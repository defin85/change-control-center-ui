import { type ReactNode, useEffect, useMemo, useState } from "react";

import { ChangeDetail } from "../../components/ChangeDetail";
import { QueuePanel } from "../../components/QueuePanel";
import { RunDetailPanel } from "../../components/RunDetailPanel";
import { RunsWorkspacePanel } from "../../components/RunsWorkspacePanel";
import type { RepositoryCatalogEntry } from "../../types";
import type { OperatorWorkspaceMode } from "../navigation";
import { PlatformPrimitives } from "../foundation";
import { buildViewCounts, filterRepositoryCatalog, describeFilter, OPERATOR_FILTERS } from "../server-state";
import type { RepositoryCatalogFilterId } from "../server-state/filtering";
import { RepositoryCatalogWorkspaceShell } from "../shells/RepositoryCatalogWorkspaceShell";
import { DetailWorkspaceShell } from "../shells/DetailWorkspaceShell";
import { RunDetailWorkspaceShell } from "../shells/RunDetailWorkspaceShell";
import { WorkspacePageShell } from "../shells/WorkspacePageShell";
import { StatusBadge } from "../shells/StatusBadge";
import { useAsyncWorkflowCommandMachine } from "../workflow";
import { RepositoryAuthoringDialog } from "./RepositoryAuthoringDialog";
import { RepositoryCatalogPanel } from "./RepositoryCatalogPanel";
import { RepositoryCatalogProfile } from "./RepositoryCatalogProfile";
import { WorkbenchHeader } from "./WorkbenchHeader";
import { WorkbenchStatusStrip } from "./WorkbenchStatusStrip";
import type { OperatorWorkbenchProps } from "./types";

type OperatorWorkbenchStateProps = {
  message: string;
  tone: "loading" | "error";
};

export function OperatorWorkbenchState({ message, tone }: OperatorWorkbenchStateProps) {
  return (
    <WorkspacePageShell
      header={<header className="topbar" />}
      workspace={
        <div className={tone === "error" ? "error-card" : "loading-card"} data-platform-surface="operator-workbench-state">
          {message}
        </div>
      }
    />
  );
}

export function OperatorWorkbench({
  bootstrap,
  activeWorkspaceMode,
  activeRunSlice,
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
  runsWorkspaceEntries,
  selectedRunApprovals,
  selectedRunEvents,
  realtimeNotice,
  toast,
  onSearchQueryChange,
  onWorkspaceModeChange,
  onRunSliceChange,
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
  const catalogSelectionWorkflow = useAsyncWorkflowCommandMachine();
  const activeViewLabel = bootstrap.views.find((view) => view.id === activeViewId)?.label ?? "Inbox";
  const activeFilter = describeFilter(activeFilterId);
  const viewCounts = buildViewCounts(bootstrap.views, changes);
  const filteredRepositoryCatalog = filterRepositoryCatalog(repositoryCatalog, {
    activeFilterId: activeRepositoryCatalogFilterId,
    searchQuery,
  });
  const activeRepositoryCatalogEntry = repositoryCatalog.find((entry) => entry.tenantId === activeTenantId) ?? null;
  const repositoryOverviewEntries = useMemo(() => {
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
  }, [activeTenantId, repositoryCatalog]);
  const selectedRun = detail?.runs.find((run) => run.id === selectedRunId) ?? null;
  const selectedRunChange = useMemo(() => {
    if (!detail) {
      return null;
    }
    const mandatoryGapCount = detail.change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length;
    return {
      id: detail.change.id,
      tenantId: detail.change.tenantId,
      title: detail.change.title,
      subtitle: detail.change.subtitle,
      state: detail.change.state,
      owner: detail.change.owner,
      nextAction: detail.change.nextAction,
      blocker: detail.change.blocker,
      loopCount: detail.change.loopCount,
      lastRunAgo: detail.change.lastRunAgo,
      verificationStatus: detail.change.verificationStatus,
      mandatoryGapCount,
    };
  }, [detail]);
  const isDetailWorkspaceOpen = Boolean(selectedChangeId) && dismissedChangeId !== selectedChangeId;
  const isRunWorkspaceOpen = Boolean(selectedRunId);
  const isRepositoryCatalogWorkspaceOpen = Boolean(activeRepositoryCatalogEntry) && hasExplicitCatalogSelection;
  const hasVisibleContextualPrimaryAction = Boolean(selectedChangeId) && (!isCompactViewport || isDetailWorkspaceOpen);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1080px)");
    const handleChange = (event: MediaQueryListEvent) => setIsCompactViewport(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  function handleWorkspaceSelection(changeId: string | null) {
    setDismissedChangeId(null);
    onSelectChange(changeId);
  }

  function handleCatalogSelection(tenantId: string) {
    if (tenantId === activeTenantId && hasExplicitCatalogSelection) {
      catalogSelectionWorkflow.clearError();
      return;
    }
    catalogSelectionWorkflow.runCommand({
      label: `Open repository ${repositoryCatalog.find((entry) => entry.tenantId === tenantId)?.name ?? tenantId}`,
      execute: async () => {
        await onSelectCatalogTenant(tenantId);
      },
    });
  }

  function handleCloseWorkspace() {
    setDismissedChangeId(selectedChangeId);
  }

  function handleCloseCatalogWorkspace() {
    catalogSelectionWorkflow.clearError();
    onClearCatalogSelection();
  }

  function handleWorkspaceModeChange(workspaceMode: OperatorWorkspaceMode) {
    if (workspaceMode !== "catalog") {
      catalogSelectionWorkflow.clearError();
    }
    onWorkspaceModeChange(workspaceMode);
  }

  async function handleCreateChangeFromCatalog() {
    await onCreateChange();
    handleWorkspaceModeChange("queue");
  }

  const showRunDetail = Boolean(selectedRunId);
  const runDetailPanel = (
    <RunDetailPanel
      panelId="selected-run-detail"
      run={selectedRun}
      change={selectedRunChange}
      events={selectedRunEvents}
      approvals={selectedRunApprovals}
      closeLabel={activeWorkspaceMode === "runs" ? "Back to runs" : "Back to change detail"}
      onApprovalDecision={onApprovalDecision}
      onClose={onClearSelectedRun}
      onOpenChange={activeWorkspaceMode === "runs" && selectedChangeId ? () => handleWorkspaceModeChange("queue") : null}
    />
  );
  const detailWorkspace = (
    <DetailWorkspaceShell
      isCompactViewport={false}
      isOpen={Boolean(selectedChangeId)}
      selectedChangeId={selectedChangeId}
      onClose={handleCloseWorkspace}
      detail={
        <ChangeDetail
          activeTab={activeTabId}
          compactViewport={false}
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
      }
      runInspection={
        showRunDetail ? runDetailPanel : null
      }
    />
  );
  const repositoryWorkspace = (
    <RepositoryCatalogWorkspaceShell
      isCompactViewport={false}
      isOpen={Boolean(activeRepositoryCatalogEntry)}
      selectedTenantId={activeTenantId}
      onClose={handleCloseCatalogWorkspace}
      detail={
        <RepositoryCatalogProfile
          entry={activeRepositoryCatalogEntry}
          onOpenQueue={() => handleWorkspaceModeChange("queue")}
          onCreateChange={handleCreateChangeFromCatalog}
          onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
        />
      }
    />
  );
  const workspace = activeWorkspaceMode === "catalog"
    ? (
      <div className="workbench-page" data-platform-surface="repository-catalog-workbench">
        <WorkbenchStatusStrip
          activeWorkspaceMode={activeWorkspaceMode}
          activeRunSlice={activeRunSlice}
          activeTenantRepoPath={activeTenantRepoPath}
          activeTenantName={activeRepositoryCatalogEntry?.name ?? activeTenantId}
          activeViewLabel={activeViewLabel}
          activeFilterLabel={activeFilter.label}
          searchQuery={searchQuery}
          detail={detail}
          filteredChangeCount={filteredChanges.length}
          repositoryCatalog={repositoryCatalog}
          runsWorkspaceEntries={runsWorkspaceEntries}
          selectedRunId={selectedRunId}
        />

        <WorkbenchSection title="Repositories">
          <div className="reference-paired-stage reference-paired-stage--catalog">
            <RepositoryCatalogPanel
              entries={filteredRepositoryCatalog}
              selectedTenantId={isCompactViewport && !hasExplicitCatalogSelection ? null : activeTenantId}
              activeFilterId={activeRepositoryCatalogFilterId}
              isSelectionPending={catalogSelectionWorkflow.isPending}
              selectionPendingLabel={catalogSelectionWorkflow.activeLabel}
              selectionError={catalogSelectionWorkflow.error}
              searchQuery={searchQuery}
              onSelectFilter={setActiveRepositoryCatalogFilterId}
              onSelectTenant={handleCatalogSelection}
              onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
            />
            {!isCompactViewport ? repositoryWorkspace : null}
          </div>
        </WorkbenchSection>
      </div>
    )
    : activeWorkspaceMode === "runs"
      ? (
        <div className="workbench-page" data-platform-surface="runs-workbench">
          <WorkbenchStatusStrip
            activeWorkspaceMode={activeWorkspaceMode}
            activeRunSlice={activeRunSlice}
            activeTenantRepoPath={activeTenantRepoPath}
            activeTenantName={activeRepositoryCatalogEntry?.name ?? activeTenantId}
            activeViewLabel={activeViewLabel}
            activeFilterLabel={activeFilter.label}
            searchQuery={searchQuery}
            detail={detail}
            filteredChangeCount={filteredChanges.length}
            repositoryCatalog={repositoryCatalog}
            runsWorkspaceEntries={runsWorkspaceEntries}
            selectedRunId={selectedRunId}
          />

          <WorkbenchSection title="Runs">
            <div className="reference-paired-stage" data-platform-surface="runs-detail-stage">
              <RunsWorkspacePanel
                entries={runsWorkspaceEntries}
                activeRunSlice={activeRunSlice}
                searchQuery={searchQuery}
                selectedRunId={selectedRunId}
                onRunSliceChange={onRunSliceChange}
                onSelectRun={onSelectRun}
                onClearSelection={onClearSelectedRun}
              />
              {!isCompactViewport ? (
                <RunDetailWorkspaceShell
                  isCompactViewport={false}
                  isOpen={isRunWorkspaceOpen}
                  selectedRunId={selectedRunId}
                  onClose={onClearSelectedRun}
                  detail={runDetailPanel}
                />
              ) : null}
            </div>
          </WorkbenchSection>
        </div>
      )
    : (
      <div className="workbench-page" data-platform-surface="operator-workbench">
        <WorkbenchStatusStrip
          activeWorkspaceMode={activeWorkspaceMode}
          activeRunSlice={activeRunSlice}
          activeTenantRepoPath={activeTenantRepoPath}
          activeTenantName={activeRepositoryCatalogEntry?.name ?? activeTenantId}
          activeViewLabel={activeViewLabel}
          activeFilterLabel={activeFilter.label}
          searchQuery={searchQuery}
          detail={detail}
          filteredChangeCount={filteredChanges.length}
          repositoryCatalog={repositoryCatalog}
          runsWorkspaceEntries={runsWorkspaceEntries}
          selectedRunId={selectedRunId}
        />

        <WorkbenchSection title="Repositories">
          <RepositoryOverviewGrid
            entries={repositoryOverviewEntries}
            activeTenantId={activeTenantId}
            onSelectTenant={onTenantChange}
          />
        </WorkbenchSection>

        <WorkbenchSection title="Live queue">
          <div className="reference-paired-stage" data-platform-surface="queue-detail-stage">
            <QueuePanel
              changes={filteredChanges}
              selectedChangeId={selectedChangeId}
              views={bootstrap.views}
              viewCounts={viewCounts}
              filters={OPERATOR_FILTERS.map((filter) => ({
                id: filter.id,
                label: filter.label,
                hint: filter.hint,
              }))}
              activeViewId={activeViewId}
              activeViewLabel={activeViewLabel}
              activeViewCount={activeViewCount}
              activeFilterId={activeFilterId}
              activeFilterLabel={activeFilter.label}
              searchQuery={searchQuery}
              onSearchQueryChange={onSearchQueryChange}
              onSelectView={onSelectView}
              onSelectFilter={onSelectFilter}
              onClearSelection={onClearSelection}
              onSelectChange={handleWorkspaceSelection}
            />
            {!isCompactViewport ? detailWorkspace : null}
          </div>
        </WorkbenchSection>
      </div>
    );

  return (
    <WorkspacePageShell
      header={
        <WorkbenchHeader
          activeWorkspaceMode={activeWorkspaceMode}
          activeTenantId={activeTenantId}
          canRunNext={Boolean(selectedChangeId)}
          hasVisibleContextualPrimaryAction={hasVisibleContextualPrimaryAction}
          realtimeNotice={realtimeNotice ?? null}
          searchQuery={searchQuery}
          tenants={bootstrap.tenants}
          onSearchQueryChange={onSearchQueryChange}
          onWorkspaceModeChange={handleWorkspaceModeChange}
          onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
          onCreateChange={onCreateChange}
          onRunNext={onGlobalRunNext}
          onTenantChange={onTenantChange}
        />
      }
      workspace={workspace}
      detailWorkspace={
        isCompactViewport
          ? (
            activeWorkspaceMode === "catalog" ? (
              <RepositoryCatalogWorkspaceShell
                isCompactViewport
                isOpen={isRepositoryCatalogWorkspaceOpen && Boolean(activeRepositoryCatalogEntry)}
                selectedTenantId={activeTenantId}
                onClose={handleCloseCatalogWorkspace}
                detail={
                  <RepositoryCatalogProfile
                    entry={activeRepositoryCatalogEntry}
                    onOpenQueue={() => handleWorkspaceModeChange("queue")}
                    onCreateChange={handleCreateChangeFromCatalog}
                    onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
                  />
                }
              />
            ) : activeWorkspaceMode === "runs" ? (
              <RunDetailWorkspaceShell
                isCompactViewport
                isOpen={isRunWorkspaceOpen}
                selectedRunId={selectedRunId}
                onClose={onClearSelectedRun}
                detail={runDetailPanel}
              />
            ) : (
              <DetailWorkspaceShell
                isCompactViewport
                isOpen={isDetailWorkspaceOpen && Boolean(selectedChangeId)}
                selectedChangeId={selectedChangeId}
                onClose={handleCloseWorkspace}
                detail={
                  <ChangeDetail
                    activeTab={activeTabId}
                    compactViewport
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
                }
                runInspection={showRunDetail ? runDetailPanel : null}
              />
            )
          )
          : null
      }
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

type WorkbenchSectionProps = {
  title: string;
  children: ReactNode;
};

function WorkbenchSection({ title, children }: WorkbenchSectionProps) {
  return (
    <section className="reference-section">
      <div className="reference-section-heading">
        <h2>{title}</h2>
        <div className="reference-section-rule" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

type RepositoryOverviewGridProps = {
  entries: RepositoryCatalogEntry[];
  activeTenantId: string;
  onSelectTenant: (tenantId: string) => Promise<void>;
};

function RepositoryOverviewGrid({ entries, activeTenantId, onSelectTenant }: RepositoryOverviewGridProps) {
  return (
    <div className="reference-repository-grid" data-platform-surface="repository-overview">
      {entries.map((entry) => {
        const total = Math.max(entry.changeCount, 1);
        const readyPercent = Math.round((entry.readyChangeCount / total) * 100);
        const blockedPercent = Math.round((entry.blockedChangeCount / total) * 100);

        return (
          <PlatformPrimitives.Button
            key={entry.tenantId}
            type="button"
            className={`reference-repository-card ${entry.tenantId === activeTenantId ? "active" : ""}`}
            data-tenant-id={entry.tenantId}
            aria-label={`${entry.name} repository overview`}
            aria-pressed={entry.tenantId === activeTenantId}
            onClick={() => {
              if (entry.tenantId !== activeTenantId) {
                void onSelectTenant(entry.tenantId);
              }
            }}
          >
            <div className="reference-repository-head">
              <div>
                <h3>{entry.name}</h3>
                <p>{entry.repoPath}</p>
              </div>
              <StatusBadge status={entry.attentionState} label={formatAttentionLabel(entry.attentionState)} />
            </div>
            <div className="reference-repository-metrics">
              <div>
                <span>Changes</span>
                <strong>{entry.changeCount}</strong>
              </div>
              <div>
                <span>Active</span>
                <strong>{entry.activeChangeCount}</strong>
              </div>
            </div>
            <div className="reference-repository-bars">
              <RepositoryBar label="Ready" percent={readyPercent} tone="blue" />
              <RepositoryBar label="Blocked" percent={blockedPercent} tone="amber" />
            </div>
            <p className="reference-repository-foot">{entry.nextRecommendedAction}</p>
            <span className="reference-repository-featured">
              {entry.featuredChange
                ? `${entry.featuredChange.id} · ${entry.featuredChange.title}`
                : "Create the first change to start this repository workspace."}
            </span>
          </PlatformPrimitives.Button>
        );
      })}
    </div>
  );
}

type RepositoryBarProps = {
  label: string;
  percent: number;
  tone: "amber" | "blue";
};

function RepositoryBar({ label, percent, tone }: RepositoryBarProps) {
  return (
    <div className="reference-repository-bar">
      <span>{label}</span>
      <div className="reference-repository-bar-track">
        <span className={`reference-repository-bar-fill reference-repository-bar-fill--${tone}`} style={{ width: `${Math.max(percent, 8)}%` }} aria-hidden="true" />
      </div>
    </div>
  );
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
