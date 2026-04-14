import { useState } from "react";

import { formatStateLabel } from "../lib";
import {
  PlatformPrimitives,
  StatusBadge,
  useAsyncWorkflowCommandMachine,
  type QueueWorkspaceState,
} from "../platform";
import type { ChangeDetailResponse, ChangeDetailTabId, ClarificationAnswer } from "../types";

const DETAIL_TABS: Array<{ id: ChangeDetailTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "traceability", label: "Traceability" },
  { id: "gaps", label: "Gaps" },
  { id: "evidence", label: "Evidence" },
  { id: "git", label: "Git" },
  { id: "chief", label: "Chief" },
  { id: "clarifications", label: "Clarifications" },
];

type ReferenceSelectedChangeWorkspaceProps = {
  queueWorkspace: QueueWorkspaceState;
  onSelectTab: (tabId: ChangeDetailTabId) => void;
  onRetryDetail: () => void;
  onDeleteSelectedChange: () => Promise<void>;
  onRunSelectedChangeNextStep: () => Promise<void>;
  onEscalateSelectedChange: () => Promise<void>;
  onBlockSelectedChangeBySpec: () => Promise<void>;
  onCreateSelectedChangeClarificationRound: () => Promise<void>;
  onAnswerSelectedChangeClarificationRound: (
    roundId: string,
    answers: ClarificationAnswer[],
  ) => Promise<void>;
  onPromoteSelectedChangeFact: (title: string, body: string) => Promise<void>;
};

