import { useEffect, useMemo, useState } from "react";

import { formatStateLabel } from "../lib";
import {
  MasterDetailShell,
  PlatformPrimitives,
  RunDetailWorkspaceShell,
  RunInspectionShell,
  StatusBadge,
  useAsyncWorkflowCommandMachine,
  type OperatorWorkspaceMode,
  type RunsWorkspaceState,
  WorkspacePageShell,
} from "../platform";
import type { RunDetailResponse, RunListEntry, Tenant } from "../types";

import "./OperatorStyleSamplePage.css";
import "./ReferenceRunsWorkspacePage.css";

type RunsMetric = {
  label: string;
  value: string;
  meta: string;
};

export function ReferenceRunsWorkspacePage({
  activeTenant,
  activeTenantId,
  buildWorkspaceHref,
  runsWorkspace,
  toast,
  tenants,
  onWorkspaceModeChange,
  onTenantChange,
  onSearchQueryChange,
  onSelectRunSlice,
  onSelectRun,
  onClearSelectedRun,
  onOpenSelectedRunChange,
  onRetrySelectedRunDetail,
  onDecideSelectedRunApproval,
}: ReferenceRunsWorkspacePageProps) {
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    window.matchMedia("(max-width: 1080px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1080px)");
    const handleChange = (event: MediaQueryListEvent) => setIsCompactViewport(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const metrics = useMemo(
    () => buildRunsMetrics(runsWorkspace, activeTenant),
    [activeTenant, runsWorkspace],
  );

  const navigationPanel = (
    <RunsContextPanel
      activeTenant={activeTenant}
      activeTenantId={activeTenantId}
      runsWorkspace={runsWorkspace}
      tenants={tenants}
      onTenantChange={onTenantChange}
      onSelectRunSlice={onSelectRunSlice}
    />
  );

  const detailWorkspace = (
    <RunDetailWorkspaceShell
      isCompactViewport={isCompactViewport}
      isOpen={runsWorkspace.status === "ready" && Boolean(runsWorkspace.selectedRun)}
      selectedRunId={runsWorkspace.selectedRunId}
      onClose={onClearSelectedRun}
      detail={
        <ReferenceSelectedRunWorkspace
          runsWorkspace={runsWorkspace}
          onOpenSelectedRunChange={onOpenSelectedRunChange}
          onRetrySelectedRunDetail={onRetrySelectedRunDetail}
          onDecideSelectedRunApproval={onDecideSelectedRunApproval}
        />
      }
    />
  );

  const worklistPanel = (
    <RunsWorklistPanel
      activeTenant={activeTenant}
      runsWorkspace={runsWorkspace}
      onSelectRun={onSelectRun}
      onClearSelectedRun={onClearSelectedRun}
    />
  );

  return (
    <WorkspacePageShell
      header={null}
      workspace={
        <div
          className="operator-style-sample reference-runs-shell"
          data-platform-surface="tenant-runs-workspace"
          data-platform-compact={isCompactViewport ? "true" : "false"}
        >
          <header className="operator-style-sample__masthead">
            <div className="operator-style-sample__masthead-inner">
              <div className="operator-style-sample__brand">
                <div className="operator-style-sample__brand-mark" aria-hidden="true">
                  CC
                </div>
                <div>
                  <strong>Change Control Center</strong>
                  <p>Functional runs workspace</p>
                </div>
              </div>
              <nav className="operator-style-sample__nav" aria-label="Primary sections">
                <a
                  className="operator-style-sample__nav-pill"
                  data-platform-action="workspace-queue"
                  href={buildWorkspaceHref("queue")}
                  onClick={(event) => {
                    event.preventDefault();
                    onWorkspaceModeChange("queue");
                  }}
                >
                  Workbench
                </a>
                <a
                  className="operator-style-sample__nav-pill"
                  data-platform-action="workspace-catalog"
                  href={buildWorkspaceHref("catalog")}
                  onClick={(event) => {
                    event.preventDefault();
                    onWorkspaceModeChange("catalog");
                  }}
                >
                  Repositories
                </a>
                <a
                  className="operator-style-sample__nav-pill operator-style-sample__nav-pill--active"
                  data-platform-action="workspace-runs"
                  aria-current="page"
                  href={buildWorkspaceHref("runs")}
                  onClick={(event) => {
                    event.preventDefault();
                    onWorkspaceModeChange("runs");
                  }}
                >
                  Runs
                </a>
                <span className="operator-style-sample__nav-pill">Governance</span>
              </nav>
              <div className="operator-style-sample__actions">
                <span className="operator-style-sample__ghost-chip">functional shell</span>
                <span className="operator-style-sample__ghost-chip">backend-owned runs</span>
              </div>
            </div>
          </header>

          <div className="operator-style-sample__page">
            <section className="operator-style-sample__page-header">
              <div>
                <h1>Runs Workspace</h1>
                <p>
                  Tenant-scoped operational runs with scan-first slices, backend-owned detail,
                  and explicit handoff back to the owning change.
                </p>
              </div>
              <div className="operator-style-sample__header-note">
                <span className="operator-style-sample__live-dot" aria-hidden="true" />
                Served runs mode
              </div>
            </section>

            <section
              className="reference-runs-utility reference-panel"
              data-platform-surface="tenant-runs-utility"
            >
              <label className="reference-queue-search">
                <span>Tenant</span>
                <select
                  aria-label="Tenant"
                  className="reference-queue-search-input reference-runs-utility__select"
                  value={activeTenantId}
                  onChange={(event) => onTenantChange(event.target.value)}
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="reference-queue-search">
                <span>Search</span>
                <input
                  aria-label="Search"
                  className="reference-queue-search-input"
                  name="search"
                  placeholder="run, change, owner, outcome"
                  type="search"
                  value={runsWorkspace.searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
              </label>

              <div className="reference-queue-chip-stack">
                <PlatformPrimitives.Button
                  type="button"
                  className={`reference-chip-button ${
                    runsWorkspace.activeRunSlice === "attention" ? "active" : ""
                  }`}
                  data-platform-run-slice="attention"
                  onClick={() => onSelectRunSlice("attention")}
                >
                  <span>Needs attention</span>
                </PlatformPrimitives.Button>
                <PlatformPrimitives.Button
                  type="button"
                  className={`reference-chip-button ${
                    runsWorkspace.activeRunSlice === "all" ? "active" : ""
                  }`}
                  data-platform-run-slice="all"
                  onClick={() => onSelectRunSlice("all")}
                >
                  <span>All history</span>
                </PlatformPrimitives.Button>
              </div>

              <div className="reference-runs-utility-meta">
                <strong>
                  {runsWorkspace.activeRunSlice === "attention"
                    ? "Attention-first slice"
                    : "Full tenant run ledger"}
                </strong>
                <span>
                  {runsWorkspace.searchQuery.trim()
                    ? `Filtered by "${runsWorkspace.searchQuery.trim()}"`
                    : "Scan backend-owned run state without leaving the selected tenant."}
                </span>
              </div>
            </section>

            <section
              className="reference-runs-metrics"
              aria-label="Run metrics"
              data-platform-surface="tenant-runs-metrics"
            >
              {metrics.map((metric) => (
                <article key={metric.label} className="reference-runs-metric">
                  <span className="operator-style-sample__eyebrow">{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.meta}</p>
                </article>
              ))}
            </section>

            <section className="operator-style-sample__section">
              <div className="operator-style-sample__section-heading">
                <h2>Live runs</h2>
                <div className="operator-style-sample__section-rule" aria-hidden="true" />
              </div>
              <div className="reference-runs-stage" data-platform-surface="tenant-runs-stage">
                {isCompactViewport ? (
                  <div className="reference-runs-stack">
                    {navigationPanel}
                    {worklistPanel}
                  </div>
                ) : (
                  <MasterDetailShell
                    navigation={navigationPanel}
                    list={worklistPanel}
                    workspace={detailWorkspace}
                  />
                )}
              </div>
            </section>
          </div>

          <footer className="operator-style-sample__status-bar">
            <div className="operator-style-sample__status-inner">
              <span>
                <span className="operator-style-sample__live-dot" aria-hidden="true" /> Workspace:
                {" "}
                runs
              </span>
              <span>Tenant: {activeTenant?.name ?? activeTenantId}</span>
              <span>Selected: {runsWorkspace.selectedRunId ?? "No run selected"}</span>
            </div>
          </footer>
        </div>
      }
      detailWorkspace={isCompactViewport ? detailWorkspace : null}
      toast={toast ? <div className="toast">{toast}</div> : null}
    />
  );
}

type ReferenceRunsWorkspacePageProps = {
  activeTenant: Tenant | null;
  activeTenantId: string;
  buildWorkspaceHref: (workspaceMode: OperatorWorkspaceMode) => string;
  runsWorkspace: RunsWorkspaceState;
  toast?: string | null;
  tenants: Tenant[];
  onWorkspaceModeChange: (workspaceMode: OperatorWorkspaceMode) => void;
  onTenantChange: (tenantId: string) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectRunSlice: (runSlice: "attention" | "all") => void;
  onSelectRun: (runId: string) => void;
  onClearSelectedRun: () => void;
  onOpenSelectedRunChange: () => void;
  onRetrySelectedRunDetail: () => void;
  onDecideSelectedRunApproval: (approvalId: string, decision: "accept" | "decline") => Promise<void>;
};

type RunsContextPanelProps = {
  activeTenant: Tenant | null;
  activeTenantId: string;
  runsWorkspace: RunsWorkspaceState;
  tenants: Tenant[];
  onTenantChange: (tenantId: string) => void;
  onSelectRunSlice: (runSlice: "attention" | "all") => void;
};

function RunsContextPanel({
  activeTenant,
  activeTenantId,
  runsWorkspace,
  tenants,
  onTenantChange,
  onSelectRunSlice,
}: RunsContextPanelProps) {
  return (
    <section className="reference-panel reference-runs-navigation" data-platform-surface="tenant-runs-context">
      <div className="reference-panel-heading reference-panel-heading--queue">
        <div>
          <p className="eyebrow">Runs context</p>
          <h2>{activeTenant?.name ?? "Unknown tenant"}</h2>
          <p className="subtitle">
            The canonical run workspace stays tenant-scoped and keeps owning change context visible.
          </p>
        </div>
      </div>

      <div className="reference-queue-context-note">
        <strong>{activeTenant?.repoPath ?? "Missing tenant path"}</strong>
        <span>{activeTenant?.description || "No tenant description available yet."}</span>
        <span>
          Search:
          {" "}
          {runsWorkspace.searchQuery.trim() || "No active query"}
        </span>
      </div>

      <div className="reference-queue-chip-stack reference-queue-chip-stack--secondary">
        <PlatformPrimitives.Button
          type="button"
          className={`reference-chip-button ${
            runsWorkspace.activeRunSlice === "attention" ? "active" : ""
          }`}
          onClick={() => onSelectRunSlice("attention")}
        >
          <span>Needs attention</span>
        </PlatformPrimitives.Button>
        <PlatformPrimitives.Button
          type="button"
          className={`reference-chip-button ${
            runsWorkspace.activeRunSlice === "all" ? "active" : ""
          }`}
          onClick={() => onSelectRunSlice("all")}
        >
          <span>All history</span>
        </PlatformPrimitives.Button>
      </div>

      <div className="reference-queue-context-note">
        <strong>Tenant switch</strong>
        <span>Run hydration stays backend-owned when you move across repositories.</span>
        <select
          aria-label="Tenant switch"
          className="reference-queue-search-input reference-runs-utility__select"
          value={activeTenantId}
          onChange={(event) => onTenantChange(event.target.value)}
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

type RunsWorklistPanelProps = {
  activeTenant: Tenant | null;
  runsWorkspace: RunsWorkspaceState;
  onSelectRun: (runId: string) => void;
  onClearSelectedRun: () => void;
};

function RunsWorklistPanel({
  activeTenant,
  runsWorkspace,
  onSelectRun,
  onClearSelectedRun,
}: RunsWorklistPanelProps) {
  return (
    <section className="reference-panel reference-runs-list-panel" data-platform-surface="tenant-runs-list">
      <div className="reference-panel-heading reference-panel-heading--queue">
        <div>
          <p className="eyebrow">Run worklist</p>
          <h2>
            {runsWorkspace.activeRunSlice === "attention"
              ? "Attention-first runs"
              : "Full run history"}
          </h2>
          <p className="subtitle">
            {runsWorkspace.status === "ready"
              ? `${runsWorkspace.visibleRuns.length} visible runs for ${activeTenant?.name ?? runsWorkspace.tenantId}`
              : `Hydrating runs for ${activeTenant?.name ?? runsWorkspace.tenantId}`}
          </p>
        </div>
        <div className="reference-panel-actions">
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button reference-chip-button"
            onClick={onClearSelectedRun}
            disabled={!runsWorkspace.selectedRunId}
          >
            <span>Clear selection</span>
          </PlatformPrimitives.Button>
        </div>
      </div>

      <div className="reference-queue-table" data-platform-foundation="tanstack-table">
        {runsWorkspace.selectionNotice ? (
          <p className="governance-note" data-platform-governance="runs-selection-cleared">
            <strong>Selected run cleared.</strong> {runsWorkspace.selectionNotice.message}
          </p>
        ) : null}

        {runsWorkspace.status === "loading" ? (
          <p className="governance-note" data-platform-governance="runs-loading">
            Hydrating backend-owned runs for
            {" "}
            {activeTenant?.name ?? runsWorkspace.tenantId}
            .
          </p>
        ) : null}

        {runsWorkspace.status === "error" ? (
          <p className="governance-note" data-platform-governance="runs-error">
            <strong>Runs hydration failed.</strong> {runsWorkspace.error}
          </p>
        ) : null}

        {runsWorkspace.status === "ready" && runsWorkspace.visibleRuns.length === 0 ? (
          <div className="empty-state">
            {runsWorkspace.activeRunSlice === "attention"
              ? "No runs currently require attention in this repository."
              : "No runs match the current query. Try another search or switch slices."}
          </div>
        ) : null}

        {runsWorkspace.status === "ready" ? (
          <div className="reference-queue-list">
            {runsWorkspace.visibleRuns.map((run) => (
              <RunRow
                key={run.id}
                run={run}
                isActive={runsWorkspace.selectedRunId === run.id}
                onSelectRun={onSelectRun}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type RunRowProps = {
  run: RunListEntry;
  isActive: boolean;
  onSelectRun: (runId: string) => void;
};

function RunRow({ run, isActive, onSelectRun }: RunRowProps) {
  return (
    <PlatformPrimitives.Button
      type="button"
      className={`reference-queue-row ${isActive ? "active" : ""}`}
      data-run-id={run.id}
      aria-label={`${run.id} ${run.change.title}`}
      aria-pressed={isActive}
      onClick={() => onSelectRun(run.id)}
    >
      <div className="reference-queue-row-main">
        <span className="reference-compact-label" data-platform-compact-label>
          Run
        </span>
        <div className="reference-queue-row-heading">
          <strong>{run.id}</strong>
          <StatusBadge status={run.status} label={formatRunStatusLabel(run.status)} />
        </div>
        <p>
          {run.change.id}
          {" "}
          ·
          {" "}
          {run.change.title}
        </p>
        <div className="reference-queue-row-meta">
          <span>{run.kind}</span>
          <span>{run.result}</span>
          <span>{run.recentActivity}</span>
        </div>
      </div>
      <div className="reference-queue-row-side">
        <div>
          <span className="reference-queue-row-label">Owning change</span>
          <strong>{formatStateLabel(run.change.state)}</strong>
          <p>{run.change.owner.label}</p>
        </div>
        <div>
          <span className="reference-queue-row-label">Outcome</span>
          <strong>{run.outcome}</strong>
          <p>{run.decision}</p>
        </div>
        <div className="reference-queue-row-summary">
          <span>{run.pendingApprovalCount} pending approvals</span>
          <span>{run.duration}</span>
          <span>{run.transport}</span>
        </div>
      </div>
    </PlatformPrimitives.Button>
  );
}

type ReferenceSelectedRunWorkspaceProps = {
  runsWorkspace: RunsWorkspaceState;
  onOpenSelectedRunChange: () => void;
  onRetrySelectedRunDetail: () => void;
  onDecideSelectedRunApproval: (approvalId: string, decision: "accept" | "decline") => Promise<void>;
};

function ReferenceSelectedRunWorkspace({
  runsWorkspace,
  onOpenSelectedRunChange,
  onRetrySelectedRunDetail,
  onDecideSelectedRunApproval,
}: ReferenceSelectedRunWorkspaceProps) {
  const selectedRun = runsWorkspace.status === "ready" ? runsWorkspace.selectedRun : null;

  if (runsWorkspace.status === "error") {
    return (
      <RunInspectionShell eyebrow="Selected run" title="Runs unavailable">
        <p className="empty-state">{runsWorkspace.error}</p>
      </RunInspectionShell>
    );
  }

  if (runsWorkspace.status !== "ready" || !runsWorkspace.selectedRunId) {
    return (
      <RunInspectionShell eyebrow="Selected run" title="Choose a run">
        <p className="empty-state">
          Select a visible run to inspect approvals, runtime events, and the owning change handoff.
        </p>
      </RunInspectionShell>
    );
  }

  if (!selectedRun) {
    return (
      <RunInspectionShell eyebrow="Selected run" title="Selection is no longer visible">
        <p className="empty-state">
          The shell kept runs context, but this run is not available in the current slice.
        </p>
      </RunInspectionShell>
    );
  }

  if (runsWorkspace.detailStatus === "loading" || runsWorkspace.detailStatus === "idle") {
    return (
      <RunInspectionShell eyebrow="Selected run" title={selectedRun.id}>
        <div className="reference-detail-card">
          <div className="reference-detail-stats">
            <div>
              <span>Owning change</span>
              <strong>{selectedRun.change.id}</strong>
            </div>
            <div>
              <span>Kind</span>
              <strong>{selectedRun.kind}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{formatRunStatusLabel(selectedRun.status)}</strong>
            </div>
          </div>
          <div className="reference-detail-actions">
            <span>{selectedRun.change.title}</span>
            <span>{selectedRun.outcome}</span>
            <span>{selectedRun.recentActivity}</span>
          </div>
        </div>
        <p className="governance-note" data-platform-governance="selected-run-loading">
          Hydrating backend-owned detail for {selectedRun.id}.
        </p>
      </RunInspectionShell>
    );
  }

  if (runsWorkspace.detailStatus === "error" || !runsWorkspace.detail) {
    return (
      <RunInspectionShell eyebrow="Selected run" title={selectedRun.id}>
        <p className="governance-note" data-platform-governance="selected-run-error">
          <strong>Selected run detail failed.</strong>{" "}
          {runsWorkspace.detailError ?? `Unable to hydrate backend-owned detail for ${selectedRun.id}.`}
        </p>
        <div className="empty-state">
          The shell fails closed here instead of reviving a hidden legacy run surface.
          <div className="empty-state-actions">
            <button type="button" className="primary-button" onClick={onRetrySelectedRunDetail}>
              Retry detail
            </button>
          </div>
        </div>
      </RunInspectionShell>
    );
  }

  return (
    <ReadySelectedRunWorkspace
      detail={runsWorkspace.detail}
      selectedRun={selectedRun}
      onOpenSelectedRunChange={onOpenSelectedRunChange}
      onDecideSelectedRunApproval={onDecideSelectedRunApproval}
    />
  );
}

type ReadySelectedRunWorkspaceProps = {
  detail: RunDetailResponse;
  selectedRun: RunListEntry;
  onOpenSelectedRunChange: () => void;
  onDecideSelectedRunApproval: (approvalId: string, decision: "accept" | "decline") => Promise<void>;
};

function ReadySelectedRunWorkspace({
  detail,
  selectedRun,
  onOpenSelectedRunChange,
  onDecideSelectedRunApproval,
}: ReadySelectedRunWorkspaceProps) {
  const { run, approvals, events } = detail;
  const approvalWorkflow = useAsyncWorkflowCommandMachine();
  const hasPendingApproval = approvals.some((approval) => approval.status === "pending");

  return (
    <RunInspectionShell
      eyebrow="Selected run"
      title={run.id}
      actions={
        <PlatformPrimitives.Button
          type="button"
          className="ghost-button"
          onClick={onOpenSelectedRunChange}
        >
          Open owning change
        </PlatformPrimitives.Button>
      }
    >
      <div className="stack reference-runs-detail-stack">
        <div className="reference-detail-card">
          <div className="reference-detail-stats">
            <div>
              <span>Owning change</span>
              <strong>{selectedRun.change.id}</strong>
            </div>
            <div>
              <span>Owner</span>
              <strong>{selectedRun.change.owner.label}</strong>
            </div>
            <div>
              <span>State</span>
              <strong>{formatStateLabel(selectedRun.change.state)}</strong>
            </div>
          </div>
          <div className="reference-detail-actions">
            <span>{selectedRun.change.title}</span>
            <span>{selectedRun.change.nextAction}</span>
            <span>{selectedRun.change.lastRunAgo}</span>
          </div>
        </div>

        <div className="key-value-grid run-facts-grid reference-runs-facts">
          <div>
            <span>Kind</span>
            <strong>{run.kind}</strong>
          </div>
          <div>
            <span>Status</span>
            <StatusBadge status={run.status} label={formatRunStatusLabel(run.status)} />
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
            <span>Normalized runtime summary</span>
          </div>
          <p>{run.outcome}</p>
          <p className="muted">{run.decision}</p>
          {run.checks.length > 0 ? (
            <ul className="reference-detail-list">
              {run.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          ) : (
            <p className="reference-detail-inline-note">No checks were captured for this run.</p>
          )}
        </div>

        <div
          className="card reference-overview-card"
          data-platform-surface="run-approvals"
        >
          <p className="eyebrow">Approvals</p>
          {approvals.length === 0 ? (
            <p>No approvals captured for this run.</p>
          ) : (
            <ul className="reference-detail-list reference-run-approval-list">
              {approvals.map((approval) => (
                <li
                  key={approval.id}
                  className="reference-run-approval-item"
                  data-approval-id={approval.id}
                >
                  <div className="reference-run-approval-copy">
                    <strong>{formatApprovalStatusLabel(approval.status)}</strong>
                    {" "}
                    {approval.kind}
                    :{" "}
                    {approval.reason}
                  </div>
                  {approval.status === "pending" ? (
                    <div className="reference-inline-actions">
                      <button
                        type="button"
                        className="primary-button"
                        data-platform-action="accept-approval"
                        disabled={approvalWorkflow.isPending}
                        onClick={() =>
                          approvalWorkflow.runCommand({
                            label: `Accept approval ${approval.id}`,
                            execute: () => onDecideSelectedRunApproval(approval.id, "accept"),
                          })
                        }
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        data-platform-action="decline-approval"
                        disabled={approvalWorkflow.isPending}
                        onClick={() =>
                          approvalWorkflow.runCommand({
                            label: `Decline approval ${approval.id}`,
                            execute: () => onDecideSelectedRunApproval(approval.id, "decline"),
                          })
                        }
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span className="reference-detail-inline-note">
                      Decision: {approval.decision ?? "recorded"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {approvalWorkflow.error ? (
            <p className="governance-note" data-platform-governance="run-approval-error">
              <strong>Approval decision failed.</strong> {approvalWorkflow.error}
            </p>
          ) : null}
          {approvalWorkflow.isPending ? (
            <p className="governance-note" data-platform-governance="run-approval-pending">
              {approvalWorkflow.activeLabel ?? "Submitting backend-owned approval decision..."}
            </p>
          ) : null}
          {!hasPendingApproval && approvals.length > 0 ? (
            <p className="reference-detail-inline-note">
              Resolved approvals remain read-only after reconciliation.
            </p>
          ) : null}
        </div>

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
      </div>
    </RunInspectionShell>
  );
}

function buildRunsMetrics(runsWorkspace: RunsWorkspaceState, activeTenant: Tenant | null): RunsMetric[] {
  if (runsWorkspace.status !== "ready") {
    return [
      {
        label: "Visible runs",
        value: "0",
        meta: "Runs hydration in progress",
      },
      {
        label: "Needs attention",
        value: "0",
        meta: "No operational run facts are declared until hydration completes",
      },
      {
        label: "Pending approvals",
        value: "0",
        meta: "Approval state will hydrate with the backend-owned list",
      },
      {
        label: "Tracked changes",
        value: activeTenant ? "..." : "0",
        meta: activeTenant?.repoPath ?? "Tenant context still loading",
      },
    ];
  }

  const visibleRunCount = runsWorkspace.visibleRuns.length;
  const attentionCount = runsWorkspace.visibleRuns.filter((run) => run.requiresAttention).length;
  const pendingApprovalCount = runsWorkspace.visibleRuns.reduce(
    (sum, run) => sum + run.pendingApprovalCount,
    0,
  );
  const trackedChangeCount = new Set(runsWorkspace.visibleRuns.map((run) => run.change.id)).size;

  return [
    {
      label: "Visible runs",
      value: String(visibleRunCount),
      meta: `${runsWorkspace.activeRunSlice === "attention" ? "Attention-first" : "Full-history"} slice for ${activeTenant?.name ?? runsWorkspace.tenantId}`,
    },
    {
      label: "Needs attention",
      value: String(attentionCount),
      meta: attentionCount > 0 ? "Running, failed, or review-heavy loops stay surfaced." : "No operator intervention is currently required.",
    },
    {
      label: "Pending approvals",
      value: String(pendingApprovalCount),
      meta: pendingApprovalCount > 0 ? "Approvals remain tied to their owning runs." : "No approval debt in the visible slice.",
    },
    {
      label: "Tracked changes",
      value: String(trackedChangeCount),
      meta: activeTenant?.repoPath ?? "Tenant path unavailable",
    },
  ];
}

function formatRunStatusLabel(status: string) {
  switch (status) {
    case "inProgress":
      return "In progress";
    default:
      return status.replaceAll("_", " ");
  }
}

function formatApprovalStatusLabel(status: string) {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "pending":
      return "Pending";
    default:
      return status.replaceAll("_", " ");
  }
}

function summarizeEvent(event: RunDetailResponse["events"][number]) {
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
