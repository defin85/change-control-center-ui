import type { ApprovalRecord, RunRecord, RuntimeEvent } from "../types";
import { PlatformPrimitives } from "../platform/foundation";
import { useAsyncWorkflowCommandMachine } from "../platform/workflow";
import { RunInspectionShell } from "../platform/shells/RunInspectionShell";

type RunStudioProps = {
  run: RunRecord | null;
  events: RuntimeEvent[];
  approvals: ApprovalRecord[];
  onApprovalDecision: (approvalId: string, decision: "accept" | "decline") => Promise<void>;
  onClose: () => void;
};

export function RunStudio({ run, events, approvals, onApprovalDecision, onClose }: RunStudioProps) {
  const approvalWorkflow = useAsyncWorkflowCommandMachine();

  if (!run) {
    return (
      <RunInspectionShell eyebrow="Run Studio" title="No Run Selected">
        <p className="empty-state">Choose a run from the detail view to inspect its lineage and curated memory packet.</p>
      </RunInspectionShell>
    );
  }

  return (
    <RunInspectionShell
      id="run-studio"
      eyebrow="Run Studio"
      title={run.id}
      actions={
        <PlatformPrimitives.Button type="button" className="ghost-button" onClick={onClose}>
          Back to change detail
        </PlatformPrimitives.Button>
      }
    >
      <div className="stack">
        <div className="key-value-grid run-facts-grid">
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
        <details className="artifact-disclosure">
          <summary>Prompt</summary>
          <div className="card run-artifact-card">
            <pre className="run-studio-code">{run.prompt}</pre>
          </div>
        </details>
        <details className="artifact-disclosure">
          <summary>Memory packet</summary>
          <div className="card run-artifact-card">
            <pre className="run-studio-code">{JSON.stringify(run.memoryPacket, null, 2)}</pre>
          </div>
        </details>
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
          {approvalWorkflow.error ? (
            <p className="empty-state">
              <strong>Approval workflow failed.</strong> {approvalWorkflow.error}
            </p>
          ) : null}
          {approvalWorkflow.isPending ? <p className="muted">{approvalWorkflow.activeLabel ?? "Resolving approval..."}</p> : null}
          {approvals.length === 0 ? (
            <p>No approvals captured for this run.</p>
          ) : (
            <ul>
              {approvals.map((approval) => (
                <li key={approval.id}>
                  <strong>{approval.status}</strong> {approval.kind}: {approval.reason}
                  {approval.status === "pending" && (
                    <span className="approval-actions" data-platform-foundation="base-ui-approval-actions">
                      <PlatformPrimitives.Button
                        type="button"
                        className="ghost-button"
                        data-platform-foundation="base-ui-approval-actions"
                        onClick={() =>
                          approvalWorkflow.runCommand({
                            label: `Accept ${approval.id}`,
                            execute: () => onApprovalDecision(approval.id, "accept"),
                          })
                        }
                        disabled={approvalWorkflow.isPending}
                      >
                        Accept
                      </PlatformPrimitives.Button>
                      <PlatformPrimitives.Button
                        type="button"
                        className="ghost-button"
                        data-platform-foundation="base-ui-approval-actions"
                        onClick={() =>
                          approvalWorkflow.runCommand({
                            label: `Decline ${approval.id}`,
                            execute: () => onApprovalDecision(approval.id, "decline"),
                          })
                        }
                        disabled={approvalWorkflow.isPending}
                      >
                        Decline
                      </PlatformPrimitives.Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </RunInspectionShell>
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
