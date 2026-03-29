import { ChangeDetail } from "../../components/ChangeDetail";
import { InspectorPanel } from "../../components/InspectorPanel";
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
import { describeFilter, describeView } from "../server-state";
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
  toast?: string | null;
  onSearchQueryChange: (value: string) => void;
  onCreateChange: () => Promise<void>;
  onRunNext: () => Promise<void>;
  onTenantChange: (tenantId: string) => Promise<void>;
  onSelectView: (viewId: string) => void;
  onSelectFilter: (filterId: string) => void;
  onSelectChange: (changeId: string | null) => void;
  onClearSelection: () => void;
  onOpenRunStudio: () => void;
  onEscalate: () => Promise<void>;
  onBlockBySpec: () => Promise<void>;
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
  toast,
  onSearchQueryChange,
  onCreateChange,
  onRunNext,
  onTenantChange,
  onSelectView,
  onSelectFilter,
  onSelectChange,
  onClearSelection,
  onOpenRunStudio,
  onEscalate,
  onBlockBySpec,
  onCreateClarificationRound,
  onAnswerClarificationRound,
  onSelectRun,
  onSelectTab,
  onPromoteFact,
  onApprovalDecision,
}: OperatorWorkbenchProps) {
  const activeViewLabel = bootstrap.views.find((view) => view.id === activeViewId)?.label ?? "Inbox";
  const activeViewHint = describeView(activeViewId);
  const activeFilter = describeFilter(activeFilterId);
  const selectedRun = detail?.runs.find((run) => run.id === selectedRunId) ?? null;

  return (
    <WorkspacePageShell
      header={
        <WorkbenchHeader
          activeTenantId={activeTenantId}
          searchQuery={searchQuery}
          tenants={bootstrap.tenants}
          onSearchQueryChange={onSearchQueryChange}
          onCreateChange={onCreateChange}
          onRunNext={onRunNext}
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
                onSelectChange={onSelectChange}
              />
            }
            inspector={
              <InspectorPanel
                detail={detail}
                selectedChangeId={selectedChangeId}
                onClearSelection={onClearSelection}
              />
            }
          />
        </div>
      }
      detailWorkspace={
        <DetailWorkspaceShell
          isOpen={Boolean(selectedChangeId)}
          onClose={onClearSelection}
          detail={
            <ChangeDetail
              activeTab={activeTabId}
              detail={detail}
              onRunNext={onRunNext}
              onOpenRunStudio={onOpenRunStudio}
              onEscalate={onEscalate}
              onBlockBySpec={onBlockBySpec}
              onCreateClarificationRound={onCreateClarificationRound}
              onAnswerClarificationRound={onAnswerClarificationRound}
              onSelectRun={onSelectRun}
              onSelectTab={onSelectTab}
              onPromoteFact={onPromoteFact}
            />
          }
          runInspection={
            <RunStudio
              run={selectedRun}
              events={selectedRunEvents}
              approvals={selectedRunApprovals}
              onApprovalDecision={onApprovalDecision}
            />
          }
        />
      }
      toast={toast ? <div className="toast">{toast}</div> : null}
    />
  );
}

function buildViewCounts(views: BootstrapResponse["views"], changes: ChangeSummary[]) {
  const counts: Record<string, number> = {};
  for (const view of views) {
    counts[view.id] = changes.filter((change) => matchesView(change, view.id)).length;
  }
  return counts;
}

function matchesView(change: ChangeSummary, viewId: string) {
  switch (viewId) {
    case "ready":
      return ["approved", "ready_for_acceptance"].includes(change.state) || change.mandatoryGapCount <= 1;
    case "review":
      return ["review_pending", "gap_fixing"].includes(change.state);
    case "blocked":
      return ["blocked_by_spec", "escalated"].includes(change.state);
    case "done":
      return change.state === "done";
    default:
      return true;
  }
}
