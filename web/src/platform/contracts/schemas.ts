import { z } from "zod";

const recordValueSchema = z.record(z.string(), z.unknown());
const optionalStringSchema = z.string().optional();

const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  repoPath: z.string(),
  description: z.string(),
});

const changeSummarySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string(),
  subtitle: z.string(),
  state: z.string(),
  nextAction: z.string(),
  blocker: z.string(),
  loopCount: z.number(),
  lastRunAgo: z.string(),
  verificationStatus: z.string(),
  mandatoryGapCount: z.number(),
});

const focusItemSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  status: optionalStringSchema,
});

const runtimeEventSchema = z.object({
  type: z.string(),
  payload: recordValueSchema,
});

const runRecordSchema = z.object({
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
  memoryPacket: z.object({
    tenantMemory: z.object({
      facts: z.array(
        z.object({
          id: optionalStringSchema,
          title: z.string(),
          body: z.string(),
        }),
      ),
    }),
    changeContract: recordValueSchema,
    changeMemory: recordValueSchema,
    focusGraph: z.object({
      items: z.array(focusItemSchema),
    }),
  }),
});

const approvalRecordSchema = z.object({
  id: z.string(),
  runId: z.string(),
  tenantId: z.string(),
  status: z.string(),
  kind: z.string(),
  reason: z.string(),
  payload: recordValueSchema,
});

const evidenceArtifactSchema = z.object({
  id: z.string(),
  changeId: z.string(),
  runId: optionalStringSchema,
  kind: z.string(),
  title: z.string(),
  body: z.string(),
});

const clarificationQuestionSchema = z.object({
  id: z.string(),
  label: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    }),
  ),
  allowOther: z.boolean(),
});

const clarificationAnswerSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string(),
  freeformNote: optionalStringSchema,
});

const clarificationRoundSchema = z.object({
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

const changeDetailSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string(),
  subtitle: z.string(),
  state: z.string(),
  summary: z.string(),
  blocker: z.string(),
  nextAction: z.string(),
  verificationStatus: z.string(),
  loopCount: z.number(),
  owner: optionalStringSchema,
  policy: z
    .object({
      maxAutoCycles: z.number(),
      escalationRule: z.string(),
      acceptanceGate: z.string(),
    })
    .optional(),
  contract: z.object({
    goal: z.string(),
    scope: z.array(z.string()),
    acceptanceCriteria: z.array(z.string()),
    constraints: z.array(z.string()),
  }),
  memory: z.object({
    summary: z.string(),
    openQuestions: z.array(z.string()),
    decisions: z.array(z.string()),
    facts: z.array(
      z.object({
        id: optionalStringSchema,
        title: z.string(),
        body: z.string(),
      }),
    ),
    activeFocus: z.array(z.string()),
  }),
  chiefHistory: z.array(
    z.object({
      at: z.string(),
      title: z.string(),
      note: z.string(),
    }),
  ),
  traceability: z.array(
    z.object({
      req: z.string(),
      code: z.string(),
      tests: z.string(),
      evidence: z.string(),
      status: z.string(),
    }),
  ),
  gaps: z.array(
    z.object({
      id: z.string(),
      severity: z.string(),
      mandatory: z.boolean(),
      status: z.string(),
      summary: z.string(),
      recurrence: z.number(),
      reqRef: optionalStringSchema,
    }),
  ),
  timeline: z.array(
    z.object({
      title: z.string(),
      note: z.string(),
    }),
  ),
  git: z.object({
    worktree: z.string(),
    branch: z.string(),
    changedFiles: z.number(),
    commitStatus: z.string(),
    mergeReadiness: z.string(),
    prStatus: optionalStringSchema,
  }),
});

export const bootstrapResponseSchema = z.object({
  tenants: z.array(tenantSchema),
  activeTenantId: z.string(),
  views: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
  changes: z.array(changeSummarySchema),
});

export const changesResponseSchema = z.object({
  changes: z.array(changeSummarySchema),
});

export const changeDetailResponseSchema = z.object({
  change: changeDetailSchema,
  runs: z.array(runRecordSchema),
  evidence: z.array(evidenceArtifactSchema),
  clarificationRounds: z.array(clarificationRoundSchema),
  focusGraph: z.object({
    items: z.array(focusItemSchema),
  }),
  tenantMemory: z.array(
    z.object({
      id: optionalStringSchema,
      title: z.string(),
      body: z.string(),
    }),
  ),
});

export const runMutationResponseSchema = z.object({
  run: runRecordSchema,
  events: z.array(runtimeEventSchema),
  approvals: z.array(approvalRecordSchema),
  change: changeDetailSchema,
});

export const runDetailResponseSchema = z.object({
  run: runRecordSchema,
  events: z.array(runtimeEventSchema),
  approvals: z.array(approvalRecordSchema),
});

export const clarificationRoundResponseSchema = z.object({
  round: clarificationRoundSchema,
});

export const promotedFactResponseSchema = z.object({
  fact: z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
  }),
});

export const createChangeResponseSchema = z.object({
  change: changeDetailSchema,
});

export const approvalDecisionResponseSchema = z.object({
  approval: approvalRecordSchema,
});
