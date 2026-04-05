import { StatusBadge } from "../shells/StatusBadge";
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
      <section className="repository-profile-panel reference-panel" data-platform-surface="repository-profile">
        <div className="reference-panel-heading">
          <div>
            <p className="eyebrow">Selected repository</p>
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
    <section className="repository-profile-panel reference-panel reference-detail-panel" data-platform-surface="repository-profile">
      <div className="reference-detail-head">
        <div>
          <span className="eyebrow">Selected repository</span>
          <h2>{entry.name}</h2>
          <p>{entry.repoPath}</p>
        </div>
        <StatusBadge status={entry.attentionState} label={formatAttentionLabel(entry.attentionState)} />
      </div>

      <div className="reference-detail-card">
        <div className="reference-detail-stats">
          <div>
            <span>Changes</span>
            <strong>{entry.changeCount}</strong>
          </div>
          <div>
            <span>Ready</span>
            <strong>{entry.readyChangeCount}</strong>
          </div>
          <div>
            <span>Blocked</span>
            <strong>{entry.blockedChangeCount}</strong>
          </div>
        </div>
        <div className="reference-detail-actions">
          <button type="button" className="primary-button" onClick={entry.changeCount === 0 ? onCreateChange : onOpenQueue}>
            {primaryActionLabel}
          </button>
          <button type="button" className="ghost-button" onClick={onCreateChange}>
            New change
          </button>
        </div>
      </div>

      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Repository note</h3>
          <span>Backend-owned context</span>
        </div>
        <p>{entry.description || "No repository description yet."}</p>
      </div>

      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Current pressure</h3>
          <span>Live portfolio signals</span>
        </div>
        <dl className="reference-fact-list">
          <div>
            <dt>Active changes</dt>
            <dd>{entry.activeChangeCount}</dd>
          </div>
          <div>
            <dt>Last activity</dt>
            <dd>{entry.lastActivity}</dd>
          </div>
          <div>
            <dt>Next recommendation</dt>
            <dd>{entry.nextRecommendedAction}</dd>
          </div>
        </dl>
      </div>

      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Featured change</h3>
          <span>Queue handoff</span>
        </div>
        {entry.featuredChange ? (
          <div className="reference-featured-change">
            <strong>{entry.featuredChange.id}</strong>
            <p>{entry.featuredChange.title}</p>
            <span>
              {entry.featuredChange.state} · {entry.featuredChange.nextAction}
            </span>
          </div>
        ) : (
          <div className="empty-state">This repository has no change history yet. Create the first change to begin queue work.</div>
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
