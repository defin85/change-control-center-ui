import { CHANGE_DETAIL_TAB_IDS, type ChangeDetailTabId } from "../../types";

export const DEFAULT_OPERATOR_VIEW_ID = "inbox";
export const DEFAULT_OPERATOR_FILTER_ID = "all";
export const DEFAULT_OPERATOR_TAB_ID: ChangeDetailTabId = "overview";
export const DEFAULT_OPERATOR_WORKSPACE_MODE = "queue";

export type OperatorWorkspaceMode = "queue" | "catalog";

export type OperatorRouteState = {
  workspaceMode?: OperatorWorkspaceMode;
  tenantId?: string;
  viewId?: string;
  filterId?: string;
  searchQuery?: string;
  changeId?: string;
  runId?: string;
  tabId?: ChangeDetailTabId;
};

export function readOperatorRouteState(search: string): OperatorRouteState {
  const params = new URLSearchParams(search);

  return {
    workspaceMode: readWorkspaceMode(params.get("workspace")),
    tenantId: readParam(params, "tenant"),
    viewId: readParam(params, "view"),
    filterId: readParam(params, "filter"),
    searchQuery: readParam(params, "q"),
    changeId: readParam(params, "change"),
    runId: readParam(params, "run"),
    tabId: readTabId(params.get("tab")),
  };
}

export function buildOperatorRouteHref(pathname: string, state: OperatorRouteState): string {
  const params = new URLSearchParams();

  if (state.workspaceMode && state.workspaceMode !== DEFAULT_OPERATOR_WORKSPACE_MODE) {
    params.set("workspace", state.workspaceMode);
  }
  if (state.tenantId) {
    params.set("tenant", state.tenantId);
  }
  if (state.viewId && state.viewId !== DEFAULT_OPERATOR_VIEW_ID) {
    params.set("view", state.viewId);
  }
  if (state.filterId && state.filterId !== DEFAULT_OPERATOR_FILTER_ID) {
    params.set("filter", state.filterId);
  }
  if (state.searchQuery) {
    params.set("q", state.searchQuery);
  }
  if (state.changeId) {
    params.set("change", state.changeId);
  }
  if (state.runId) {
    params.set("run", state.runId);
  }
  if (state.tabId && state.tabId !== DEFAULT_OPERATOR_TAB_ID) {
    params.set("tab", state.tabId);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function readParam(params: URLSearchParams, key: string) {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

function readTabId(value: string | null): ChangeDetailTabId | undefined {
  if (!value) {
    return undefined;
  }

  return CHANGE_DETAIL_TAB_IDS.includes(value as ChangeDetailTabId) ? (value as ChangeDetailTabId) : undefined;
}

function readWorkspaceMode(value: string | null): OperatorWorkspaceMode | undefined {
  if (value === "queue" || value === "catalog") {
    return value;
  }
  return undefined;
}
