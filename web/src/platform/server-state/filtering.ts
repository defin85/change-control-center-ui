import type { BootstrapResponse, ChangeSummary } from "../../types";

export type OperatorFilterContext = {
  activeViewId: string;
  activeFilterId: string;
  searchQuery: string;
};

export const OPERATOR_FILTERS = [
  { id: "all", label: "All severities", hint: "Everything in the active view" },
  { id: "needs-review", label: "Needs review", hint: "Open mandatory gaps only" },
  { id: "blocked", label: "Blocked", hint: "Escalated or spec-blocked" },
] as const;

export const OPERATOR_VIEW_HINTS: Record<string, string> = {
  inbox: "Open work awaiting chief attention",
  ready: "Ready to move",
  review: "Needs review or gap closure",
  blocked: "Blocked or escalated",
  done: "Completed and landed",
};

export function filterChanges(changes: ChangeSummary[], context: OperatorFilterContext) {
  const query = context.searchQuery.trim().toLowerCase();

  return changes.filter((change) => {
    if (!matchesView(change, context.activeViewId)) {
      return false;
    }

    if (context.activeFilterId === "needs-review" && change.mandatoryGapCount === 0) {
      return false;
    }
    if (context.activeFilterId === "blocked" && !["blocked_by_spec", "escalated"].includes(change.state)) {
      return false;
    }
    if (!query) {
      return true;
    }

    return [change.id, change.title, change.subtitle, change.state, change.nextAction, change.blocker]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export function buildViewCounts(views: BootstrapResponse["views"], changes: ChangeSummary[]) {
  const counts: Record<string, number> = {};
  for (const view of views) {
    counts[view.id] = changes.filter((change) => matchesView(change, view.id)).length;
  }
  return counts;
}

export function matchesView(change: ChangeSummary, viewId: string) {
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

export function describeFilter(filterId: string) {
  return (
    OPERATOR_FILTERS.find((filter) => filter.id === filterId) ?? {
      id: filterId,
      label: "Custom filter",
      hint: "Project-owned queue slice",
    }
  );
}

export function describeView(viewId: string) {
  return OPERATOR_VIEW_HINTS[viewId] ?? "Operator workbench slice";
}

export function resolveTenantId(payload: BootstrapResponse, preferredTenantId?: string) {
  if (preferredTenantId && payload.tenants.some((tenant) => tenant.id === preferredTenantId)) {
    return preferredTenantId;
  }

  return payload.activeTenantId;
}

export function resolveViewId(payload: BootstrapResponse, preferredViewId: string, defaultViewId: string) {
  if (payload.views.some((view) => view.id === preferredViewId)) {
    return preferredViewId;
  }

  return payload.views[0]?.id ?? defaultViewId;
}

export function resolveChangeSelection(changes: ChangeSummary[], preferredChangeId?: string | null) {
  if (preferredChangeId && changes.some((change) => change.id === preferredChangeId)) {
    return preferredChangeId;
  }

  return changes[0]?.id ?? null;
}
