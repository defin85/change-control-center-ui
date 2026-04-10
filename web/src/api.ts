import type {
  ApprovalRecord,
  BootstrapResponse,
  ChangeDetailResponse,
  ClarificationAnswer,
  ClarificationRound,
  FactRecord,
  RuntimeEvent,
  RunDetailResponse,
  RunListEntry,
  RunListSlice,
  RunRecord,
  Tenant,
} from "./types";
import {
  approvalDecisionResponseSchema,
  bootstrapResponseSchema,
  changeDetailResponseSchema,
  changesResponseSchema,
  clarificationRoundResponseSchema,
  createChangeResponseSchema,
  createTenantResponseSchema,
  deleteChangeResponseSchema,
  promotedFactResponseSchema,
  requestControlApi,
  runDetailResponseSchema,
  runMutationResponseSchema,
  runsResponseSchema,
} from "./platform";

export function fetchBootstrap(): Promise<BootstrapResponse> {
  return requestControlApi("/api/bootstrap", bootstrapResponseSchema);
}

export function createTenant(
  name: string,
  repoPath: string,
  description?: string,
): Promise<{ tenant: Tenant }> {
  return requestControlApi("/api/tenants", createTenantResponseSchema, {
    method: "POST",
    body: JSON.stringify({
      name,
      repoPath,
      description: description ?? "",
    }),
  });
}

export function fetchChanges(tenantId: string): Promise<{ changes: BootstrapResponse["changes"] }> {
  return requestControlApi(`/api/tenants/${tenantId}/changes`, changesResponseSchema);
}

export function fetchChangeDetail(tenantId: string, changeId: string): Promise<ChangeDetailResponse> {
  return requestControlApi(`/api/tenants/${tenantId}/changes/${changeId}`, changeDetailResponseSchema);
}

type RunMutationResponse = {
  run: RunRecord;
  events: RuntimeEvent[];
  approvals: ApprovalRecord[];
  change: ChangeDetailResponse["change"];
};

export function createRun(
  tenantId: string,
  changeId: string,
  kind: string,
): Promise<RunMutationResponse> {
  return requestControlApi(`/api/tenants/${tenantId}/changes/${changeId}/runs`, runMutationResponseSchema, {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}

export function runNext(
  tenantId: string,
  changeId: string,
): Promise<RunMutationResponse> {
  return requestControlApi(`/api/tenants/${tenantId}/changes/${changeId}/actions/run-next`, runMutationResponseSchema, {
    method: "POST",
  });
}

export function fetchRunDetail(
  tenantId: string,
  runId: string,
): Promise<RunDetailResponse> {
  return requestControlApi(`/api/tenants/${tenantId}/runs/${runId}`, runDetailResponseSchema);
}

export function fetchRuns(
  tenantId: string,
  slice: RunListSlice = "attention",
): Promise<{ slice: RunListSlice; runs: RunListEntry[] }> {
  return requestControlApi(`/api/tenants/${tenantId}/runs?slice=${encodeURIComponent(slice)}`, runsResponseSchema);
}

export function createClarificationRound(
  tenantId: string,
  changeId: string,
): Promise<{ round: ClarificationRound }> {
  return requestControlApi(
    `/api/tenants/${tenantId}/changes/${changeId}/clarifications/auto`,
    clarificationRoundResponseSchema,
    {
    method: "POST",
    },
  );
}

export function answerClarificationRound(
  tenantId: string,
  roundId: string,
  answers: ClarificationAnswer[],
): Promise<{ round: ClarificationRound }> {
  return requestControlApi(`/api/tenants/${tenantId}/clarifications/${roundId}/answers`, clarificationRoundResponseSchema, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function promoteFact(
  tenantId: string,
  changeId: string,
  title: string,
  body: string,
): Promise<{ fact: FactRecord }> {
  return requestControlApi(`/api/tenants/${tenantId}/changes/${changeId}/promotions`, promotedFactResponseSchema, {
    method: "POST",
    body: JSON.stringify({ fact: { title, body } }),
  });
}

export function createChange(
  tenantId: string,
  title?: string,
): Promise<{ change: ChangeDetailResponse["change"] }> {
  return requestControlApi(`/api/tenants/${tenantId}/changes`, createChangeResponseSchema, {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
  });
}

export function deleteChange(
  tenantId: string,
  changeId: string,
): Promise<{ deletedChangeId: string }> {
  return requestControlApi(`/api/tenants/${tenantId}/changes/${changeId}`, deleteChangeResponseSchema, {
    method: "DELETE",
  });
}

export function escalateChange(
  tenantId: string,
  changeId: string,
): Promise<{ change: ChangeDetailResponse["change"] }> {
  return requestControlApi(`/api/tenants/${tenantId}/changes/${changeId}/actions/escalate`, createChangeResponseSchema, {
    method: "POST",
  });
}

export function blockChangeBySpec(
  tenantId: string,
  changeId: string,
): Promise<{ change: ChangeDetailResponse["change"] }> {
  return requestControlApi(
    `/api/tenants/${tenantId}/changes/${changeId}/actions/block-by-spec`,
    createChangeResponseSchema,
    {
    method: "POST",
    },
  );
}

export function decideApproval(
  tenantId: string,
  approvalId: string,
  decision: "accept" | "decline",
): Promise<{ approval: ApprovalRecord }> {
  return requestControlApi(`/api/tenants/${tenantId}/approvals/${approvalId}/decision`, approvalDecisionResponseSchema, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}
