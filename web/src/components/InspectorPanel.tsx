import type { ChangeDetailResponse } from "../types";

type InspectorPanelProps = {
  detail: ChangeDetailResponse | null;
  selectedChangeId: string | null;
  onClearSelection: () => void;
};

export function InspectorPanel({ detail, selectedChangeId, onClearSelection }: InspectorPanelProps) {
  const change = detail?.change ?? null;

  return (
    <aside className="panel inspector-panel">
      <div className="panel-head compact">
        <div>
          <p className="block-label">Inspector</p>
          <h2>{selectedChangeId ? "Selected change" : "No selection"}</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onClearSelection} disabled={!selectedChangeId}>
          Clear selection
        </button>
      </div>

      {!change ? (
        <p className="empty-state">Pick a row in the control queue to inspect state, blockers, and landing status.</p>
      ) : (
        <div className="inspector-stack">
          <article className="metric-card">
            <p className="metric-label">Change</p>
            <strong>{change.id}</strong>
            <p className="muted">{change.subtitle}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Next best action</p>
            <strong>{change.nextAction}</strong>
            <p className="muted">{change.blocker}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Traceability</p>
            <strong>{change.traceability.length} entries</strong>
            <p className="muted">{change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length} mandatory gaps open</p>
          </article>
          <article className="mini-card">
            <p className="block-label">Chief policy</p>
            <div className="mini-card-list">
              <div>
                <strong>{change.policy?.maxAutoCycles ?? 3} auto cycles</strong>
                <span className="muted">before escalation</span>
              </div>
              <div>
                <strong>{change.policy?.escalationRule ?? "Recurring fingerprint ×2"}</strong>
                <span className="muted">recurrence threshold</span>
              </div>
              <div>
                <strong>{change.policy?.acceptanceGate ?? "Req -> Code -> Test must be green"}</strong>
                <span className="muted">delivery gate</span>
              </div>
            </div>
          </article>
        </div>
      )}
    </aside>
  );
}
