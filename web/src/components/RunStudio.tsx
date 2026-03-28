import type { ApprovalRecord, RunRecord, RuntimeEvent } from "../types";

type RunStudioProps = {
  run: RunRecord | null;
  events: RuntimeEvent[];
  approvals: ApprovalRecord[];
  onApprovalDecision: (approvalId: string, decision: "accept" | "decline") => Promise<void>;
};

export function RunStudio({ run, events, approvals, onApprovalDecision }: RunStudioProps) {
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
    <section id="run-studio" className="panel detail-panel">
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
          <p className="eyebrow">Runtime Events</p>
          {events.length === 0 ? (
            <p>No runtime events captured for this run.</p>
          ) : (
            <div className="timeline">
              {events.map((event, index) => (
                <div key={`${event.type}-${index}`} className="timeline-event">
                  <span className="timeline-dot" />
                  <div>
                    <strong>{event.type}</strong>
                    <p>{summarizeEvent(event)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  {approval.status === "pending" && (
                    <span className="approval-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => void onApprovalDecision(approval.id, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => void onApprovalDecision(approval.id, "decline")}
                      >
                        Decline
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function summarizeEvent(event: RuntimeEvent) {
  const payload = event.payload;
  if (typeof payload.reason === "string") {
    return payload.reason;
  }
  if (typeof payload.text === "string") {
    return payload.text;
  }
  if (typeof payload.status === "string") {
    return payload.status;
  }
  return JSON.stringify(payload);
}
