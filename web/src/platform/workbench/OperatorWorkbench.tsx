import { useEffect, useState } from "react";

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
  RuntimeEvent,
} from "../../types";
import { buildViewCounts, describeFilter, describeView } from "../server-state";
import { DetailWorkspaceShell } from "../shells/DetailWorkspaceShell";
import { MasterDetailShell } from "../shells/MasterDetailShell";
import { WorkspacePageShell } from "../shells/WorkspacePageShell";
import { WorkbenchHeader } from "./WorkbenchHeader";
import { WorkbenchStatusStrip } from "./WorkbenchStatusStrip";

export type OperatorWorkbenchProps = {
  bootstrap: BootstrapResponse;
  activeTenantId: string;
  activeViewId: string;
  activeFilterId: string;
  activeViewCount: number;
  activeTenantRepoPath: string;
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
  onCreateTenant: (name: string, repoPath: string, description: string) => Promise<void>;
  onCreateChange: () => Promise<void>;
  onGlobalRunNext: () => Promise<void>;
  onRunNext: () => Promise<void>;
  onTenantChange: (tenantId: string) => Promise<void>;
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
  activeTenantId,
  activeViewId,
  activeFilterId,
  activeViewCount,
  activeTenantRepoPath,
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
  onCreateTenant,
  onCreateChange,
  onGlobalRunNext,
  onRunNext,
  onTenantChange,
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
  const activeViewLabel = bootstrap.views.find((view) => view.id === activeViewId)?.label ?? "Inbox";
  const activeViewHint = describeView(activeViewId);
  const activeFilter = describeFilter(activeFilterId);
  const selectedRun = detail?.runs.find((run) => run.id === selectedRunId) ?? null;
  const isDetailWorkspaceOpen = Boolean(selectedChangeId) && dismissedChangeId !== selectedChangeId;
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

  function handleCloseWorkspace() {
    setDismissedChangeId(selectedChangeId);
  }
  const showRunStudio = Boolean(selectedRun);

  return (
    <WorkspacePageShell
      header={
        <WorkbenchHeader
          activeTenantId={activeTenantId}
          canRunNext={Boolean(selectedChangeId)}
          hasVisibleContextualPrimaryAction={hasVisibleContextualPrimaryAction}
          realtimeNotice={realtimeNotice ?? null}
          searchQuery={searchQuery}
          tenants={bootstrap.tenants}
          onSearchQueryChange={onSearchQueryChange}
          onCreateTenant={onCreateTenant}
          onCreateChange={onCreateChange}
          onRunNext={onGlobalRunNext}
          onTenantChange={onTenantChange}
        />
      }
      hero={
        <WorkbenchStatusStrip
          activeTenantRepoPath={activeTenantRepoPath}
          detail={detail}
          filteredChangeCount={filteredChanges.length}
        />
      }
      workspace={
        <div data-platform-surface="operator-workbench">
          <MasterDetailShell
            navigation={
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
            }
            list={
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
            }
            workspace={
              !isCompactViewport ? (
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
              ) : null
            }
          />
        </div>
      }
      detailWorkspace={
        isCompactViewport ? (
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
        ) : null
      }
      toast={toast ? <div className="toast">{toast}</div> : null}
    />
  );
}
