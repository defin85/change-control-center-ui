import type { ApprovalRecord, RunRecord } from "../types";

type RunStudioProps = {
  run: RunRecord | null;
  approvals: ApprovalRecord[];
};

export function RunStudio({ run, approvals }: RunStudioProps) {
  if (!run) {
    return (
      <section className="panel detail-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Run Studio</p>
            <h2>No Run Selected</h2>
          </div>
        </div>
        <p className="empty-state">Choose a run from the detail view to inspect its lineage and curated memory packet.</p>
      </section>
    );
  }

  return (
    <section className="panel detail-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Run Studio</p>
          <h2>{run.id}</h2>
        </div>
      </div>
      <div className="stack">
        <div className="key-value-grid">
          <div>
            <span>Kind</span>
            <strong>{run.kind}</strong>
          </div>
          <div>
            <span>Transport</span>
            <strong>{run.transport}</strong>
          </div>
          <div>
            <span>Thread</span>
            <strong>{run.threadId ?? "n/a"}</strong>
          </div>
          <div>
            <span>Turn</span>
            <strong>{run.turnId ?? "n/a"}</strong>
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Prompt</p>
          <pre>{run.prompt}</pre>
        </div>
        <div className="card">
          <p className="eyebrow">Memory Packet</p>
          <pre>{JSON.stringify(run.memoryPacket, null, 2)}</pre>
        </div>
        <div className="card">
          <p className="eyebrow">Approvals</p>
          {approvals.length === 0 ? (
            <p>No approvals captured for this run.</p>
          ) : (
            <ul>
              {approvals.map((approval) => (
                <li key={approval.id}>
                  <strong>{approval.status}</strong> {approval.kind}: {approval.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
