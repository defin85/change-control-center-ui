import type { RepositoryCatalogEntry } from "../../types";

type RepositoryCatalogProfileProps = {
  entry: RepositoryCatalogEntry | null;
  onOpenQueue: () => void;
  onCreateChange: () => void;
  onOpenCreateTenant: () => void;
};

export function RepositoryCatalogProfile({
  entry,
  onOpenQueue,
  onCreateChange,
  onOpenCreateTenant,
}: RepositoryCatalogProfileProps) {
  if (!entry) {
    return (
      <section className="panel detail-panel repository-profile-panel" data-platform-surface="repository-profile">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Repository profile</p>
            <h2>No repository selected</h2>
            <p className="subtitle">Choose a repository from the catalog to inspect workload and next steps.</p>
          </div>
        </div>
        <div className="empty-state">
          Repository catalog management stays backend-owned. Start by selecting an existing repository or registering a
          new one.
          <div className="empty-state-actions">
            <button type="button" className="ghost-button" onClick={onOpenCreateTenant}>
              New repository
            </button>
          </div>
        </div>
      </section>
    );
  }

  const primaryActionLabel = entry.changeCount === 0 ? "Create first change" : "Open queue";

  return (
    <section className="panel detail-panel repository-profile-panel" data-platform-surface="repository-profile">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Repository profile</p>
          <h2>{entry.name}</h2>
          <p className="subtitle">{entry.description || "No repository description yet."}</p>
        </div>
        <div className="panel-head-actions">
          <button type="button" className="primary-button" onClick={entry.changeCount === 0 ? onCreateChange : onOpenQueue}>
            {primaryActionLabel}
          </button>
          <button type="button" className="ghost-button" onClick={onCreateChange}>
            New change
          </button>
        </div>
      </div>

      <div className="repository-path-card">
        <span className="block-label">Repo path</span>
        <strong>{entry.repoPath}</strong>
        <p className="muted">The selected repository remains the active tenant boundary for queue, runs, and memory.</p>
      </div>

      <div className="workspace-summary-grid repository-metrics-grid">
        <article className="metric-card">
          <span className="metric-label">Changes</span>
          <strong>{entry.changeCount}</strong>
          <p className="muted">Total tracked changes in this repository workspace.</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Active</span>
          <strong>{entry.activeChangeCount}</strong>
          <p className="muted">Draft, review, or execution work that still needs attention.</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Ready</span>
          <strong>{entry.readyChangeCount}</strong>
          <p className="muted">Changes that can move into the next operational step.</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Blocked</span>
          <strong>{entry.blockedChangeCount}</strong>
          <p className="muted">Escalated or spec-blocked work that needs operator review.</p>
        </article>
      </div>

      <div className="grid-two">
        <article className="card repository-highlight-card">
          <span className="block-label">Recent activity</span>
          <strong>{entry.lastActivity}</strong>
          <p className="muted">Backend-owned activity label for the repository currently in focus.</p>
        </article>
        <article className="card repository-highlight-card">
          <span className="block-label">Next recommendation</span>
          <strong>{entry.nextRecommendedAction}</strong>
          <p className="muted">Use the queue when you need change-level execution, not portfolio browsing.</p>
        </article>
      </div>

      <div className="card repository-featured-card">
        <span className="block-label">Featured change</span>
        {entry.featuredChange ? (
          <div className="stack">
            <strong>{entry.featuredChange.id}</strong>
            <p>{entry.featuredChange.title}</p>
            <p className="muted">
              {entry.featuredChange.state} · {entry.featuredChange.nextAction}
            </p>
          </div>
        ) : (
          <div className="empty-state">This repository has no change history yet. Create the first change to begin queue work.</div>
        )}
      </div>
    </section>
  );
}
