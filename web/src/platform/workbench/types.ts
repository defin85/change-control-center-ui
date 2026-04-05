import type {
  ApprovalRecord,
  BootstrapResponse,
  ChangeDetailResponse,
  ChangeDetailTabId,
  ChangeSummary,
  ClarificationAnswer,
  RepositoryCatalogEntry,
  RuntimeEvent,
} from "../../types";
import type { OperatorWorkspaceMode } from "../navigation";

export type OperatorWorkbenchProps = {
  bootstrap: BootstrapResponse;
  legacyWorkbenchEnabled: boolean;
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
