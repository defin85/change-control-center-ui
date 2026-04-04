import type { RepositoryCatalogEntry } from "../../types";
import { PlatformPrimitives } from "../foundation";
import { StatusBadge } from "../shells/StatusBadge";
import { describeRepositoryCatalogFilter, type RepositoryCatalogFilterId } from "../server-state";

type RepositoryCatalogPanelProps = {
  entries: RepositoryCatalogEntry[];
  selectedTenantId: string | null;
  activeFilterId: RepositoryCatalogFilterId;
  isSelectionPending: boolean;
  selectionPendingLabel: string | null;
  selectionError: string | null;
  searchQuery: string;
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
  onSelectTenant,
  onOpenCreateTenant,
}: RepositoryCatalogPanelProps) {
  const activeFilter = describeRepositoryCatalogFilter(activeFilterId);
  const normalizedQuery = searchQuery.trim();

  return (
    <section className="panel queue-panel repository-catalog-panel" data-platform-surface="repository-catalog">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Repository catalog</p>
          <h2>{activeFilter.label}</h2>
          <p className="subtitle">{entries.length} repositories match the current portfolio slice</p>
        </div>
        <div className="panel-head-actions">
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

      <div className="queue-context-grid" data-platform-surface="repository-catalog-filter-context">
        <article className="context-chip">
          <span>Slice</span>
          <strong>{activeFilter.label}</strong>
          <small>{activeFilter.hint}</small>
        </article>
        <article className="context-chip">
          <span>Search</span>
          <strong>{normalizedQuery || "No active search"}</strong>
          <small>{normalizedQuery ? "Catalog results are narrowed by repository search." : "Showing the full repository slice."}</small>
        </article>
        <article className="context-chip">
          <span>Focus</span>
          <strong>{selectedTenantId ?? "No repository selected"}</strong>
          <small>Select a repository to inspect its current workload and next step.</small>
        </article>
      </div>

      <div className="queue-list repository-catalog-list">
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
          entries.map((entry) => (
            <PlatformPrimitives.Button
              key={entry.tenantId}
              type="button"
              className={`queue-row repository-catalog-row ${selectedTenantId === entry.tenantId ? "active" : ""}`}
              data-platform-foundation="base-ui-repository-row"
              data-tenant-id={entry.tenantId}
              aria-pressed={selectedTenantId === entry.tenantId}
              disabled={isSelectionPending}
              onClick={() => onSelectTenant(entry.tenantId)}
            >
              <span className="responsive-field" data-platform-compact-field="repository">
                <span className="responsive-field-label" data-platform-compact-label>
                  Repository
                </span>
                <span className="responsive-field-value repository-title">
                  <strong>{entry.name}</strong>
                  <span>{entry.description || "No repository description yet."}</span>
                </span>
              </span>
              <span className="responsive-field" data-platform-compact-field="attention">
                <span className="responsive-field-label" data-platform-compact-label>
                  Attention
                </span>
                <span className="responsive-field-value">
                  <StatusBadge status={entry.attentionState} label={formatAttentionLabel(entry.attentionState)} />
                </span>
              </span>
              <span className="responsive-field" data-platform-compact-field="path">
                <span className="responsive-field-label" data-platform-compact-label>
                  Repo path
                </span>
                <span className="responsive-field-value repository-path">{entry.repoPath}</span>
              </span>
              <span className="responsive-field" data-platform-compact-field="load">
                <span className="responsive-field-label" data-platform-compact-label>
                  Load
                </span>
                <span className="responsive-field-value repository-load">
                  <strong>{entry.changeCount} changes</strong>
                  <span>
                    {entry.activeChangeCount} active · {entry.readyChangeCount} ready · {entry.blockedChangeCount} blocked
                  </span>
                </span>
              </span>
              <span className="responsive-field" data-platform-compact-field="activity">
                <span className="responsive-field-label" data-platform-compact-label>
                  Recent
                </span>
                <span className="responsive-field-value repository-activity">
                  <strong>{entry.lastActivity}</strong>
                  <span>
                    {entry.featuredChange
                      ? `Latest backend-owned activity across ${entry.featuredChange.id}.`
                      : "No recorded repository activity yet."}
                  </span>
                </span>
              </span>
              <span className="responsive-field" data-platform-compact-field="next">
                <span className="responsive-field-label" data-platform-compact-label>
                  Next
                </span>
                <span className="responsive-field-value repository-next">
                  <strong>{entry.nextRecommendedAction}</strong>
                  <span>
                    {entry.featuredChange
                      ? `${entry.featuredChange.id} · ${entry.featuredChange.title}`
                      : "Create the first change to start this repository workspace."}
                  </span>
                </span>
              </span>
            </PlatformPrimitives.Button>
          ))
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
