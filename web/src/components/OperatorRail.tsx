import type { BootstrapResponse, ChangeDetailResponse, ChangeSummary } from "../types";

type OperatorRailProps = {
  views: BootstrapResponse["views"];
  changes: ChangeSummary[];
  detail: ChangeDetailResponse | null;
  viewCounts: Record<string, number>;
  activeViewId: string;
  activeFilterId: string;
  onSelectView: (viewId: string) => void;
  onSelectFilter: (filterId: string) => void;
};

const FILTERS = [
  { id: "all", label: "All severities", hint: "Everything in the active view" },
  { id: "needs-review", label: "Needs review", hint: "Open mandatory gaps only" },
  { id: "blocked", label: "Blocked", hint: "Escalated or spec-blocked" },
] as const;

const VIEW_HINTS: Record<string, string> = {
  inbox: "Open work awaiting chief attention",
  ready: "Ready to move",
  review: "Needs review or gap closure",
  blocked: "Blocked or escalated",
  done: "Completed and landed",
};

export function OperatorRail({
  views,
  changes,
  detail,
  viewCounts,
  activeViewId,
  activeFilterId,
  onSelectView,
  onSelectFilter,
}: OperatorRailProps) {
  const selectedChange = detail?.change ?? null;

  return (
    <aside className="operator-rail">
      <section className="panel rail-block">
        <div className="panel-head compact">
          <div>
            <p className="block-label">Views</p>
            <h2>Saved slices</h2>
          </div>
        </div>
        <div className="view-stack">
          {views.map((view) => {
            const count = viewCounts[view.id] ?? changes.filter((change) => viewMatches(change, view.id)).length;
            return (
              <button
                key={view.id}
                type="button"
                className={`rail-chip ${activeViewId === view.id ? "active" : ""}`}
                onClick={() => onSelectView(view.id)}
              >
                <span>
                  <strong>{view.label}</strong>
                  <small>{VIEW_HINTS[view.id] ?? "Operator view"}</small>
                </span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel rail-block">
        <div className="panel-head compact">
          <div>
            <p className="block-label">Filters</p>
            <h2>Queue filters</h2>
          </div>
        </div>
        <div className="chip-grid">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`filter-chip ${activeFilterId === filter.id ? "active" : ""}`}
              onClick={() => onSelectFilter(filter.id)}
            >
              <strong>{filter.label}</strong>
              <small>{filter.hint}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel rail-block">
        <div className="panel-head compact">
          <div>
            <p className="block-label">Chief policy</p>
            <h2>Operating gate</h2>
          </div>
        </div>
        {selectedChange ? (
          <div className="policy-card">
            <dl>
              <div>
                <dt>Auto cycles</dt>
                <dd>{selectedChange.policy?.maxAutoCycles ?? 3} max</dd>
              </div>
              <div>
                <dt>Escalate</dt>
                <dd>{selectedChange.policy?.escalationRule ?? "Recurring fingerprint ×2"}</dd>
              </div>
              <div>
                <dt>Acceptance gate</dt>
                <dd>{selectedChange.policy?.acceptanceGate ?? "Req -> Code -> Test must be green"}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="empty-state">Select a change to inspect the current chief policy.</p>
        )}
      </section>
    </aside>
  );
}

function viewMatches(change: ChangeSummary, viewId: string) {
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
