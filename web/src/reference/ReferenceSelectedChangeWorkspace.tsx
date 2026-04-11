import { formatStateLabel } from "../lib";
import { PlatformPrimitives, StatusBadge, type QueueWorkspaceState } from "../platform";
import type { ChangeDetailResponse, ChangeDetailTabId } from "../types";

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
};

export function ReferenceSelectedChangeWorkspace({
  queueWorkspace,
  onSelectTab,
  onRetryDetail,
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
          <ChiefTab detail={queueWorkspace.detail} tenantMemory={tenantMemory} />
        ) : null}
        {queueWorkspace.activeTabId === "clarifications" ? (
          <ClarificationsTab detail={queueWorkspace.detail} />
        ) : null}
      </div>
    </section>
  );
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
}: {
  detail: ChangeDetailResponse;
  tenantMemory: ChangeDetailResponse["tenantMemory"];
}) {
  const { change, focusGraph } = detail;

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
          <ul className="reference-detail-list">
            {tenantMemory.length > 0
              ? tenantMemory.map((fact) => (
                  <li key={fact.id}>
                    <strong>{fact.title}</strong>: {fact.body}
                  </li>
                ))
              : [<li key="no-tenant-memory">No tenant memory facts promoted yet.</li>]}
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

function ClarificationsTab({ detail }: { detail: ChangeDetailResponse }) {
  const { change, clarificationRounds } = detail;

  return (
    <div className="reference-detail-stack">
      <div className="reference-detail-block">
        <div className="reference-detail-block-head">
          <h3>Clarification history</h3>
          <span>{clarificationRounds.length > 0 ? "Rounds recorded in backend state" : "No rounds yet"}</span>
        </div>
        {clarificationRounds.length > 0 ? (
          <div className="reference-detail-stack">
            {clarificationRounds.map((round) => (
              <div key={round.id} className="card">
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
