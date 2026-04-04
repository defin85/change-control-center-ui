export type Tenant = {
  id: string;
  name: string;
  repoPath: string;
  description: string;
};

export type RepositoryCatalogAttentionState = "needs_setup" | "blocked" | "active" | "quiet";

export type RepositoryCatalogFeaturedChange = {
  id: string;
  title: string;
  state: string;
  nextAction: string;
};

export type RepositoryCatalogEntry = {
  tenantId: string;
  name: string;
  repoPath: string;
  description: string;
  changeCount: number;
  blockedChangeCount: number;
  readyChangeCount: number;
  activeChangeCount: number;
  attentionState: RepositoryCatalogAttentionState;
  lastActivity: string;
  nextRecommendedAction: string;
  featuredChange: RepositoryCatalogFeaturedChange | null;
};

export const CHANGE_DETAIL_TAB_IDS = [
  "overview",
  "traceability",
  "runs",
  "gaps",
  "evidence",
  "git",
  "chief",
  "clarifications",
] as const;

export type ChangeDetailTabId = (typeof CHANGE_DETAIL_TAB_IDS)[number];

export type ChangeSummary = {
  id: string;
  tenantId: string;
  title: string;
  subtitle: string;
  state: string;
  nextAction: string;
  blocker: string;
  loopCount: number;
  lastRunAgo: string;
  verificationStatus: string;
  mandatoryGapCount: number;
};

export type FocusItem = {
  id: string;
  kind: string;
  title: string;
  status?: string;
};

export type RuntimeEvent = {
  type: string;
  payload: Record<string, unknown>;
};

export type FactRecord = {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  status: string;
};

export type RunRecord = {
  id: string;
  changeId: string;
  tenantId: string;
  kind: string;
  status: string;
  transport: string;
  threadId?: string;
  turnId?: string;
  worktree: string;
  result: string;
  duration: string;
  outcome: string;
  prompt: string;
  checks: string[];
  decision: string;
  memoryPacket: {
    tenantMemory: { facts: FactRecord[] };
    changeContract: Record<string, unknown>;
    changeMemory: ChangeMemory;
    focusGraph: { items: FocusItem[] };
  };
};

export type ApprovalRecord = {
  id: string;
  runId: string;
  tenantId: string;
  status: string;
  kind: string;
  reason: string;
  decision?: string;
  payload: Record<string, unknown>;
};

export type EvidenceArtifact = {
  id: string;
  changeId: string;
  runId?: string;
  kind: string;
  title: string;
  body: string;
};

export type ClarificationQuestion = {
  id: string;
  label: string;
  options: Array<{ id: string; label: string; description: string }>;
  allowOther: boolean;
};

export type ClarificationAnswer = {
  questionId: string;
  selectedOptionId: string;
  freeformNote?: string;
};

export type ClarificationMemoryEntry = {
  questionId: string;
  question: string;
  selectedOptionId: string;
  freeformNote?: string;
};

export type ChangeMemory = {
  summary: string;
  openQuestions: string[];
  decisions: string[];
  facts: FactRecord[];
  activeFocus: string[];
  clarifications: ClarificationMemoryEntry[];
};

export type ClarificationRound = {
  id: string;
  tenantId: string;
  changeId: string;
  status: string;
  rationale: string;
  questions: ClarificationQuestion[];
  answers: ClarificationAnswer[];
  createdAt: string;
  updatedAt: string;
};

export type ChangeDetailResponse = {
  change: {
    id: string;
    tenantId: string;
    title: string;
    subtitle: string;
    state: string;
    summary: string;
    createdAt: string;
    updatedAt: string;
    blocker: string;
    nextAction: string;
    verificationStatus: string;
    loopCount: number;
    lastRunAgo: string;
    requirementsLinked: number;
    requirementsTotal: number;
    specStatus: string;
    owner?: string;
    policy?: {
      maxAutoCycles: number;
      escalationRule: string;
      acceptanceGate: string;
    };
    contract: {
      goal: string;
      scope: string[];
      acceptanceCriteria: string[];
      constraints: string[];
    };
    memory: ChangeMemory;
    chiefHistory: Array<{ at: string; title: string; note: string }>;
    traceability: Array<{ req: string; code: string; tests: string; evidence: string; status: string }>;
    gaps: Array<{
      id: string;
      severity: string;
      mandatory: boolean;
      status: string;
      summary: string;
      recurrence: number;
      reqRef?: string;
      evidence?: string;
      fingerprint?: string;
      firstSeen?: string;
      introducedByRun?: string;
      lastSeen?: string;
    }>;
    timeline: Array<{ title: string; note: string }>;
    git: {
      worktree: string;
      branch: string;
      changedFiles: number;
      commitStatus: string;
      mergeReadiness: string;
      prStatus?: string;
    };
  };
  runs: RunRecord[];
  evidence: EvidenceArtifact[];
  clarificationRounds: ClarificationRound[];
  focusGraph: { items: FocusItem[] };
  tenantMemory: FactRecord[];
};

export type RunDetailResponse = {
  run: RunRecord;
  events: RuntimeEvent[];
  approvals: ApprovalRecord[];
};

export type BootstrapResponse = {
  tenants: Tenant[];
  repositoryCatalog: RepositoryCatalogEntry[];
  activeTenantId: string;
  views: Array<{ id: string; label: string }>;
  changes: ChangeSummary[];
};
