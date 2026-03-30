import { useState } from "react";

import { ClarificationPanel } from "./ClarificationPanel";
import { DetailTabularSection } from "./DetailTabularSection";
import { formatStateLabel } from "../lib";
import { PlatformPrimitives, PlatformTable, PlatformTextArea } from "../platform/foundation";
import { DetailPanelShell } from "../platform/shells/DetailPanelShell";
import { StatusBadge } from "../platform/shells/StatusBadge";
import { useAsyncWorkflowCommandMachine } from "../platform/workflow";
import type { ChangeDetailResponse, ChangeDetailTabId, ClarificationAnswer } from "../types";
import type { ColumnDef } from "../platform/foundation/table";

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

type TraceabilityRow = ChangeDetailResponse["change"]["traceability"][number];
type RunRow = ChangeDetailResponse["runs"][number];
type GapRow = ChangeDetailResponse["change"]["gaps"][number];
type EvidenceRow = ChangeDetailResponse["evidence"][number];

const traceabilityColumnHelper = PlatformTable.createColumnHelper<TraceabilityRow>();
const runColumnHelper = PlatformTable.createColumnHelper<RunRow>();
const gapColumnHelper = PlatformTable.createColumnHelper<GapRow>();
const evidenceColumnHelper = PlatformTable.createColumnHelper<EvidenceRow>();

const TRACEABILITY_COLUMNS: ColumnDef<TraceabilityRow>[] = [
  traceabilityColumnHelper.accessor("req", {
    header: "Requirement",
    cell: (context) => <strong>{context.getValue()}</strong>,
  }),
  traceabilityColumnHelper.accessor("code", {
    header: "Code",
  }),
  traceabilityColumnHelper.accessor("tests", {
    header: "Tests",
  }),
  traceabilityColumnHelper.accessor("evidence", {
    header: "Evidence",
  }),
  traceabilityColumnHelper.accessor("status", {
    header: "Status",
    cell: (context) => <StatusBadge status={context.getValue()} />,
  }),
];

const RUN_COLUMNS: ColumnDef<RunRow>[] = [
  runColumnHelper.accessor("id", {
    header: "Run",
    cell: (context) => <strong>{context.getValue()}</strong>,
  }),
  runColumnHelper.accessor("kind", {
    header: "Type",
  }),
  runColumnHelper.accessor("transport", {
    header: "Transport",
  }),
  runColumnHelper.display({
    id: "thread-turn",
    header: "Thread / Turn",
    cell: (context) => (
      <span>
        {context.row.original.threadId ?? "no thread"} / {context.row.original.turnId ?? "no turn"}
      </span>
    ),
  }),
  runColumnHelper.accessor("outcome", {
    header: "Outcome",
  }),
];

const GAP_COLUMNS: ColumnDef<GapRow>[] = [
  gapColumnHelper.accessor("id", {
    header: "Gap",
    cell: (context) => <strong>{context.getValue()}</strong>,
  }),
  gapColumnHelper.accessor("severity", {
    header: "Severity",
  }),
  gapColumnHelper.accessor("mandatory", {
    header: "Mandatory",
    cell: (context) => <span>{context.getValue() ? "yes" : "no"}</span>,
  }),
  gapColumnHelper.accessor("reqRef", {
    header: "Req ref",
    cell: (context) => <span>{context.getValue() ?? "—"}</span>,
  }),
  gapColumnHelper.accessor("status", {
    header: "Status",
  }),
  gapColumnHelper.accessor("recurrence", {
    header: "Repeat",
  }),
  gapColumnHelper.accessor("summary", {
    header: "Summary",
  }),
];

