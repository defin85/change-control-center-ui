import type { ChangeSummary } from "../types";

type QueuePanelProps = {
  changes: ChangeSummary[];
  selectedChangeId: string | null;
  onSelectChange: (changeId: string) => void;
};

export function QueuePanel({ changes, selectedChangeId, onSelectChange }: QueuePanelProps) {
  return (
    <section className="panel queue-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Control Queue</p>
          <h2>Active Changes</h2>
        </div>
      </div>
      <div className="queue-list">
        {changes.map((change) => (
          <button
            key={change.id}
            type="button"
            className={`queue-item ${selectedChangeId === change.id ? "active" : ""}`}
            onClick={() => onSelectChange(change.id)}
          >
            <div className="queue-main">
              <strong>{change.id}</strong>
              <span>{change.title}</span>
            </div>
            <div className="queue-meta">
              <span>{change.state}</span>
              <span>{change.mandatoryGapCount} mandatory gaps</span>
              <span>{change.nextAction}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

