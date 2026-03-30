import { useState } from "react";

import { ClarificationPanel } from "./ClarificationPanel";
import { formatStateLabel } from "../lib";
import { PlatformPrimitives, PlatformTextArea } from "../platform/foundation";
import { DetailPanelShell } from "../platform/shells/DetailPanelShell";
import { StatusBadge } from "../platform/shells/StatusBadge";
import { useAsyncWorkflowCommandMachine } from "../platform/workflow";
import type { ChangeDetailResponse, ChangeDetailTabId, ClarificationAnswer } from "../types";

type ChangeDetailProps = {
  activeTab: ChangeDetailTabId;
  detail: ChangeDetailResponse | null;
  onRunNext: () => Promise<void>;
  onOpenRunStudio: () => void;
  onEscalate: () => Promise<void>;
  onBlockBySpec: () => Promise<void>;
  onCreateClarificationRound: () => Promise<void>;
  onAnswerClarificationRound: (roundId: string, answers: ClarificationAnswer[]) => Promise<void>;
  onSelectRun: (runId: string) => void;
  onSelectTab: (tabId: ChangeDetailTabId) => void;
  onPromoteFact: (title: string, body: string) => Promise<void>;
};

const TABS: Array<{ id: ChangeDetailTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "traceability", label: "Traceability" },
  { id: "runs", label: "Runs" },
  { id: "gaps", label: "Gaps" },
  { id: "evidence", label: "Evidence" },
  { id: "git", label: "Git" },
  { id: "chief", label: "Chief" },
  { id: "clarifications", label: "Clarifications" },
] as const;

