import type { BootstrapResponse, ChangeDetailResponse, ChangeSummary } from "../types";
import { PlatformPrimitives } from "../platform/foundation";
import { describeView, matchesView, OPERATOR_FILTERS } from "../platform/server-state";

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
    <aside className="operator-rail" data-platform-surface="queue-context">
      <section className="panel rail-block" data-platform-surface="saved-slices">
        <div className="panel-head compact">
          <div>
            <p className="block-label">Views</p>
            <h2>Saved slices</h2>
          </div>
        </div>
        <div className="view-stack">
          {views.map((view) => {
            const count = viewCounts[view.id] ?? changes.filter((change) => matchesView(change, view.id)).length;
            return (
              <PlatformPrimitives.Button
                key={view.id}
                type="button"
                className={`rail-chip ${activeViewId === view.id ? "active" : ""}`}
                data-platform-foundation="base-ui-operator-rail-view-action"
                onClick={() => onSelectView(view.id)}
              >
                <span>
                  <strong>{view.label}</strong>
                  <small>{describeView(view.id)}</small>
                </span>
                <span>{count}</span>
              </PlatformPrimitives.Button>
            );
          })}
        </div>
      </section>

      <section className="panel rail-block" data-platform-surface="queue-filters">
        <div className="panel-head compact">
          <div>
            <p className="block-label">Filters</p>
            <h2>Queue filters</h2>
          </div>
        </div>
        <div className="chip-grid">
          {OPERATOR_FILTERS.map((filter) => (
            <PlatformPrimitives.Button
              key={filter.id}
              type="button"
              className={`filter-chip ${activeFilterId === filter.id ? "active" : ""}`}
              data-platform-foundation="base-ui-operator-rail-filter-action"
              onClick={() => onSelectFilter(filter.id)}
            >
              <strong>{filter.label}</strong>
              <small>{filter.hint}</small>
            </PlatformPrimitives.Button>
          ))}
        </div>
      </section>

      <section className="panel rail-block" data-platform-surface="chief-policy">
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