export function ReferenceSelectedChangeWorkspace({
  queueWorkspace,
  onSelectTab,
  onRetryDetail,
  onDeleteSelectedChange,
  onRunSelectedChangeNextStep,
  onEscalateSelectedChange,
  onBlockSelectedChangeBySpec,
  onCreateSelectedChangeClarificationRound,
  onAnswerSelectedChangeClarificationRound,
  onPromoteSelectedChangeFact,
}: ReferenceSelectedChangeWorkspaceProps) {
  if (queueWorkspace.status === "error") {
    return (
      <section
        className="reference-panel reference-queue-detail reference-selected-change-workspace"
        data-platform-surface="queue-selected-change-workspace"
        data-platform-detail-status="queue-error"
      >
        <div className="reference-panel-heading">
          <div>
            <p className="eyebrow">Selected change</p>
            <h2>Queue unavailable</h2>
            <p>{queueWorkspace.error}</p>
          </div>
        </div>
        <div className="empty-state">
          The shell will not invent a legacy detail surface while the queue contract is unavailable.
        </div>
      </section>
    );
  }

  if (queueWorkspace.status !== "ready" || !queueWorkspace.selectedChangeId) {
    return (
      <section
        className="reference-panel reference-queue-detail reference-selected-change-workspace"
        data-platform-surface="queue-selected-change-workspace"
        data-platform-detail-status={queueWorkspace.status === "loading" ? "queue-loading" : "idle"}
      >
        <div className="reference-panel-heading">
          <div>
            <p className="eyebrow">Selected change</p>
            <h2>Choose a queue row</h2>
            <p>Backend-owned detail now ships here once one visible queue item is in focus.</p>
          </div>
        </div>
        <div className="empty-state">
          {queueWorkspace.status === "loading"
            ? "Queue hydration is still in flight."
            : "Select a visible queue row to open overview, traceability, gaps, evidence, git, chief, and clarification history."}
        </div>
      </section>
    );
  }

  const selectedChange = queueWorkspace.selectedChange;

  if (!selectedChange) {
    return (
      <section
        className="reference-panel reference-queue-detail reference-selected-change-workspace"
        data-platform-surface="queue-selected-change-workspace"
        data-platform-detail-status="selection-missing"
      >
        <div className="reference-panel-heading">
          <div>
            <p className="eyebrow">Selected change</p>
            <h2>Selection is no longer visible</h2>
            <p>The shell kept queue context, but this change is not available in the current slice.</p>
          </div>
        </div>
        <div className="empty-state">Clear the current filter or choose another visible queue row.</div>
      </section>
    );
  }

  if (queueWorkspace.detailStatus === "loading" || queueWorkspace.detailStatus === "idle") {
    return (
      <section
        className="reference-panel reference-queue-detail reference-selected-change-workspace"
        data-platform-surface="queue-selected-change-workspace"
        data-platform-detail-status="loading"
      >
        <div className="reference-detail-head">
          <div>
            <span className="eyebrow">Selected change</span>
            <h2>{selectedChange.title}</h2>
            <p>{selectedChange.id}</p>
          </div>
          <StatusBadge status={selectedChange.state} label={formatStateLabel(selectedChange.state)} />
        </div>
        <div className="reference-status-bar">
          <span>{selectedChange.owner.label}</span>
          <span>{selectedChange.nextAction}</span>
          <span>{selectedChange.verificationStatus}</span>
        </div>
        <p className="governance-note" data-platform-governance="selected-change-loading">
          Hydrating backend-owned detail for {selectedChange.id}.
        </p>
      </section>
    );
  }

  if (queueWorkspace.detailStatus === "error" || !queueWorkspace.detail) {
    return (
      <section
        className="reference-panel reference-queue-detail reference-selected-change-workspace"
        data-platform-surface="queue-selected-change-workspace"
        data-platform-detail-status="error"
      >
        <div className="reference-detail-head">
          <div>
            <span className="eyebrow">Selected change</span>
            <h2>{selectedChange.title}</h2>
            <p>{selectedChange.id}</p>
          </div>
          <StatusBadge status={selectedChange.state} label={formatStateLabel(selectedChange.state)} />
        </div>
        <p className="governance-note" data-platform-governance="selected-change-error">
          <strong>Selected change detail failed.</strong>{" "}
          {queueWorkspace.detailError ?? `Unable to hydrate backend-owned detail for ${selectedChange.id}.`}
        </p>
        <div className="empty-state">
          The shell fails closed here instead of reviving a hidden legacy detail path.
          <div className="empty-state-actions">
            <button type="button" className="primary-button" onClick={onRetryDetail}>
              Retry detail
            </button>
          </div>
        </div>
      </section>
    );
  }

  const { change, clarificationRounds, focusGraph, runs, tenantMemory } = queueWorkspace.detail;
  const openMandatoryGapCount = change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length;

  return (
    <section
      className="reference-panel reference-queue-detail reference-selected-change-workspace"
      data-platform-surface="queue-selected-change-workspace"
      data-platform-detail-status="ready"
    >
      <div className="reference-detail-head">
        <div>
          <span className="eyebrow">Selected change</span>
          <h2>{change.title}</h2>
          <p>{change.id}</p>
        </div>
        <StatusBadge status={change.state} label={formatStateLabel(change.state)} />
      </div>

      <div className="reference-status-bar">
        <span>{change.owner.label}</span>
        <span>{change.nextAction}</span>
        <span>{change.verificationStatus}</span>
        <span>{change.loopCount} loops</span>
      </div>

      <div className="reference-detail-card">
        <div className="reference-detail-stats">
          <div>
            <span>Summary</span>
            <strong>{change.summary}</strong>
          </div>
          <div>
            <span>Mandatory gaps</span>
            <strong>{openMandatoryGapCount > 0 ? `${openMandatoryGapCount} open` : "Clear"}</strong>
          </div>
          <div>
            <span>Focus graph</span>
            <strong>{focusGraph.items.length > 0 ? `${focusGraph.items.length} active` : "Quiet"}</strong>
          </div>
        </div>
        <div className="reference-detail-actions">
          <span>{change.blocker}</span>
          <span>{runs.length > 0 ? `${runs.length} change runs recorded` : "Runs workspace lands in 06"}</span>
          <span>{clarificationRounds.length > 0 ? `${clarificationRounds.length} clarification rounds` : "No clarification rounds"}</span>
        </div>
      </div>

      <SelectedChangeCommands
        key={queueWorkspace.detail.change.id}
        detail={queueWorkspace.detail}
        onDeleteSelectedChange={onDeleteSelectedChange}
        onRunSelectedChangeNextStep={onRunSelectedChangeNextStep}
        onEscalateSelectedChange={onEscalateSelectedChange}
        onBlockSelectedChangeBySpec={onBlockSelectedChangeBySpec}
      />

      <PlatformPrimitives.Tabs.Root
        value={queueWorkspace.activeTabId}
        onValueChange={(value) => {
          if (typeof value === "string" && DETAIL_TABS.some((tab) => tab.id === value)) {
            onSelectTab(value as ChangeDetailTabId);
          }
        }}
      >
        <PlatformPrimitives.Tabs.List className="tab-list" aria-label="Selected change sections">
          {DETAIL_TABS.map((tab) => (
            <PlatformPrimitives.Tabs.Tab
              key={tab.id}
              value={tab.id}
              data-platform-action={`selected-change-tab-${tab.id}`}
            >
              {tab.label}
            </PlatformPrimitives.Tabs.Tab>
          ))}
        </PlatformPrimitives.Tabs.List>
      </PlatformPrimitives.Tabs.Root>

      <div
        className="reference-selected-change-panel"
        data-platform-surface="selected-change-tab-panel"
        data-platform-tab={queueWorkspace.activeTabId}
      >
        {queueWorkspace.activeTabId === "overview" ? (
          <OverviewTab detail={queueWorkspace.detail} />
        ) : null}
        {queueWorkspace.activeTabId === "traceability" ? (
          <TraceabilityTab detail={queueWorkspace.detail} />
        ) : null}
        {queueWorkspace.activeTabId === "gaps" ? <GapsTab detail={queueWorkspace.detail} /> : null}
        {queueWorkspace.activeTabId === "evidence" ? (
          <EvidenceTab detail={queueWorkspace.detail} />
        ) : null}
        {queueWorkspace.activeTabId === "git" ? <GitTab detail={queueWorkspace.detail} /> : null}
        {queueWorkspace.activeTabId === "chief" ? (
          <ChiefTab
            detail={queueWorkspace.detail}
            tenantMemory={tenantMemory}
            onPromoteSelectedChangeFact={onPromoteSelectedChangeFact}
          />
        ) : null}
        {queueWorkspace.activeTabId === "clarifications" ? (
          <ClarificationsTab
            detail={queueWorkspace.detail}
            onCreateSelectedChangeClarificationRound={onCreateSelectedChangeClarificationRound}
            onAnswerSelectedChangeClarificationRound={onAnswerSelectedChangeClarificationRound}
          />
        ) : null}
      </div>
    </section>
  );
}

