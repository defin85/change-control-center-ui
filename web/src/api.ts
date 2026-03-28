import type {
  ApprovalRecord,
  BootstrapResponse,
  ChangeDetailResponse,
  ClarificationAnswer,
  ClarificationRound,
  RunRecord,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchBootstrap(): Promise<BootstrapResponse> {
  return request<BootstrapResponse>("/api/bootstrap");
}

export function fetchChanges(tenantId: string): Promise<{ changes: BootstrapResponse["changes"] }> {
  return request(`/api/tenants/${tenantId}/changes`);
}

export function fetchChangeDetail(tenantId: string, changeId: string): Promise<ChangeDetailResponse> {
  return request(`/api/tenants/${tenantId}/changes/${changeId}`);
}

export function createRun(
  tenantId: string,
  changeId: string,
  kind: string,
): Promise<{ run: RunRecord; change: ChangeDetailResponse["change"] }> {
  return request(`/api/tenants/${tenantId}/changes/${changeId}/runs`, {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}

export function runNext(
  tenantId: string,
  changeId: string,
): Promise<{ run: RunRecord; change: ChangeDetailResponse["change"] }> {
  return request(`/api/tenants/${tenantId}/changes/${changeId}/actions/run-next`, {
    method: "POST",
  });
}

export function fetchRunDetail(
  tenantId: string,
  runId: string,
): Promise<{ run: RunRecord; approvals: ApprovalRecord[] }> {
  return request(`/api/tenants/${tenantId}/runs/${runId}`);
}

export function createClarificationRound(
  tenantId: string,
  changeId: string,
): Promise<{ round: ClarificationRound }> {
  return request(`/api/tenants/${tenantId}/changes/${changeId}/clarifications/auto`, {
    method: "POST",
  });
}

export function answerClarificationRound(
  tenantId: string,
  roundId: string,
  answers: ClarificationAnswer[],
): Promise<{ round: ClarificationRound }> {
  return request(`/api/tenants/${tenantId}/clarifications/${roundId}/answers`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function promoteFact(
  tenantId: string,
  changeId: string,
  title: string,
  body: string,
): Promise<{ fact: { id: string; title: string; body: string } }> {
  return request(`/api/tenants/${tenantId}/changes/${changeId}/promotions`, {
    method: "POST",
    body: JSON.stringify({ fact: { title, body } }),
  });
}
