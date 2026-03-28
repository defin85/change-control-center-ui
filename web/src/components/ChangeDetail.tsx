import { useState } from "react";

import { ClarificationPanel } from "./ClarificationPanel";
import type { ChangeDetailResponse, ClarificationAnswer } from "../types";

type ChangeDetailProps = {
  detail: ChangeDetailResponse | null;
  onRunNext: () => Promise<void>;
  onCreateClarificationRound: () => Promise<void>;
  onAnswerClarificationRound: (roundId: string, answers: ClarificationAnswer[]) => Promise<void>;
  onSelectRun: (runId: string) => void;
  onPromoteFact: (title: string, body: string) => Promise<void>;
};

const TABS = ["overview", "runs", "evidence", "chief", "clarifications"] as const;

export function ChangeDetail({
  detail,
  onRunNext,
  onCreateClarificationRound,
  onAnswerClarificationRound,
  onSelectRun,
  onPromoteFact,
}: ChangeDetailProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("overview");
  const [factTitle, setFactTitle] = useState("");
  const [factBody, setFactBody] = useState("");

  if (!detail) {
    return (
      <section className="panel detail-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Change Detail</p>
            <h2>No Change Selected</h2>
          </div>
        </div>
        <p className="empty-state">Select a change from the control queue to inspect backend-owned state.</p>
      </section>
    );
  }

  const { change, runs, evidence, clarificationRounds, focusGraph, tenantMemory } = detail;

  return (
    <section className="panel detail-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Change Detail</p>
          <h2>{change.title}</h2>
          <p className="subtitle">{change.subtitle}</p>
        </div>
        <div className="action-row">
          <button type="button" className="primary-button" onClick={() => void onRunNext()}>
            Run next step
          </button>
        </div>
      </div>

      <div className="status-bar">
        <span>{change.state}</span>
        <span>{change.nextAction}</span>
        <span>{change.blocker}</span>
      </div>

      <nav className="tab-list">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="stack">
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
                  <strong>{item.kind}</strong>: {item.title} ({item.status})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "runs" && (
        <div className="stack">
          {runs.map((run) => (
            <button key={run.id} type="button" className="card card-button" onClick={() => onSelectRun(run.id)}>
              <div className="row-between">
                <strong>{run.id}</strong>
                <span>{run.transport}</span>
              </div>
              <p>{run.outcome}</p>
              <small>{run.threadId ?? "no thread"} / {run.turnId ?? "no turn"}</small>
            </button>
          ))}
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
            <p className="eyebrow">Promote Durable Fact</p>
            <input
              value={factTitle}
              onChange={(event) => setFactTitle(event.target.value)}
              placeholder="Fact title"
            />
            <textarea
              value={factBody}
              onChange={(event) => setFactBody(event.target.value)}
              placeholder="Why this fact should enter tenant memory"
            />
            <button
              type="button"
              className="ghost-button"
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
            </button>
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
    </section>
  );
}