type SelectedChangeCommandsProps = {
  detail: ChangeDetailResponse;
  onDeleteSelectedChange: () => Promise<void>;
  onRunSelectedChangeNextStep: () => Promise<void>;
  onEscalateSelectedChange: () => Promise<void>;
  onBlockSelectedChangeBySpec: () => Promise<void>;
};

function SelectedChangeCommands({
  detail,
  onDeleteSelectedChange,
  onRunSelectedChangeNextStep,
  onEscalateSelectedChange,
  onBlockSelectedChangeBySpec,
}: SelectedChangeCommandsProps) {
  const {
    activeLabel,
    error: commandError,
    isPending,
    runCommand,
  } = useAsyncWorkflowCommandMachine();
  const availability = resolveSelectedChangeCommandAvailability(detail);
  const unavailableMessages = Array.from(
    new Set(
      [availability.runNext.reason, availability.escalate.reason, availability.blockBySpec.reason, availability.delete.reason].filter(
        (reason): reason is string => Boolean(reason),
      ),
    ),
  );

  return (
    <div className="reference-detail-block reference-selected-change-commands">
      <div className="reference-detail-block-head">
        <h3>Operator commands</h3>
        <span>Explicit backend-owned mutation boundaries</span>
      </div>
      <div className="reference-selected-change-command-grid">
        <button
          type="button"
          className="primary-button"
          data-platform-action="run-next-step"
          disabled={!availability.runNext.enabled || isPending}
          onClick={() =>
            runCommand({
              label: `Run next step for ${detail.change.id}`,
              execute: onRunSelectedChangeNextStep,
            })
          }
        >
          Run next step
        </button>
        <button
          type="button"
          className="ghost-button"
          data-platform-action="escalate-change"
          disabled={!availability.escalate.enabled || isPending}
          onClick={() =>
            runCommand({
              label: `Escalate ${detail.change.id}`,
              execute: onEscalateSelectedChange,
            })
          }
        >
          Escalate
        </button>
        <button
          type="button"
          className="ghost-button"
          data-platform-action="block-change-by-spec"
          disabled={!availability.blockBySpec.enabled || isPending}
          onClick={() =>
            runCommand({
              label: `Mark ${detail.change.id} blocked by spec`,
              execute: onBlockSelectedChangeBySpec,
            })
          }
        >
          Mark blocked by spec
        </button>
        <button
          type="button"
          className="ghost-button"
          data-platform-action="delete-change"
          disabled={!availability.delete.enabled || isPending}
          onClick={() =>
            runCommand({
              label: `Delete ${detail.change.id}`,
              execute: onDeleteSelectedChange,
            })
          }
        >
          Delete change
        </button>
      </div>
      {isPending ? (
        <p className="governance-note" data-platform-governance="selected-change-command-pending">
          {activeLabel ?? "Running backend-owned operator command..."}
        </p>
      ) : null}
      {commandError ? (
        <p className="governance-note" data-platform-governance="selected-change-command-error">
          <strong>Command failed.</strong> {commandError}
        </p>
      ) : null}
      {unavailableMessages.length > 0 ? (
        <p className="governance-note" data-platform-governance="selected-change-command-unavailable">
          <strong>Unavailable commands stay closed.</strong> {unavailableMessages.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

function resolveSelectedChangeCommandAvailability(detail: ChangeDetailResponse) {
  const { change, runs } = detail;
  const hasActiveRun = runs.some((run) => !["completed", "failed", "interrupted"].includes(run.status));

  return {
    runNext: {
      enabled: !hasActiveRun && !["blocked_by_spec", "escalated", "done"].includes(change.state),
      reason: hasActiveRun
        ? "Run next step stays disabled while a backend-owned run is already active."
        : ["blocked_by_spec", "escalated", "done"].includes(change.state)
          ? "Run next step stays disabled once the change is blocked, escalated, or already done."
          : null,
    },
    escalate: {
      enabled: !["escalated", "done"].includes(change.state),
      reason: ["escalated", "done"].includes(change.state)
        ? "Escalate stays disabled once the change is already escalated or done."
        : null,
    },
    blockBySpec: {
      enabled: !["blocked_by_spec", "done"].includes(change.state),
      reason: ["blocked_by_spec", "done"].includes(change.state)
        ? "Mark blocked by spec stays disabled once the change is already blocked or done."
        : null,
    },
    delete: {
      enabled: !hasActiveRun,
      reason: hasActiveRun
        ? "Delete change stays disabled while a backend-owned run is still active."
        : null,
    },
  };
}

function OverviewTab({ detail }: { detail: ChangeDetailResponse }) {
  const { change, focusGraph } = detail;

  return (
    <div className="reference-detail-stack">
      <div className="grid-two reference-overview-grid">
        <div className="card reference-overview-card">
          <p className="eyebrow">Contract</p>
          <strong>{change.contract.goal}</strong>
          <ul className="reference-detail-list">
            {change.contract.acceptanceCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </div>
        <div className="card reference-overview-card">
          <p className="eyebrow">Working memory</p>
          <strong>{change.memory.summary}</strong>
          <ul className="reference-detail-list">
            {change.memory.activeFocus.length > 0
              ? change.memory.activeFocus.map((focus) => <li key={focus}>{focus}</li>)
              : [<li key="no-focus">No active focus items recorded.</li>]}
          </ul>
        </div>
      </div>

      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Timeline</h3>
          <span>Backend-owned milestones</span>
        </div>
        {change.timeline.length > 0 ? (
          <div className="reference-timeline">
            {change.timeline.map((entry) => (
              <div key={`${entry.title}-${entry.note}`} className="reference-timeline-row">
                <span className="reference-timeline-dot" aria-hidden="true" />
                <div>
                  <strong>{entry.title}</strong>
                  <p>{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No timeline milestones recorded.</p>
        )}
      </div>

      <div className="grid-two">
        <div className="card">
          <p className="eyebrow">Open questions</p>
          <ul className="reference-detail-list">
            {change.memory.openQuestions.length > 0
              ? change.memory.openQuestions.map((question) => <li key={question}>{question}</li>)
              : [<li key="no-questions">No open questions remain.</li>]}
          </ul>
        </div>
        <div className="card">
          <p className="eyebrow">Decisions</p>
          <ul className="reference-detail-list">
            {change.memory.decisions.length > 0
              ? change.memory.decisions.map((decision) => <li key={decision}>{decision}</li>)
              : [<li key="no-decisions">No durable decisions captured yet.</li>]}
          </ul>
        </div>
      </div>

      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Focus graph</h3>
          <span>{focusGraph.items.length > 0 ? "Active operator context" : "No active focus items"}</span>
        </div>
        {focusGraph.items.length > 0 ? (
          <div className="grid-two">
            {focusGraph.items.map((item) => (
              <div key={item.id} className="mini-card">
                <strong>{item.title}</strong>
                <p className="muted">{item.kind}</p>
                <span className="reference-detail-inline-note">{item.status ?? "status unavailable"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No active focus items.</p>
        )}
      </div>
    </div>
  );
}

function TraceabilityTab({ detail }: { detail: ChangeDetailResponse }) {
  const entries = detail.change.traceability;

  if (entries.length === 0) {
    return <div className="empty-state">No traceability records have been captured yet.</div>;
  }

  return (
    <div className="reference-detail-stack">
      {entries.map((entry) => (
        <div key={`${entry.req}-${entry.code}`} className="reference-detail-block">
          <div className="reference-detail-block-head">
            <h3>{entry.req}</h3>
            <span>{entry.status}</span>
          </div>
          <div className="grid-two">
            <div className="mini-card">
              <strong>Code</strong>
              <p>{entry.code}</p>
            </div>
            <div className="mini-card">
              <strong>Tests</strong>
              <p>{entry.tests}</p>
            </div>
          </div>
          <div className="mini-card">
            <strong>Evidence</strong>
            <p>{entry.evidence}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function GapsTab({ detail }: { detail: ChangeDetailResponse }) {
  const gaps = detail.change.gaps;

  if (gaps.length === 0) {
    return <div className="empty-state">No gaps are currently attached to this change.</div>;
  }

  return (
    <div className="reference-detail-stack">
      {gaps.map((gap) => (
        <div key={gap.id} className="reference-detail-block">
          <div className="reference-detail-block-head">
            <h3>{gap.id}</h3>
            <span>{gap.status}</span>
          </div>
          <div className="reference-detail-actions">
            <span>{gap.severity}</span>
            <span>{gap.mandatory ? "mandatory" : "advisory"}</span>
            <span>{gap.reqRef ?? "No req ref"}</span>
            <span>{gap.recurrence} repeats</span>
          </div>
          <p>{gap.summary}</p>
          <div className="grid-two">
            <div className="mini-card">
              <strong>Evidence</strong>
              <p>{gap.evidence ?? "No attached evidence excerpt."}</p>
            </div>
            <div className="mini-card">
              <strong>Fingerprint</strong>
              <p>{gap.fingerprint ?? "No fingerprint recorded."}</p>
            </div>
            <div className="mini-card">
              <strong>First seen</strong>
              <p>{gap.firstSeen ?? "Unknown"}</p>
            </div>
            <div className="mini-card">
              <strong>Last seen</strong>
              <p>{gap.lastSeen ?? "Unknown"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenceTab({ detail }: { detail: ChangeDetailResponse }) {
  if (detail.evidence.length === 0) {
    return <div className="empty-state">No evidence artifacts have been recorded yet.</div>;
  }

  return (
    <div className="reference-detail-stack">
      {detail.evidence.map((artifact) => (
        <div key={artifact.id} className="reference-detail-block">
          <div className="reference-detail-block-head">
            <h3>{artifact.title}</h3>
            <span>{artifact.kind}</span>
          </div>
          <p className="reference-evidence-body">{artifact.body}</p>
          <div className="reference-detail-actions">
            <span>{artifact.id}</span>
            <span>{artifact.runId ?? "No run attached"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function GitTab({ detail }: { detail: ChangeDetailResponse }) {
  const { git } = detail.change;

  return (
    <div className="grid-two">
      <div className="mini-card">
        <strong>Worktree</strong>
        <p>{git.worktree}</p>
      </div>
      <div className="mini-card">
        <strong>Branch</strong>
        <p>{git.branch}</p>
      </div>
      <div className="mini-card">
        <strong>Changed files</strong>
        <p>{git.changedFiles}</p>
      </div>
      <div className="mini-card">
        <strong>Commit status</strong>
        <p>{git.commitStatus}</p>
      </div>
      <div className="mini-card">
        <strong>Merge readiness</strong>
        <p>{git.mergeReadiness}</p>
      </div>
      <div className="mini-card">
        <strong>PR status</strong>
        <p>{git.prStatus ?? "no PR"}</p>
      </div>
    </div>
  );
}

function ChiefTab({
  detail,
  tenantMemory,
  onPromoteSelectedChangeFact,
}: {
  detail: ChangeDetailResponse;
  tenantMemory: ChangeDetailResponse["tenantMemory"];
  onPromoteSelectedChangeFact: (title: string, body: string) => Promise<void>;
}) {
  const { change, focusGraph } = detail;
  const promotionWorkflow = useAsyncWorkflowCommandMachine();
  const [factTitle, setFactTitle] = useState("");
  const [factBody, setFactBody] = useState("");
  const normalizedFactTitle = factTitle.trim();
  const normalizedFactBody = factBody.trim();
  const canPromoteFact = normalizedFactTitle.length > 0 && normalizedFactBody.length > 0;

  return (
    <div className="reference-detail-stack">
      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Chief history</h3>
          <span>Current operator guidance</span>
        </div>
        {change.chiefHistory.length > 0 ? (
          <div className="reference-timeline">
            {change.chiefHistory.map((entry) => (
              <div key={`${entry.at}-${entry.title}`} className="reference-timeline-row">
                <span className="reference-timeline-dot" aria-hidden="true" />
                <div>
                  <strong>
                    {entry.at} · {entry.title}
                  </strong>
                  <p>{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No chief events have been recorded yet.</p>
        )}
      </div>

      <div className="state-machine">
        <div className="machine-node current">
          <span>current</span>
          <strong>{formatStateLabel(change.state)}</strong>
        </div>
        <div className="machine-node available">
          <span>next</span>
          <strong>{change.nextAction}</strong>
        </div>
      </div>

      <div className="grid-two">
        <div className="policy-card">
          <p className="eyebrow">Workflow gate</p>
          <dl>
            <div>
              <dt>Escalation rule</dt>
              <dd>{change.policy?.escalationRule ?? "No policy recorded"}</dd>
            </div>
            <div>
              <dt>Acceptance gate</dt>
              <dd>{change.policy?.acceptanceGate ?? "Req -> Code -> Test"}</dd>
            </div>
            <div>
              <dt>Auto cycles</dt>
              <dd>{change.policy?.maxAutoCycles ?? 0}</dd>
            </div>
          </dl>
        </div>
        <div className="card">
          <p className="eyebrow">Tenant memory</p>
          <ul className="reference-detail-list" data-platform-surface="tenant-memory-list">
            {tenantMemory.length > 0
              ? tenantMemory.map((fact) => (
                  <li key={fact.id}>
                    <strong>{fact.title}</strong>: {fact.body}
                  </li>
                ))
              : [<li key="no-tenant-memory">No tenant memory facts promoted yet.</li>]}
          </ul>
          <div className="reference-inline-form">
            <div className="reference-detail-block-head">
              <strong>Promote durable fact</strong>
              <span>Backend-owned tenant memory write</span>
            </div>
            <label className="field-stack">
              <span>Fact title</span>
              <input
                aria-label="Fact title"
                name="fact-title"
                placeholder="Runtime adapter default deployment"
                type="text"
                value={factTitle}
                onChange={(event) => setFactTitle(event.target.value)}
              />
            </label>
            <label className="field-stack">
              <span>Fact body</span>
              <textarea
                aria-label="Fact body"
                name="fact-body"
                placeholder="Sidecar rollout is approved for the first release."
                value={factBody}
                onChange={(event) => setFactBody(event.target.value)}
              />
            </label>
            {promotionWorkflow.error ? (
              <p className="governance-note" data-platform-governance="promote-fact-error">
                <strong>Fact promotion failed.</strong> {promotionWorkflow.error}
              </p>
            ) : null}
            {promotionWorkflow.isPending ? (
              <p className="governance-note" data-platform-governance="promote-fact-pending">
                {promotionWorkflow.activeLabel ?? "Promoting durable fact to tenant memory..."}
              </p>
            ) : null}
            <div className="reference-inline-actions">
              <button
                type="button"
                className="primary-button"
                data-platform-action="promote-tenant-fact"
                disabled={!canPromoteFact || promotionWorkflow.isPending}
                onClick={() =>
                  promotionWorkflow.runCommand({
                    label: `Promote fact for ${change.id}`,
                    execute: async () => {
                      await onPromoteSelectedChangeFact(normalizedFactTitle, normalizedFactBody);
                      setFactTitle("");
                      setFactBody("");
                    },
                  })
                }
              >
                Promote fact
              </button>
            </div>
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Change memory facts</p>
          <ul className="reference-detail-list" data-platform-surface="change-memory-facts">
            {change.memory.facts.length > 0
              ? change.memory.facts.map((fact) => (
                  <li key={fact.id}>
                    <strong>{fact.title}</strong>: {fact.body}
                  </li>
                ))
              : [<li key="no-change-facts">No durable facts promoted into this change yet.</li>]}
          </ul>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Focus graph</p>
        <ul className="reference-detail-list">
          {focusGraph.items.length > 0
            ? focusGraph.items.map((item) => (
                <li key={item.id}>
                  <strong>{item.kind}</strong>: {item.title} ({item.status ?? "unknown"})
                </li>
              ))
            : [<li key="no-focus-graph">No focus graph items recorded.</li>]}
        </ul>
      </div>
    </div>
  );
}

function ClarificationsTab({
  detail,
  onCreateSelectedChangeClarificationRound,
  onAnswerSelectedChangeClarificationRound,
}: {
  detail: ChangeDetailResponse;
  onCreateSelectedChangeClarificationRound: () => Promise<void>;
  onAnswerSelectedChangeClarificationRound: (
    roundId: string,
    answers: ClarificationAnswer[],
  ) => Promise<void>;
}) {
  const { change, clarificationRounds } = detail;
  const generationWorkflow = useAsyncWorkflowCommandMachine();
  const openRound = clarificationRounds.find((round) => round.status === "open") ?? null;
  const clarificationUnavailableMessages = [
    openRound ? "Clarification generation stays disabled while an open round already exists." : null,
  ].filter((message): message is string => Boolean(message));

  return (
    <div className="reference-detail-stack">
      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Clarification workflow</h3>
          <span>Backend-owned planning loop</span>
        </div>
        <div className="reference-inline-actions">
          <button
            type="button"
            className="primary-button"
            data-platform-action="generate-clarification-round"
            disabled={openRound !== null || generationWorkflow.isPending}
            onClick={() =>
              generationWorkflow.runCommand({
                label: `Generate clarification round for ${change.id}`,
                execute: onCreateSelectedChangeClarificationRound,
              })
            }
          >
            Generate clarification round
          </button>
        </div>
        {generationWorkflow.isPending ? (
          <p className="governance-note" data-platform-governance="clarification-command-pending">
            {generationWorkflow.activeLabel ?? "Running backend-owned clarification workflow..."}
          </p>
        ) : null}
        {generationWorkflow.error ? (
          <p className="governance-note" data-platform-governance="clarification-command-error">
            <strong>Clarification workflow failed.</strong> {generationWorkflow.error}
          </p>
        ) : null}
        {clarificationUnavailableMessages.length > 0 ? (
          <p className="governance-note" data-platform-governance="clarification-command-unavailable">
            <strong>Unavailable clarification actions stay closed.</strong>{" "}
            {clarificationUnavailableMessages.join(" ")}
          </p>
        ) : null}
      </div>

      {openRound ? (
        <OpenClarificationRoundForm
          key={openRound.id}
          round={openRound}
          isGenerationPending={generationWorkflow.isPending}
          onAnswerSelectedChangeClarificationRound={onAnswerSelectedChangeClarificationRound}
        />
      ) : null}

      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Clarification history</h3>
          <span>{clarificationRounds.length > 0 ? "Rounds recorded in backend state" : "No rounds yet"}</span>
        </div>
        {clarificationRounds.length > 0 ? (
          <div className="reference-detail-stack">
            {clarificationRounds.map((round) => (
              <div
                key={round.id}
                className="card"
                data-clarification-round-id={round.id}
                data-clarification-round-status={round.status}
              >
                <div className="reference-detail-block-head">
                  <strong>{round.rationale}</strong>
                  <span>{round.status}</span>
                </div>
                <p className="muted">
                  {round.createdAt} {"->"} {round.updatedAt}
                </p>
                <ul className="reference-detail-list">
                  {round.questions.map((question) => {
                    const answer = round.answers.find((item) => item.questionId === question.id);
                    return (
                      <li key={question.id}>
                        <strong>{question.label}</strong>
                        {" "}
                        {answer
                          ? `-> ${answer.selectedOptionId}${answer.freeformNote ? ` (${answer.freeformNote})` : ""}`
                          : "-> unanswered"}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No clarification rounds are currently attached to this change.</p>
        )}
      </div>

      <div className="card">
        <p className="eyebrow">Clarification memory</p>
        <ul className="reference-detail-list">
          {change.memory.clarifications.length > 0
              ? change.memory.clarifications.map((entry) => (
                  <li key={entry.questionId}>
                    <strong>{entry.question}</strong>
                    {" "}
                    {"->"} {entry.selectedOptionId}
                    {entry.freeformNote ? ` (${entry.freeformNote})` : ""}
                  </li>
                ))
            : [<li key="no-clarification-memory">No clarification memory entries promoted yet.</li>]}
        </ul>
      </div>
    </div>
  );
}

type OpenClarificationRoundFormProps = {
  round: ChangeDetailResponse["clarificationRounds"][number];
  isGenerationPending: boolean;
  onAnswerSelectedChangeClarificationRound: (
    roundId: string,
    answers: ClarificationAnswer[],
  ) => Promise<void>;
};

function OpenClarificationRoundForm({
  round,
  isGenerationPending,
  onAnswerSelectedChangeClarificationRound,
}: OpenClarificationRoundFormProps) {
  const answerWorkflow = useAsyncWorkflowCommandMachine();
  const [answerDrafts, setAnswerDrafts] = useState<
    Record<string, { selectedOptionId: string; freeformNote: string }>
  >(() =>
    Object.fromEntries(
      round.questions.map((question) => {
        const existingAnswer = round.answers.find((answer) => answer.questionId === question.id);

        return [
          question.id,
          {
            selectedOptionId: existingAnswer?.selectedOptionId ?? "",
            freeformNote: existingAnswer?.freeformNote ?? "",
          },
        ];
      }),
    ),
  );

  const canSubmitAnswers = round.questions.every(
    (question) => (answerDrafts[question.id]?.selectedOptionId ?? "").trim().length > 0,
  );
  const submittedAnswers = round.questions.map((question) => {
    const draft = answerDrafts[question.id];

    return {
      questionId: question.id,
      selectedOptionId: draft?.selectedOptionId ?? "",
      freeformNote: draft?.freeformNote?.trim() ? draft.freeformNote.trim() : undefined,
    };
  });

  return (
    <div
      className="reference-detail-block"
      data-platform-surface="open-clarification-round"
      data-clarification-round-id={round.id}
    >
      <div className="reference-detail-block-head">
        <h3>Open clarification round</h3>
        <span>{round.rationale}</span>
      </div>
      <div className="reference-inline-form">
        {round.questions.map((question) => (
          <div key={question.id} className="card">
            <label className="field-stack">
              <span>{question.label}</span>
              <select
                aria-label={question.label}
                value={answerDrafts[question.id]?.selectedOptionId ?? ""}
                onChange={(event) =>
                  setAnswerDrafts((current) => ({
                    ...current,
                    [question.id]: {
                      selectedOptionId: event.target.value,
                      freeformNote: current[question.id]?.freeformNote ?? "",
                    },
                  }))
                }
              >
                <option value="">Choose an answer</option>
                {question.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="reference-detail-inline-note">
              {question.options.map((option) => `${option.label}: ${option.description}`).join(" ")}
            </p>
            {question.allowOther ? (
              <label className="field-stack">
                <span>Freeform note</span>
                <textarea
                  aria-label={`${question.label} note`}
                  value={answerDrafts[question.id]?.freeformNote ?? ""}
                  onChange={(event) =>
                    setAnswerDrafts((current) => ({
                      ...current,
                      [question.id]: {
                        selectedOptionId: current[question.id]?.selectedOptionId ?? "",
                        freeformNote: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            ) : null}
          </div>
        ))}
        {answerWorkflow.error ? (
          <p className="governance-note" data-platform-governance="clarification-command-error">
            <strong>Clarification workflow failed.</strong> {answerWorkflow.error}
          </p>
        ) : null}
        {answerWorkflow.isPending ? (
          <p className="governance-note" data-platform-governance="clarification-command-pending">
            {answerWorkflow.activeLabel ?? "Submitting backend-owned clarification answers..."}
          </p>
        ) : null}
        {!canSubmitAnswers ? (
          <p className="governance-note" data-platform-governance="clarification-command-unavailable">
            <strong>Unavailable clarification actions stay closed.</strong>{" "}
            Answer submission stays disabled until every open question has an option.
          </p>
        ) : null}
        <div className="reference-inline-actions">
          <button
            type="button"
            className="primary-button"
            data-platform-action="submit-clarification-answers"
            disabled={!canSubmitAnswers || answerWorkflow.isPending || isGenerationPending}
            onClick={() =>
              answerWorkflow.runCommand({
                label: `Submit clarification answers for ${round.id}`,
                execute: () => onAnswerSelectedChangeClarificationRound(round.id, submittedAnswers),
              })
            }
          >
            Submit answers
          </button>
        </div>
      </div>
    </div>
  );
}