export function ChangeDetail({
  activeTab,
  detail,
  onRunNext,
  onOpenRunStudio,
  onEscalate,
  onBlockBySpec,
  onCreateClarificationRound,
  onAnswerClarificationRound,
  onSelectRun,
  onSelectTab,
  onPromoteFact,
}: ChangeDetailProps) {
  const [factTitle, setFactTitle] = useState("");
  const [factBody, setFactBody] = useState("");
  const actionWorkflow = useAsyncWorkflowCommandMachine();
  const canPromoteFact = factTitle.trim().length > 0 && factBody.trim().length > 0;

  if (!detail) {
    return (
      <DetailPanelShell eyebrow="Change Detail" title="No Change Selected">
        <p className="empty-state">Select a change from the control queue to inspect backend-owned state.</p>
      </DetailPanelShell>
    );
  }

  const { change, runs, evidence, clarificationRounds, focusGraph, tenantMemory } = detail;

  return (
    <DetailPanelShell
      eyebrow="Change Detail"
      title={change.title}
      subtitle={change.subtitle}
      actions={
        <>
          <PlatformPrimitives.Button
            type="button"
            className="primary-button"
            data-platform-action="run-next-step"
            onClick={() =>
              actionWorkflow.runCommand({
                label: "Run next step",
                execute: onRunNext,
              })
            }
            disabled={actionWorkflow.isPending}
          >
            Run next step
          </PlatformPrimitives.Button>
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button"
            data-platform-action="open-run-studio"
            aria-controls="run-studio"
            onClick={onOpenRunStudio}
            disabled={actionWorkflow.isPending}
          >
            Open run studio
          </PlatformPrimitives.Button>
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button"
            data-platform-action="escalate-change"
            onClick={() =>
              actionWorkflow.runCommand({
                label: "Escalate change",
                execute: onEscalate,
              })
            }
            disabled={actionWorkflow.isPending}
          >
            Escalate
          </PlatformPrimitives.Button>
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button"
            data-platform-action="block-by-spec"
            onClick={() =>
              actionWorkflow.runCommand({
                label: "Mark blocked by spec",
                execute: onBlockBySpec,
              })
            }
            disabled={actionWorkflow.isPending}
          >
            Mark blocked by spec
          </PlatformPrimitives.Button>
        </>
      }
    >
      {actionWorkflow.error ? (
        <div className="empty-state">
          <strong>Change command failed.</strong> {actionWorkflow.error}
        </div>
      ) : null}
      {actionWorkflow.isPending ? <div className="empty-state">{actionWorkflow.activeLabel ?? "Operator command in progress."}</div> : null}
      <div className="status-bar">
        <StatusBadge status={change.state} label={formatStateLabel(change.state)} />
        <span>{change.nextAction}</span>
        <span>{change.blocker}</span>
      </div>

      <PlatformPrimitives.Tabs.Root
        className="detail-tabs"
        data-platform-foundation="base-ui-tabs"
        value={activeTab}
        onValueChange={(value) => {
          if (typeof value === "string" && TABS.some((tab) => tab.id === value)) {
            onSelectTab(value as ChangeDetailTabId);
          }
        }}
      >
        <PlatformPrimitives.Tabs.List className="tab-list">
          {TABS.map((tab) => (
            <PlatformPrimitives.Tabs.Tab key={tab.id} value={tab.id}>
              {tab.label}
            </PlatformPrimitives.Tabs.Tab>
          ))}
        </PlatformPrimitives.Tabs.List>
      </PlatformPrimitives.Tabs.Root>

      {activeTab === "overview" && (
        <div className="stack">
          <div className="overview-grid">
            <div className="card">
              <p className="eyebrow">Current state</p>
              <strong>{formatStateLabel(change.state)}</strong>
              <p>{change.verificationStatus}</p>
            </div>
            <div className="card">
              <p className="eyebrow">Next best action</p>
              <strong>{change.nextAction}</strong>
              <p>{change.blocker}</p>
            </div>
            <div className="card">
              <p className="eyebrow">Change meta</p>
              <strong>{change.owner ?? "chief"}</strong>
              <p>{change.loopCount} loop cycles</p>
            </div>
          </div>
          <div className="card">
            <p className="eyebrow">Summary</p>
            <p>{change.summary}</p>
          </div>
          <div className="grid-two">
            <div className="card">
              <p className="eyebrow">Contract</p>
              <strong>{change.contract.goal}</strong>
              <ul>
                {change.contract.acceptanceCriteria.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <p className="eyebrow">Working Memory</p>
              <p>{change.memory.summary}</p>
              <ul>
                {change.memory.activeFocus.map((focus) => (
                  <li key={focus}>{focus}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card">
            <p className="eyebrow">Focus Graph</p>
            <ul>
              {focusGraph.items.map((item) => (
                <li key={item.id}>
                  <strong>{item.kind}</strong>: {item.title} ({item.status ?? "unknown"})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "traceability" && (
        <div className="table-shell">
          <div className="table-head traceability-head">
            <span>Requirement</span>
            <span>Code</span>
            <span>Tests</span>
            <span>Evidence</span>
            <span>Status</span>
          </div>
          {change.traceability.length === 0 ? (
            <div className="empty-state">No traceability data yet.</div>
          ) : (
            change.traceability.map((item) => (
              <div key={`${item.req}-${item.code}`} className="table-row traceability-row">
                <span>
                  <strong>{item.req}</strong>
                </span>
                <span>{item.code}</span>
                <span>{item.tests}</span>
                <span>{item.evidence}</span>
                <StatusBadge status={item.status} />
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "runs" && (
        <div className="table-shell">
          <div className="table-head runs-head">
            <span>Run</span>
            <span>Type</span>
            <span>Transport</span>
            <span>Thread / Turn</span>
            <span>Outcome</span>
          </div>
          {runs.map((run) => (
            <PlatformPrimitives.Button
              key={run.id}
              type="button"
              className="table-row run-row"
              data-platform-foundation="base-ui-run-row"
              onClick={() => onSelectRun(run.id)}
            >
              <span>
                <strong>{run.id}</strong>
              </span>
              <span>{run.kind}</span>
              <span>{run.transport}</span>
              <span>
                {run.threadId ?? "no thread"} / {run.turnId ?? "no turn"}
              </span>
              <span>{run.outcome}</span>
            </PlatformPrimitives.Button>
          ))}
        </div>
      )}

      {activeTab === "gaps" && (
        <div className="table-shell">
          <div className="table-head gaps-head">
            <span>Gap</span>
            <span>Severity</span>
            <span>Mandatory</span>
            <span>Req ref</span>
            <span>Status</span>
            <span>Repeat</span>
            <span>Summary</span>
          </div>
          {change.gaps.length === 0 ? (
            <div className="empty-state">No open findings yet.</div>
          ) : (
            change.gaps.map((gap) => (
              <PlatformPrimitives.Button
                key={gap.id}
                type="button"
                className="table-row gap-row"
                data-platform-foundation="base-ui-gap-row"
                onClick={() => onBlockBySpec()}
              >
                <span>
                  <strong>{gap.id}</strong>
                </span>
                <span>{gap.severity}</span>
                <span>{gap.mandatory ? "yes" : "no"}</span>
                <span>{gap.reqRef ?? "—"}</span>
                <span>{gap.status}</span>
                <span>{gap.recurrence}</span>
                <span>{gap.summary}</span>
              </PlatformPrimitives.Button>
            ))
          )}
        </div>
      )}

      {activeTab === "evidence" && (
        <div className="stack">
          {evidence.map((artifact) => (
            <article key={artifact.id} className="card">
              <p className="eyebrow">{artifact.kind}</p>
              <strong>{artifact.title}</strong>
              <pre>{artifact.body}</pre>
            </article>
          ))}
        </div>
      )}

      {activeTab === "git" && (
        <div className="card">
          <p className="eyebrow">Landing status</p>
          <div className="grid-two">
            <div className="mini-card">
              <strong>Worktree</strong>
              <p>{change.git.worktree}</p>
            </div>
            <div className="mini-card">
              <strong>Branch</strong>
              <p>{change.git.branch}</p>
            </div>
            <div className="mini-card">
              <strong>Changed files</strong>
              <p>{change.git.changedFiles}</p>
            </div>
            <div className="mini-card">
              <strong>Commit status</strong>
              <p>{change.git.commitStatus}</p>
            </div>
            <div className="mini-card">
              <strong>Merge readiness</strong>
              <p>{change.git.mergeReadiness}</p>
            </div>
            <div className="mini-card">
              <strong>PR status</strong>
              <p>{change.git.prStatus ?? "no PR"}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "chief" && (
        <div className="stack">
          <div className="card">
            <p className="eyebrow">Chief History</p>
            <ul>
              {change.chiefHistory.map((entry) => (
                <li key={`${entry.at}-${entry.title}`}>
                  <strong>{entry.at}</strong> {entry.title}: {entry.note}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <p className="eyebrow">Workflow Gate</p>
            <div className="state-machine">
              <div className="machine-node current">
                <span>current</span>
                <strong>{change.state}</strong>
              </div>
              <div className="machine-node available">
                <span>next</span>
                <strong>{change.nextAction}</strong>
              </div>
            </div>
          </div>
          <div className="card">
            <p className="eyebrow">Promote Durable Fact</p>
            <PlatformPrimitives.Input
              value={factTitle}
              data-platform-foundation="base-ui-chief-input"
              onChange={(event) => setFactTitle(event.target.value)}
              placeholder="Fact title"
            />
            <PlatformTextArea
              value={factBody}
              data-platform-foundation="platform-chief-textarea"
              onChange={(event) => setFactBody(event.target.value)}
              placeholder="Why this fact should enter tenant memory"
            />
            {!canPromoteFact ? (
              <p className="governance-note" data-platform-governance="fact-input-required">
                Provide both a fact title and durable rationale before promoting tenant memory.
              </p>
            ) : null}
            <PlatformPrimitives.Button
              type="button"
              className="ghost-button"
              data-platform-foundation="base-ui-chief-actions"
              disabled={!canPromoteFact}
              onClick={() => {
                if (!factTitle.trim() || !factBody.trim()) {
                  return;
                }
                void onPromoteFact(factTitle, factBody).then(() => {
                  setFactTitle("");
                  setFactBody("");
                });
              }}
            >
              Promote fact
            </PlatformPrimitives.Button>
          </div>
          <div className="card">
            <p className="eyebrow">Tenant Memory</p>
            <ul>
              {tenantMemory.map((fact) => (
                <li key={fact.id ?? fact.title}>
                  <strong>{fact.title}</strong>: {fact.body}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "clarifications" && (
        <ClarificationPanel
          rounds={clarificationRounds}
          onCreateRound={onCreateClarificationRound}
          onAnswerRound={onAnswerClarificationRound}
        />
      )}
    </DetailPanelShell>
  );
}
