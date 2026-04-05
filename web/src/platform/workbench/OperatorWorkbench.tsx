import { type ReactNode, useEffect, useState } from "react";

import { ChangeDetail } from "../../components/ChangeDetail";
import { OperatorRail } from "../../components/OperatorRail";
import { QueuePanel } from "../../components/QueuePanel";
import { RunStudio } from "../../components/RunStudio";
import type {
  ApprovalRecord,
  BootstrapResponse,
  ChangeDetailResponse,
  ChangeSummary,
  ChangeDetailTabId,
  ClarificationAnswer,
  RepositoryCatalogEntry,
  RuntimeEvent,
} from "../../types";
import type { OperatorWorkspaceMode } from "../navigation";
import { buildViewCounts, filterRepositoryCatalog, describeFilter, describeView } from "../server-state";
import type { RepositoryCatalogFilterId } from "../server-state/filtering";
import { RepositoryCatalogWorkspaceShell } from "../shells/RepositoryCatalogWorkspaceShell";
import { DetailWorkspaceShell } from "../shells/DetailWorkspaceShell";
import { MasterDetailShell } from "../shells/MasterDetailShell";
import { WorkspacePageShell } from "../shells/WorkspacePageShell";
import { useAsyncWorkflowCommandMachine } from "../workflow";
import { RepositoryAuthoringDialog } from "./RepositoryAuthoringDialog";
import { RepositoryCatalogPanel } from "./RepositoryCatalogPanel";
import { RepositoryCatalogProfile } from "./RepositoryCatalogProfile";
import { RepositoryCatalogRail } from "./RepositoryCatalogRail";
import { WorkbenchHeader } from "./WorkbenchHeader";
import { WorkbenchStatusStrip } from "./WorkbenchStatusStrip";

