import type { ChangeSummary } from "../types";
import { formatStateLabel } from "../lib";

type QueuePanelProps = {
  changes: ChangeSummary[];
  selectedChangeId: string | null;
  activeViewLabel: string;
  activeViewCount: number;
  onSelectChange: (changeId: string) => void;
  onSavedFilters: () => void;
  onExportReport: () => void;
};

export function QueuePanel({
  changes,
  selectedChangeId,
  activeViewLabel,
  activeViewCount,
  onSelectChange,
  onSavedFilters,
  onExportReport,
}: QueuePanelProps) {
  return (
    <section className="panel queue-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Control Queue</p>
          <h2>{activeViewLabel}</h2>
          <p className="subtitle">{activeViewCount} active changes in the current slice</p>
        </div>
        <div className="panel-head-actions">
          <button type="button" className="ghost-button" onClick={onSavedFilters}>
            Saved filters
          </button>
          <button type="button" className="ghost-button" onClick={onExportReport}>
            Export report
          </button>
        </div>
      </div>

      <div className="queue-table">
        <div className="queue-table-head">
          <span>ID</span>
          <span>Title</span>
          <span>State</span>
          <span>Gaps</span>
          <span>Loops</span>
          <span>Last run</span>
          <span>Blocker</span>
          <span>Next action</span>
        </div>

        <div className="queue-list">
          {changes.length === 0 ? (
            <div className="empty-state">No changes match the current slice. Try another view or clear search.</div>
          ) : (
            changes.map((change) => (
              <button
                key={change.id}
                type="button"
                className={`queue-row ${selectedChangeId === change.id ? "active" : ""}`}
                onClick={() => onSelectChange(change.id)}
              >
                <span className="queue-id">{change.id}</span>
                <span className="queue-title">
                  <strong>{change.title}</strong>
                  <span>{change.subtitle}</span>
                </span>
                <span className={`state-pill ${change.state}`}>{formatStateLabel(change.state)}</span>
                <span>
                  <strong>{change.mandatoryGapCount}</strong>
                </span>
                <span>{change.loopCount}</span>
                <span>{change.lastRunAgo}</span>
                <span>{change.blocker}</span>
                <span>{change.nextAction}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
