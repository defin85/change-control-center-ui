import type { RepositoryCatalogEntry } from "../../types";
import { PlatformPrimitives } from "../foundation";
import { StatusBadge } from "../shells/StatusBadge";
import { describeRepositoryCatalogFilter, type RepositoryCatalogFilterId, REPOSITORY_CATALOG_FILTERS } from "../server-state";

type RepositoryCatalogPanelProps = {
  entries: RepositoryCatalogEntry[];
  selectedTenantId: string | null;
  activeFilterId: RepositoryCatalogFilterId;
  isSelectionPending: boolean;
  selectionPendingLabel: string | null;
  selectionError: string | null;
  searchQuery: string;
  onSelectFilter: (filterId: RepositoryCatalogFilterId) => void;
  onSelectTenant: (tenantId: string) => void;
  onOpenCreateTenant: () => void;
};

export function RepositoryCatalogPanel({
  entries,
  selectedTenantId,
  activeFilterId,
  isSelectionPending,
  selectionPendingLabel,
  selectionError,
  searchQuery,
  onSelectFilter,
  onSelectTenant,
  onOpenCreateTenant,
}: RepositoryCatalogPanelProps) {
  const activeFilter = describeRepositoryCatalogFilter(activeFilterId);
  const normalizedQuery = searchQuery.trim();

  return (
    <section className="repository-catalog-panel reference-panel" data-platform-surface="repository-catalog">
      <div className="reference-panel-heading">
        <div>
          <p className="eyebrow">Repository catalog</p>
          <h2>{activeFilter.label}</h2>
          <p className="subtitle">{entries.length} repositories match the current portfolio slice</p>
        </div>
        <div className="reference-panel-actions">
          <button
            type="button"
            className="primary-button"
            data-platform-action="new-repository"
            onClick={onOpenCreateTenant}
          >
            New repository
          </button>
        </div>
      </div>

      <div className="reference-queue-toolbar" data-platform-surface="repository-catalog-filter-context">
        <div className="reference-queue-search reference-queue-search--static">
          <span>Search</span>
          <div className="reference-queue-search-readout">{normalizedQuery || "No active search query"}</div>
        </div>
        <div className="reference-queue-chip-stack">
          {REPOSITORY_CATALOG_FILTERS.map((filter) => (
            <PlatformPrimitives.Button
              key={filter.id}
              type="button"
              className={`reference-chip-button ${activeFilterId === filter.id ? "active" : ""}`}
              onClick={() => onSelectFilter(filter.id)}
            >
              <span>{filter.label}</span>
            </PlatformPrimitives.Button>
          ))}
        </div>
        <div className="reference-queue-context-note">
          <strong>{selectedTenantId ?? "No repository selected"}</strong>
          <span>Select a repository to inspect workload and move back into queue work.</span>
        </div>
      </div>

      <div className="reference-queue-table">
        {selectionError ? (
          <p className="governance-note" data-platform-governance="catalog-selection-error">
            <strong>Repository selection failed.</strong> {selectionError}
          </p>
        ) : null}
        {isSelectionPending ? (
          <p className="governance-note" data-platform-governance="catalog-selection-pending">
            {selectionPendingLabel ?? "Opening repository workspace..."}
          </p>
        ) : null}
        {entries.length === 0 ? (
          <div className="empty-state">
            No repositories match the current slice. Clear search or register a new repository.
            <div className="empty-state-actions">
              <button type="button" className="ghost-button" onClick={onOpenCreateTenant}>
                New repository
              </button>
            </div>
          </div>
        ) : (
          <div className="reference-queue-list reference-repository-list">
            {entries.map((entry) => (
              <PlatformPrimitives.Button
                key={entry.tenantId}
                type="button"
                className={`reference-queue-row reference-repository-row ${selectedTenantId === entry.tenantId ? "active" : ""}`}
                data-platform-foundation="base-ui-repository-row"
                data-tenant-id={entry.tenantId}
                aria-pressed={selectedTenantId === entry.tenantId}
                disabled={isSelectionPending}
                onClick={() => onSelectTenant(entry.tenantId)}
              >
                <div className="reference-queue-row-main" data-platform-compact-field="repository">
                  <span className="reference-compact-label" data-platform-compact-label>
                    Repository
                  </span>
                  <div className="reference-queue-row-heading">
                    <strong>{entry.name}</strong>
                    <StatusBadge status={entry.attentionState} label={formatAttentionLabel(entry.attentionState)} />
                  </div>
                  <p>{entry.description || "No repository description yet."}</p>
                  <div className="reference-queue-row-meta">
                    <span>{entry.repoPath}</span>
                  </div>
                </div>
                <div className="reference-queue-row-side">
                  <div data-platform-compact-field="recent">
                    <span className="reference-compact-label" data-platform-compact-label>
                      Recent
                    </span>
                    <strong>{entry.lastActivity}</strong>
                    <p>{entry.featuredChange ? `Latest activity around ${entry.featuredChange.id}.` : "No recent repository activity."}</p>
                  </div>
                  <div>
                    <span className="reference-queue-row-label reference-compact-label" data-platform-compact-label>
                      Next
                    </span>
                    <strong>{entry.nextRecommendedAction}</strong>
                  </div>
                  <div>
                    <span className="reference-queue-row-label">Load</span>
                    <p>
                      {entry.changeCount} changes · {entry.activeChangeCount} active · {entry.blockedChangeCount} blocked
                    </p>
                  </div>
                  <div className="reference-queue-row-summary">
                    <span>{entry.readyChangeCount} ready</span>
                    <span>{entry.featuredChange?.id ?? "No featured change"}</span>
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

function formatAttentionLabel(attentionState: RepositoryCatalogEntry["attentionState"]) {
  switch (attentionState) {
    case "needs_setup":
      return "Needs setup";
    case "blocked":
      return "Blocked";
    case "quiet":
      return "Quiet";
    default:
      return "Active";
  }
}