export type OperatorWorkbenchProps = {
  bootstrap: BootstrapResponse;
  activeWorkspaceMode: OperatorWorkspaceMode;
  activeTenantId: string;
  hasExplicitCatalogSelection: boolean;
  activeViewId: string;
  activeFilterId: string;
  activeViewCount: number;
  activeTenantRepoPath: string;
  repositoryCatalog: RepositoryCatalogEntry[];
  searchQuery: string;
  activeTabId: ChangeDetailTabId;
  selectedChangeId: string | null;
  selectedRunId: string | null;
  detail: ChangeDetailResponse | null;
  changes: ChangeSummary[];
  filteredChanges: ChangeSummary[];
  selectedRunApprovals: ApprovalRecord[];
  selectedRunEvents: RuntimeEvent[];
  realtimeNotice?: string | null;
  toast?: string | null;
  onSearchQueryChange: (value: string) => void;
  onWorkspaceModeChange: (workspaceMode: OperatorWorkspaceMode) => void;
  onCreateTenant: (name: string, repoPath: string, description: string) => Promise<void>;
  onCreateChange: () => Promise<void>;
  onGlobalRunNext: () => Promise<void>;
  onRunNext: () => Promise<void>;
  onTenantChange: (tenantId: string) => Promise<void>;
  onSelectCatalogTenant: (tenantId: string) => Promise<void>;
  onClearCatalogSelection: () => void;
  onSelectView: (viewId: string) => void;
  onSelectFilter: (filterId: string) => void;
  onSelectChange: (changeId: string | null) => void;
  onClearSelection: () => void;
  onClearSelectedRun: () => void;
  onOpenRunStudio: () => void;
  onEscalate: () => Promise<void>;
  onBlockBySpec: () => Promise<void>;
  onDeleteChange: () => Promise<void>;
  onCreateClarificationRound: () => Promise<void>;
  onAnswerClarificationRound: (roundId: string, answers: ClarificationAnswer[]) => Promise<void>;
  onSelectRun: (runId: string) => void;
  onSelectTab: (tabId: ChangeDetailTabId) => void;
  onPromoteFact: (title: string, body: string) => Promise<void>;
  onApprovalDecision: (approvalId: string, decision: "accept" | "decline") => Promise<void>;
};

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
  onOpenRunStudio,
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
  const activeViewHint = describeView(activeViewId);
  const activeFilter = describeFilter(activeFilterId);
  const filteredRepositoryCatalog = filterRepositoryCatalog(repositoryCatalog, {
    activeFilterId: activeRepositoryCatalogFilterId,
    searchQuery,
  });
  const activeRepositoryCatalogEntry = repositoryCatalog.find((entry) => entry.tenantId === activeTenantId) ?? null;
  const selectedRun = detail?.runs.find((run) => run.id === selectedRunId) ?? null;
  const isDetailWorkspaceOpen = Boolean(selectedChangeId) && dismissedChangeId !== selectedChangeId;
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
  const showRunStudio = Boolean(selectedRun);
  const workspace = activeWorkspaceMode === "catalog"
    ? (
      <div data-platform-surface="repository-catalog-workbench">
        <MasterDetailShell
          navigation={
            <WorkbenchStage
              eyebrow="Portfolio lanes"
              title="Repositories"
              description="Use the catalog to choose which repository needs operator attention next."
            >
              <RepositoryCatalogRail
                entries={repositoryCatalog}
                activeFilterId={activeRepositoryCatalogFilterId}
                onSelectFilter={setActiveRepositoryCatalogFilterId}
              />
            </WorkbenchStage>
          }
          list={
            <WorkbenchStage
              eyebrow="Catalog"
              title="Repository inventory"
              description="Backend-owned repository entries with explicit operator routing and readiness context."
            >
              <RepositoryCatalogPanel
                entries={filteredRepositoryCatalog}
                selectedTenantId={isCompactViewport && !hasExplicitCatalogSelection ? null : activeTenantId}
                activeFilterId={activeRepositoryCatalogFilterId}
                isSelectionPending={catalogSelectionWorkflow.isPending}
                selectionPendingLabel={catalogSelectionWorkflow.activeLabel}
                selectionError={catalogSelectionWorkflow.error}
                searchQuery={searchQuery}
                onSelectTenant={handleCatalogSelection}
                onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
              />
            </WorkbenchStage>
          }
          workspace={
            !isCompactViewport ? (
              <WorkbenchStage
                eyebrow="Repository workspace"
                title="Repository workspace"
                description="Repository profile, next action, and queue handoff for the current selection."
              >
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
              </WorkbenchStage>
            ) : null
          }
        />
      </div>
    )
    : (
      <div data-platform-surface="operator-workbench">
        <MasterDetailShell
          navigation={
            <WorkbenchStage
              eyebrow="Repository controls"
              title="Repositories"
              description="Saved slices, queue filters, and chief policy for the active repository."
            >
              <OperatorRail
                views={bootstrap.views}
                changes={changes}
                detail={detail}
                viewCounts={buildViewCounts(bootstrap.views, changes)}
                activeViewId={activeViewId}
                activeFilterId={activeFilterId}
                onSelectView={onSelectView}
                onSelectFilter={onSelectFilter}
              />
            </WorkbenchStage>
          }
          list={
            <WorkbenchStage
              eyebrow="Queue"
              title="Live queue"
              description="Backend-owned change feed with owner parity between queue and detail."
            >
              <QueuePanel
                changes={filteredChanges}
                selectedChangeId={selectedChangeId}
                activeViewLabel={activeViewLabel}
                activeViewHint={activeViewHint}
                activeViewCount={activeViewCount}
                activeFilterLabel={activeFilter.label}
                activeFilterHint={activeFilter.hint}
                searchQuery={searchQuery}
                onClearSelection={onClearSelection}
                onSelectChange={handleWorkspaceSelection}
              />
            </WorkbenchStage>
          }
          workspace={
            !isCompactViewport ? (
              <WorkbenchStage
                eyebrow="Selected change"
                title="Change workspace"
                description="Primary operator surface for actioning the current change and inspecting run lineage."
              >
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
                      onOpenRunStudio={onOpenRunStudio}
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
                    showRunStudio ? (
                      <RunStudio
                        run={selectedRun}
                        events={selectedRunEvents}
                        approvals={selectedRunApprovals}
                        onApprovalDecision={onApprovalDecision}
                        onClose={onClearSelectedRun}
                      />
                    ) : null
                  }
                />
              </WorkbenchStage>
            ) : null
          }
        />
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
      hero={
        <WorkbenchStatusStrip
          activeWorkspaceMode={activeWorkspaceMode}
          activeTenantRepoPath={activeTenantRepoPath}
          activeTenantName={activeRepositoryCatalogEntry?.name ?? activeTenantId}
          activeViewLabel={activeViewLabel}
          activeFilterLabel={activeFilter.label}
          searchQuery={searchQuery}
          detail={detail}
          filteredChangeCount={filteredChanges.length}
          repositoryCatalog={repositoryCatalog}
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
                    onOpenRunStudio={onOpenRunStudio}
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
                  showRunStudio ? (
                    <RunStudio
                      run={selectedRun}
                      events={selectedRunEvents}
                      approvals={selectedRunApprovals}
                      onApprovalDecision={onApprovalDecision}
                      onClose={onClearSelectedRun}
                    />
                  ) : null
                }
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

type WorkbenchStageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

function WorkbenchStage({ eyebrow, title, description, children }: WorkbenchStageProps) {
  return (
    <div className="workbench-stage">
      <div className="workbench-stage-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="subtitle">{description}</p>
        </div>
        <div className="workbench-stage-rule" aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}
