export type Tenant = {
  id: string;
  name: string;
  repoPath: string;
  description: string;
};

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
    tenantMemory: { facts: Array<{ id?: string; title: string; body: string }> };
    changeContract: Record<string, unknown>;
    changeMemory: Record<string, unknown>;
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
    blocker: string;
    nextAction: string;
    verificationStatus: string;
    loopCount: number;
    contract: {
      goal: string;
      scope: string[];
      acceptanceCriteria: string[];
      constraints: string[];
    };
    memory: {
      summary: string;
      openQuestions: string[];
      decisions: string[];
      facts: Array<{ id?: string; title: string; body: string }>;
      activeFocus: string[];
    };
    chiefHistory: Array<{ at: string; title: string; note: string }>;
    traceability: Array<{ req: string; code: string; tests: string; evidence: string; status: string }>;
    gaps: Array<{
      id: string;
      severity: string;
      mandatory: boolean;
      status: string;
      summary: string;
      recurrence: number;
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
  tenantMemory: Array<{ id?: string; title: string; body: string }>;
};

export type BootstrapResponse = {
  tenants: Tenant[];
  activeTenantId: string;
  views: Array<{ id: string; label: string }>;
  changes: ChangeSummary[];
};
