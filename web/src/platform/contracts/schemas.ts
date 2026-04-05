import { z } from "zod";

const recordValueSchema = z.record(z.string(), z.unknown());
const optionalStringSchema = z.string().optional();
const strictObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();

const tenantSchema = strictObject({
  id: z.string(),
  name: z.string(),
  repoPath: z.string(),
  description: z.string(),
});

const repositoryCatalogFeaturedChangeSchema = strictObject({
  id: z.string(),
  title: z.string(),
  state: z.string(),
  nextAction: z.string(),
});

const repositoryCatalogEntrySchema = strictObject({
  tenantId: z.string(),
  name: z.string(),
  repoPath: z.string(),
  description: z.string(),
  changeCount: z.number(),
  blockedChangeCount: z.number(),
  readyChangeCount: z.number(),
  activeChangeCount: z.number(),
  attentionState: z.enum(["needs_setup", "blocked", "active", "quiet"]),
  lastActivity: z.string(),
  nextRecommendedAction: z.string(),
  featuredChange: repositoryCatalogFeaturedChangeSchema.nullable(),
});

const ownerContractSchema = strictObject({
  id: z.string(),
  label: z.string(),
});

const changeSummarySchema = strictObject({
  id: z.string(),
  tenantId: z.string(),
  title: z.string(),
  subtitle: z.string(),
  state: z.string(),
  owner: ownerContractSchema,
  nextAction: z.string(),
  blocker: z.string(),
  loopCount: z.number(),
  lastRunAgo: z.string(),
  verificationStatus: z.string(),
  mandatoryGapCount: z.number(),
});

const focusItemSchema = strictObject({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  status: optionalStringSchema,
});

const runtimeEventSchema = strictObject({
  type: z.string(),
  payload: recordValueSchema,
});

const clarificationMemoryEntrySchema = strictObject({
  questionId: z.string(),
  question: z.string(),
  selectedOptionId: z.string(),
  freeformNote: optionalStringSchema,
});

const canonicalFactSchema = strictObject({
  id: z.string(),
  tenantId: z.string(),
  title: z.string(),
  body: z.string(),
  status: z.string(),
});

const changeMemorySchema = strictObject({
  summary: z.string(),
  openQuestions: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  facts: z.array(canonicalFactSchema).default([]),
  activeFocus: z.array(z.string()).default([]),
  clarifications: z.array(clarificationMemoryEntrySchema).default([]),
});

const runRecordSchema = strictObject({
  id: z.string(),
  changeId: z.string(),
  tenantId: z.string(),
  kind: z.string(),
  status: z.string(),
  transport: z.string(),
  threadId: optionalStringSchema,
  turnId: optionalStringSchema,
  worktree: z.string(),
  result: z.string(),
  duration: z.string(),
  outcome: z.string(),
  prompt: z.string(),
  checks: z.array(z.string()),
  decision: z.string(),
  memoryPacket: strictObject({
    tenantMemory: strictObject({
      facts: z.array(canonicalFactSchema),
    }),
    changeContract: recordValueSchema,
    changeMemory: changeMemorySchema,
    focusGraph: strictObject({
      items: z.array(focusItemSchema),
    }),
  }),
});

const approvalRecordSchema = strictObject({
  id: z.string(),
  runId: z.string(),
  tenantId: z.string(),
  status: z.string(),
  kind: z.string(),
  reason: z.string(),
  decision: optionalStringSchema,
  payload: recordValueSchema,
});

const evidenceArtifactSchema = strictObject({
  id: z.string(),
  changeId: z.string(),
  runId: optionalStringSchema,
  kind: z.string(),
  title: z.string(),
  body: z.string(),
});

const clarificationQuestionSchema = strictObject({
  id: z.string(),
  label: z.string(),
  options: z.array(
    strictObject({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    }),
  ),
  allowOther: z.boolean(),
});

const clarificationAnswerSchema = strictObject({
  questionId: z.string(),
  selectedOptionId: z.string(),
  freeformNote: optionalStringSchema,
});

