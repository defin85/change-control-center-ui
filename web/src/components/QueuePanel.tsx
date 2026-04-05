import type { BootstrapResponse, ChangeSummary } from "../types";
import { formatStateLabel } from "../lib";
import { PlatformPrimitives } from "../platform/foundation";
import { StatusBadge } from "../platform/shells/StatusBadge";

type QueuePanelProps = {
  changes: ChangeSummary[];
  selectedChangeId: string | null;
  views: BootstrapResponse["views"];
  viewCounts: Record<string, number>;
  filters: Array<{ id: string; label: string; hint: string }>;
  activeViewId: string;
  activeViewLabel: string;
  activeViewCount: number;
  activeFilterId: string;
  activeFilterLabel: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSelectView: (viewId: string) => void;
  onSelectFilter: (filterId: string) => void;
  onClearSelection: () => void;
  onSelectChange: (changeId: string) => void;
};

export function QueuePanel({
  changes,
  selectedChangeId,
  views,
  viewCounts,
  filters,
  activeViewId,
  activeViewLabel,
  activeViewCount,
  activeFilterId,
  activeFilterLabel,
  searchQuery,
  onSearchQueryChange,
  onSelectView,
  onSelectFilter,
  onClearSelection,
  onSelectChange,
}: QueuePanelProps) {
  const normalizedQuery = searchQuery.trim();

  return (
    <section className="queue-panel reference-panel reference-queue-panel" data-platform-surface="control-queue">
      <div className="reference-panel-heading reference-panel-heading--queue">
        <div>
          <p className="eyebrow">Live queue</p>
          <h2>{activeViewLabel}</h2>
          <p className="subtitle">{activeViewCount} backend-owned changes in the current slice</p>
        </div>
        <div className="reference-panel-actions">
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button reference-chip-button"
            data-platform-foundation="base-ui-queue-actions"
            data-platform-action="clear-selection"
            onClick={onClearSelection}
            disabled={!selectedChangeId}
          >
            Clear selection
          </PlatformPrimitives.Button>
        </div>
      </div>

      <div className="reference-queue-toolbar" data-platform-surface="queue-filter-context">
        <label className="reference-queue-search">
          <span>Search queue</span>
          <input
            aria-label="Queue search"
            className="reference-queue-search-input"
            name="queue-search"
            placeholder="gap, approval, blocker"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </label>
        <div className="reference-queue-chip-stack">
          {views.map((view) => (
            <PlatformPrimitives.Button
              key={view.id}
              type="button"
              className={`reference-chip-button ${activeViewId === view.id ? "active" : ""}`}
              data-platform-foundation="base-ui-operator-rail-view-action"
              onClick={() => onSelectView(view.id)}
            >
              <span>{view.label}</span>
              <strong>{viewCounts[view.id] ?? 0}</strong>
            </PlatformPrimitives.Button>
          ))}
        </div>
        <div className="reference-queue-chip-stack reference-queue-chip-stack--secondary">
          {filters.map((filter) => (
            <PlatformPrimitives.Button
              key={filter.id}
              type="button"
              className={`reference-chip-button ${activeFilterId === filter.id ? "active" : ""}`}
              data-platform-foundation="base-ui-operator-rail-filter-action"
              onClick={() => onSelectFilter(filter.id)}
            >
              <span>{filter.label}</span>
            </PlatformPrimitives.Button>
          ))}
        </div>
        <div className="reference-queue-context-note">
          <strong>{activeFilterLabel}</strong>
          <span>
            {normalizedQuery
              ? `Filtered by "${normalizedQuery}"`
              : "Showing the current queue slice without a search query."}
          </span>
        </div>
      </div>

      <div className="reference-queue-table" data-platform-foundation="tanstack-table">
        {changes.length === 0 ? (
          <div className="empty-state">No changes match the current slice. Try another view or clear search.</div>
        ) : (
          <div className="reference-queue-list">
            {changes.map((change) => (
              <PlatformPrimitives.Button
                key={change.id}
                type="button"
                className={`reference-queue-row ${selectedChangeId === change.id ? "active" : ""}`}
                data-platform-foundation="base-ui-queue-row"
                data-change-id={change.id}
                aria-label={`${change.id} ${change.title}`}
                aria-pressed={selectedChangeId === change.id}
                onClick={() => onSelectChange(change.id)}
              >
                <div className="reference-queue-row-main" data-platform-compact-field="change">
                  <span className="reference-compact-label" data-platform-compact-label>
                    Change
                  </span>
                  <div className="reference-queue-row-heading">
                    <strong>{change.title}</strong>
                    <StatusBadge status={change.state} label={formatStateLabel(change.state)} />
                  </div>
                  <p>{change.subtitle}</p>
                  <div className="reference-queue-row-meta">
                    <span>{change.id}</span>
                    <span>{change.lastRunAgo}</span>
                  </div>
                </div>
                <div className="reference-queue-row-side">
                  <div data-platform-compact-field="owner">
                    <span className="reference-compact-label" data-platform-compact-label>
                      Owner
                    </span>
                    <strong>{change.owner.label}</strong>
                    <p>{change.owner.id}</p>
                  </div>
                  <div>
                    <span className="reference-queue-row-label reference-compact-label" data-platform-compact-label>
                      Next step
                    </span>
                    <strong>{change.nextAction}</strong>
                  </div>
                  <div>
                    <span className="reference-queue-row-label">Blocker</span>
                    <p>{change.blocker}</p>
                  </div>
                  <div className="reference-queue-row-summary">
                    <span>{change.mandatoryGapCount} gaps</span>
                    <span>{change.loopCount} loops</span>
                    <span>{change.verificationStatus}</span>
                  </div>
                </div>
              </PlatformPrimitives.Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