const EVIDENCE_COLUMNS: ColumnDef<EvidenceRow>[] = [
  evidenceColumnHelper.accessor("kind", {
    header: "Kind",
  }),
  evidenceColumnHelper.accessor("title", {
    header: "Title",
    cell: (context) => <strong>{context.getValue()}</strong>,
  }),
  evidenceColumnHelper.accessor("body", {
    header: "Body",
    cell: (context) => <pre>{context.getValue()}</pre>,
  }),
];

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
  const factPromotionWorkflow = useAsyncWorkflowCommandMachine();
  const traceabilityTable = PlatformTable.useReactTable({
    data: detail?.change.traceability ?? [],
    columns: TRACEABILITY_COLUMNS,
    getCoreRowModel: PlatformTable.getCoreRowModel(),
    getRowId: (item) => `${item.req}-${item.code}`,
  });
  const runTable = PlatformTable.useReactTable({
    data: detail?.runs ?? [],
    columns: RUN_COLUMNS,
    getCoreRowModel: PlatformTable.getCoreRowModel(),
    getRowId: (run) => run.id,
  });
  const gapTable = PlatformTable.useReactTable({
    data: detail?.change.gaps ?? [],
    columns: GAP_COLUMNS,
    getCoreRowModel: PlatformTable.getCoreRowModel(),
    getRowId: (gap) => gap.id,
  });
  const evidenceTable = PlatformTable.useReactTable({
    data: detail?.evidence ?? [],
    columns: EVIDENCE_COLUMNS,
    getCoreRowModel: PlatformTable.getCoreRowModel(),
    getRowId: (artifact) => artifact.id,
  });

  if (!detail) {
    return (
      <DetailPanelShell eyebrow="Change Detail" title="No Change Selected">
        <p className="empty-state">Select a change from the control queue to inspect backend-owned state.</p>
      </DetailPanelShell>
    );
  }

  const { change, runs, clarificationRounds, focusGraph, tenantMemory } = detail;
  const normalizedFactTitle = factTitle.trim();
  const normalizedFactBody = factBody.trim();
  const canPromoteFact = normalizedFactTitle.length > 0 && normalizedFactBody.length > 0;
  const canOpenRunStudio = runs.length > 0;

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
            disabled={actionWorkflow.isPending || !canOpenRunStudio}
            title={canOpenRunStudio ? undefined : "Generate or select a backend-owned run before opening Run Studio."}
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
      {!canOpenRunStudio ? (
        <p className="governance-note" data-platform-governance="run-studio-run-required">
          Generate or select a backend-owned run before opening the run-inspection shell.
        </p>
      ) : null}
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
        <DetailTabularSection
          table={traceabilityTable}
          emptyMessage="No traceability data yet."
          headerClassName="traceability-head"
          renderRow={(row) => (
            <div key={row.id} className="table-row traceability-row">
              {row.getVisibleCells().map((cell) => (
                <span key={cell.id}>
                  {PlatformTable.flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              ))}
            </div>
          )}
        />
      )}

      {activeTab === "runs" && (
        <DetailTabularSection
          table={runTable}
          emptyMessage="No runs yet."
          headerClassName="runs-head"
          renderRow={(row) => (
            <PlatformPrimitives.Button
              key={row.id}
              type="button"
              className="table-row run-row"
              data-platform-foundation="base-ui-run-row"
              onClick={() => onSelectRun(row.original.id)}
            >
              {row.getVisibleCells().map((cell) => (
                <span key={cell.id}>
                  {PlatformTable.flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              ))}
            </PlatformPrimitives.Button>
          )}
        />
      )}

      {activeTab === "gaps" && (
        <DetailTabularSection
          table={gapTable}
          emptyMessage="No open findings yet."
          headerClassName="gaps-head"
          renderRow={(row) => (
            <PlatformPrimitives.Button
              key={row.id}
              type="button"
              className="table-row gap-row"
              data-platform-foundation="base-ui-gap-row"
              onClick={() =>
                actionWorkflow.runCommand({
                  label: "Mark blocked by spec",
                  execute: onBlockBySpec,
                })
              }
            >
              {row.getVisibleCells().map((cell) => (
                <span key={cell.id}>
                  {PlatformTable.flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              ))}
            </PlatformPrimitives.Button>
          )}
        />
      )}

      {activeTab === "evidence" && (
        <DetailTabularSection
          table={evidenceTable}
          emptyMessage="No evidence artifacts yet."
          headerClassName="evidence-head"
          renderRow={(row) => (
            <div key={row.id} className="table-row evidence-row">
              {row.getVisibleCells().map((cell) => (
                <span key={cell.id}>
                  {PlatformTable.flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              ))}
            </div>
          )}
        />
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
            {factPromotionWorkflow.error ? (
              <div className="empty-state">
                <strong>Fact promotion failed.</strong> {factPromotionWorkflow.error}
              </div>
            ) : null}
            {factPromotionWorkflow.isPending ? (
              <div className="empty-state">{factPromotionWorkflow.activeLabel ?? "Promoting fact..."}</div>
            ) : null}
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
              disabled={!canPromoteFact || factPromotionWorkflow.isPending}
              onClick={() => {
                if (canPromoteFact) {
                  factPromotionWorkflow.runCommand({
                    label: "Promote fact",
                    execute: async () => {
                      await onPromoteFact(normalizedFactTitle, normalizedFactBody);
                      setFactTitle("");
                      setFactBody("");
                    },
                  });
                }
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