const clarificationRoundSchema = strictObject({
  id: z.string(),
  tenantId: z.string(),
  changeId: z.string(),
  status: z.string(),
  rationale: z.string(),
  questions: z.array(clarificationQuestionSchema),
  answers: z.array(clarificationAnswerSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const changeDetailSchema = strictObject({
  id: z.string(),
  tenantId: z.string(),
  title: z.string(),
  subtitle: z.string(),
  state: z.string(),
  summary: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  blocker: z.string(),
  nextAction: z.string(),
  verificationStatus: z.string(),
  loopCount: z.number(),
  lastRunAgo: z.string(),
  requirementsLinked: z.number(),
  requirementsTotal: z.number(),
  specStatus: z.string(),
  owner: ownerContractSchema,
  policy: strictObject({
    maxAutoCycles: z.number(),
    escalationRule: z.string(),
    acceptanceGate: z.string(),
  })
    .optional(),
  contract: strictObject({
    goal: z.string(),
    scope: z.array(z.string()),
    acceptanceCriteria: z.array(z.string()),
    constraints: z.array(z.string()),
  }),
  memory: changeMemorySchema,
  chiefHistory: z.array(
    strictObject({
      at: z.string(),
      title: z.string(),
      note: z.string(),
    }),
  ),
  traceability: z.array(
    strictObject({
      req: z.string(),
      code: z.string(),
      tests: z.string(),
      evidence: z.string(),
      status: z.string(),
    }),
  ),
  gaps: z.array(
    strictObject({
      id: z.string(),
      severity: z.string(),
      mandatory: z.boolean(),
      status: z.string(),
      summary: z.string(),
      recurrence: z.number(),
      reqRef: optionalStringSchema,
      evidence: optionalStringSchema,
      fingerprint: optionalStringSchema,
      firstSeen: optionalStringSchema,
      introducedByRun: optionalStringSchema,
      lastSeen: optionalStringSchema,
    }),
  ),
  timeline: z.array(
    strictObject({
      title: z.string(),
      note: z.string(),
    }),
  ),
  git: strictObject({
    worktree: z.string(),
    branch: z.string(),
    changedFiles: z.number(),
    commitStatus: z.string(),
    mergeReadiness: z.string(),
    prStatus: optionalStringSchema,
  }),
});

export const bootstrapResponseSchema = strictObject({
  tenants: z.array(tenantSchema),
  repositoryCatalog: z.array(repositoryCatalogEntrySchema),
  activeTenantId: z.string(),
  views: z.array(
    strictObject({
      id: z.string(),
      label: z.string(),
    }),
  ),
  changes: z.array(changeSummarySchema),
});

export const changesResponseSchema = strictObject({
  changes: z.array(changeSummarySchema),
});

export const changeDetailResponseSchema = strictObject({
  change: changeDetailSchema,
  runs: z.array(runRecordSchema),
  evidence: z.array(evidenceArtifactSchema),
  clarificationRounds: z.array(clarificationRoundSchema),
  focusGraph: strictObject({
    items: z.array(focusItemSchema),
  }),
  tenantMemory: z.array(
    canonicalFactSchema,
  ),
});

export const runMutationResponseSchema = strictObject({
  run: runRecordSchema,
  events: z.array(runtimeEventSchema),
  approvals: z.array(approvalRecordSchema),
  change: changeDetailSchema,
});

export const runDetailResponseSchema = strictObject({
  run: runRecordSchema,
  events: z.array(runtimeEventSchema),
  approvals: z.array(approvalRecordSchema),
});

export const clarificationRoundResponseSchema = strictObject({
  round: clarificationRoundSchema,
});

export const promotedFactResponseSchema = strictObject({
  fact: canonicalFactSchema,
});

export const createChangeResponseSchema = strictObject({
  change: changeDetailSchema,
});

export const createTenantResponseSchema = strictObject({
  tenant: tenantSchema,
});

export const deleteChangeResponseSchema = strictObject({
  deletedChangeId: z.string(),
});

export const approvalDecisionResponseSchema = strictObject({
  approval: approvalRecordSchema,
});
