import type { ApprovalRecord, ChangeSummary, RunRecord, RuntimeEvent } from "../types";
import { PlatformPrimitives } from "../platform/foundation";
import { RunInspectionShell } from "../platform/shells/RunInspectionShell";
import { StatusBadge } from "../platform/shells/StatusBadge";
import { useAsyncWorkflowCommandMachine } from "../platform/workflow";

type RunDetailPanelProps = {
  panelId?: string;
  run: RunRecord | null;
  change: ChangeSummary | null;
  events: RuntimeEvent[];
  approvals: ApprovalRecord[];
  closeLabel: string;
  onApprovalDecision: (approvalId: string, decision: "accept" | "decline") => Promise<void>;
  onClose: () => void;
  onOpenChange?: (() => void) | null;
};

export function RunDetailPanel({
  panelId,
  run,
  change,
  events,
  approvals,
  closeLabel,
  onApprovalDecision,
  onClose,
  onOpenChange,
}: RunDetailPanelProps) {
  const approvalWorkflow = useAsyncWorkflowCommandMachine();

  if (!run) {
    return (
      <RunInspectionShell id={panelId} eyebrow="Selected run" title="No Run Selected">
        <p className="empty-state">
          Select a run from the Runs workspace or the change-local Runs tab to inspect normalized runtime context.
        </p>
      </RunInspectionShell>
    );
  }

  return (
    <RunInspectionShell
      id={panelId}
      eyebrow="Selected run"
      title={run.id}
      actions={
        <div className="action-row">
          {change && onOpenChange ? (
            <PlatformPrimitives.Button type="button" className="ghost-button" onClick={onOpenChange}>
              Open change
            </PlatformPrimitives.Button>
          ) : null}
          <PlatformPrimitives.Button type="button" className="ghost-button" onClick={onClose}>
            {closeLabel}
          </PlatformPrimitives.Button>
        </div>
      }
    >
      <div className="stack reference-run-studio">
        {change ? (
          <div className="reference-detail-card">
            <div className="reference-detail-stats">
              <div>
                <span>Change</span>
                <strong>{change.id}</strong>
              </div>
              <div>
                <span>Owner</span>
                <strong>{change.owner.label}</strong>
              </div>
              <div>
                <span>State</span>
                <strong>{change.state}</strong>
              </div>
            </div>
            <div className="reference-detail-actions">
              <span>{change.title}</span>
              <span>{change.nextAction}</span>
              <span>{change.lastRunAgo}</span>
            </div>
          </div>
        ) : null}
        <div className="key-value-grid run-facts-grid reference-run-studio-facts">
          <div>
            <span>Kind</span>
            <strong>{run.kind}</strong>
          </div>
          <div>
            <span>Status</span>
            <StatusBadge status={run.status} label={run.status} />
          </div>
          <div>
            <span>Result</span>
            <strong>{run.result}</strong>
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
        <div className="reference-detail-block">
          <div className="reference-detail-block-head">
            <h3>Run outcome</h3>
            <span>Operator summary</span>
          </div>
          <p>{run.outcome}</p>
          <p className="muted">{run.decision}</p>
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
        <div className="card reference-overview-card">
          <p className="eyebrow">Runtime events</p>
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
        <div className="card reference-overview-card">
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
                  {approval.status === "pending" ? (
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
                  ) : null}
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
