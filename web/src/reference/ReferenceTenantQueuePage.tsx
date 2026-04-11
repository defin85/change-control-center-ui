import { useEffect, useMemo, useState } from "react";

import { formatStateLabel } from "../lib";
import {
  describeFilter,
  describeView,
  DetailWorkspaceShell,
  MasterDetailShell,
  OPERATOR_FILTERS,
  PlatformPrimitives,
  StatusBadge,
  type OperatorWorkspaceMode,
  type QueueWorkspaceState,
  WorkspacePageShell,
} from "../platform";
import type { BootstrapResponse, ChangeDetailTabId, ChangeSummary, Tenant } from "../types";

import "./OperatorStyleSamplePage.css";
import "./ReferenceTenantQueuePage.css";
import { ReferenceSelectedChangeWorkspace } from "./ReferenceSelectedChangeWorkspace";

type QueueMetric = {
  label: string;
  value: string;
  meta: string;
};

export function ReferenceTenantQueuePage({
  activeTenant,
  activeTenantId,
  buildWorkspaceHref,
  queueWorkspace,
  tenants,
  views,
  onWorkspaceModeChange,
  onTenantChange,
  onSearchQueryChange,
  onSelectQueueView,
  onSelectQueueFilter,
  onSelectQueueTab,
  onSelectQueueChange,
  onClearQueueSelection,
  onRetrySelectedChangeDetail,
}: ReferenceTenantQueuePageProps) {
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    window.matchMedia("(max-width: 1080px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1080px)");
    const handleChange = (event: MediaQueryListEvent) => setIsCompactViewport(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const activeFilter = describeFilter(queueWorkspace.activeFilterId);
  const metrics = useMemo(
    () => buildQueueMetrics(queueWorkspace, activeTenant),
    [activeTenant, queueWorkspace],
  );

  const navigationPanel = (
    <QueueNavigationPanel
      activeTenant={activeTenant}
      activeViewId={queueWorkspace.activeViewId}
      activeFilterId={queueWorkspace.activeFilterId}
      searchQuery={queueWorkspace.searchQuery}
      tenants={tenants}
      views={views}
      viewCounts={queueWorkspace.status === "ready" ? queueWorkspace.viewCounts : null}
      onTenantChange={onTenantChange}
      onSelectQueueView={onSelectQueueView}
      onSelectQueueFilter={onSelectQueueFilter}
    />
  );

  const detailWorkspace = (
    <DetailWorkspaceShell
      isCompactViewport={isCompactViewport}
      isOpen={queueWorkspace.status === "ready" && Boolean(queueWorkspace.selectedChange)}
      selectedChangeId={queueWorkspace.selectedChangeId}
      onClose={onClearQueueSelection}
      detail={
        <ReferenceSelectedChangeWorkspace
          queueWorkspace={queueWorkspace}
          onSelectTab={onSelectQueueTab}
          onRetryDetail={onRetrySelectedChangeDetail}
        />
      }
    />
  );

  const listPanel = (
    <QueueWorklistPanel
      activeTenant={activeTenant}
      queueWorkspace={queueWorkspace}
      onSelectQueueChange={onSelectQueueChange}
    />
  );

  return (
    <WorkspacePageShell
      header={null}
      workspace={
        <div
          className="operator-style-sample reference-queue-shell"
          data-platform-surface="tenant-queue-workspace"
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
                  <p>Functional tenant queue</p>
                </div>
              </div>
              <nav className="operator-style-sample__nav" aria-label="Primary sections">
                <a
                  className="operator-style-sample__nav-pill operator-style-sample__nav-pill--active"
                  data-platform-action="workspace-queue"
                  aria-current="page"
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
                  className="operator-style-sample__nav-pill"
                  data-platform-action="workspace-runs"
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
                <span className="operator-style-sample__ghost-chip">backend-owned queue</span>
              </div>
            </div>
          </header>

          <div className="operator-style-sample__page">
            <section className="operator-style-sample__page-header">
              <div>
                <h1>Functional Workbench</h1>
                <p>
                  Tenant-scoped queue backed by backend change summaries and canonical route
                  state.
                </p>
              </div>
              <div className="operator-style-sample__header-note">
                <span className="operator-style-sample__live-dot" aria-hidden="true" />
                Served queue mode
              </div>
            </section>

            <section
              className="reference-queue-utility reference-panel"
              data-platform-surface="tenant-queue-utility"
            >
              <label className="reference-queue-search">
                <span>Tenant</span>
                <select
                  aria-label="Tenant"
                  className="reference-queue-search-input reference-queue-utility__select"
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
                  placeholder="change, owner, blocker"
                  type="search"
                  value={queueWorkspace.searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
              </label>

              <div className="reference-queue-chip-stack">
                {OPERATOR_FILTERS.map((filter) => (
                  <PlatformPrimitives.Button
                    key={filter.id}
                    type="button"
                    className={`reference-chip-button ${
                      queueWorkspace.activeFilterId === filter.id ? "active" : ""
                    }`}
                    data-platform-filter={filter.id}
                    onClick={() => onSelectQueueFilter(filter.id)}
                  >
                    <span>{filter.label}</span>
                  </PlatformPrimitives.Button>
                ))}
              </div>

              <div className="reference-queue-utility-meta">
                <strong>{activeFilter.label}</strong>
                <span>{activeFilter.hint}</span>
              </div>
            </section>

            <section
              className="reference-queue-metrics"
              aria-label="Queue metrics"
              data-platform-surface="tenant-queue-metrics"
            >
              {metrics.map((metric) => (
                <article key={metric.label} className="reference-queue-metric">
                  <span className="operator-style-sample__eyebrow">{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.meta}</p>
                </article>
              ))}
            </section>

            <section className="operator-style-sample__section">
              <div className="operator-style-sample__section-heading">
                <h2>Live queue</h2>
                <div className="operator-style-sample__section-rule" aria-hidden="true" />
              </div>
              <div className="reference-queue-stage" data-platform-surface="tenant-queue-stage">
                {isCompactViewport ? (
                  <div className="reference-queue-stack">
                    {navigationPanel}
                    {listPanel}
                  </div>
                ) : (
                  <MasterDetailShell
                    navigation={navigationPanel}
                    list={listPanel}
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
                queue
              </span>
              <span>Tenant: {activeTenant?.name ?? activeTenantId}</span>
              <span>
                Selected: {queueWorkspace.selectedChangeId ?? "No change selected"}
              </span>
            </div>
          </footer>
        </div>
      }
      detailWorkspace={isCompactViewport ? detailWorkspace : null}
    />
  );
}

type ReferenceTenantQueuePageProps = {
  activeTenant: Tenant | null;
  activeTenantId: string;
  buildWorkspaceHref: (workspaceMode: OperatorWorkspaceMode) => string;
  queueWorkspace: QueueWorkspaceState;
  tenants: Tenant[];
  views: BootstrapResponse["views"];
  onWorkspaceModeChange: (workspaceMode: OperatorWorkspaceMode) => void;
  onTenantChange: (tenantId: string) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectQueueView: (viewId: string) => void;
  onSelectQueueFilter: (filterId: string) => void;
  onSelectQueueTab: (tabId: ChangeDetailTabId) => void;
  onSelectQueueChange: (changeId: string) => void;
  onClearQueueSelection: () => void;
  onRetrySelectedChangeDetail: () => void;
};

type QueueNavigationPanelProps = {
  activeTenant: Tenant | null;
  activeViewId: string;
  activeFilterId: string;
  searchQuery: string;
  tenants: Tenant[];
  views: BootstrapResponse["views"];
  viewCounts: Record<string, number> | null;
  onTenantChange: (tenantId: string) => void;
  onSelectQueueView: (viewId: string) => void;
  onSelectQueueFilter: (filterId: string) => void;
};

function QueueNavigationPanel({
  activeTenant,
  activeViewId,
  activeFilterId,
  searchQuery,
  tenants,
  views,
  viewCounts,
  onTenantChange,
  onSelectQueueView,
  onSelectQueueFilter,
}: QueueNavigationPanelProps) {
  return (
    <section className="reference-panel reference-queue-navigation" data-platform-surface="tenant-queue-navigation">
      <div className="reference-panel-heading reference-panel-heading--queue">
        <div>
          <p className="eyebrow">Queue slices</p>
          <h2>{activeTenant?.name ?? "Unknown tenant"}</h2>
          <p className="subtitle">Canonical view, filter, and tenant state now live in the shared shell controller.</p>
        </div>
      </div>

      <div className="reference-queue-context-note">
        <strong>{activeTenant?.repoPath ?? "Missing tenant path"}</strong>
        <span>{activeTenant?.description || "No tenant description available yet."}</span>
        <span>
          Search:
          {" "}
          {searchQuery.trim() || "No active query"}
        </span>
      </div>

      <div className="reference-queue-view-list">
        {views.map((view) => (
          <PlatformPrimitives.Button
            key={view.id}
            type="button"
            className={`reference-queue-view-button ${
              activeViewId === view.id ? "active" : ""
            }`}
            data-platform-view={view.id}
            onClick={() => onSelectQueueView(view.id)}
          >
            <div className="reference-queue-view-button__header">
              <strong>{view.label}</strong>
              <span>{viewCounts?.[view.id] ?? "..."}</span>
            </div>
            <p>{describeView(view.id)}</p>
          </PlatformPrimitives.Button>
        ))}
      </div>

      <div className="reference-queue-chip-stack reference-queue-chip-stack--secondary">
        {OPERATOR_FILTERS.map((filter) => (
          <PlatformPrimitives.Button
            key={filter.id}
            type="button"
            className={`reference-chip-button ${activeFilterId === filter.id ? "active" : ""}`}
            onClick={() => onSelectQueueFilter(filter.id)}
          >
            <span>{filter.label}</span>
          </PlatformPrimitives.Button>
        ))}
      </div>

      <div className="reference-queue-context-note">
        <strong>Tenant switch</strong>
        <span>Queue hydration stays backend-owned when you move across repositories.</span>
        <select
          aria-label="Tenant switch"
          className="reference-queue-search-input reference-queue-utility__select"
          value={activeTenant?.id ?? tenants[0]?.id ?? ""}
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

type QueueWorklistPanelProps = {
  activeTenant: Tenant | null;
  queueWorkspace: QueueWorkspaceState;
  onSelectQueueChange: (changeId: string) => void;
};

function QueueWorklistPanel({
  activeTenant,
  queueWorkspace,
  onSelectQueueChange,
}: QueueWorklistPanelProps) {
  const activeViewTitle = describeView(queueWorkspace.activeViewId);

  return (
    <section className="reference-panel reference-queue-list-panel" data-platform-surface="tenant-queue-list">
      <div className="reference-panel-heading reference-panel-heading--queue">
        <div>
          <p className="eyebrow">Queue worklist</p>
          <h2>{activeViewTitle}</h2>
          <p className="subtitle">
            {queueWorkspace.status === "ready"
              ? `${queueWorkspace.visibleChanges.length} visible changes for ${activeTenant?.name ?? queueWorkspace.tenantId}`
              : `Hydrating queue for ${activeTenant?.name ?? queueWorkspace.tenantId}`}
          </p>
        </div>
      </div>

      <div className="reference-queue-table">
        {queueWorkspace.selectionNotice ? (
          <p
            className="governance-note"
            data-platform-governance={`queue-selection-${queueWorkspace.selectionNotice.kind}`}
          >
            <strong>
              {queueWorkspace.selectionNotice.kind === "cleared"
                ? "Selected change cleared."
                : "Selected change repaired."}
            </strong>{" "}
            {queueWorkspace.selectionNotice.message}
          </p>
        ) : null}

        {queueWorkspace.status === "loading" ? (
          <p className="governance-note" data-platform-governance="queue-loading">
            Hydrating backend-owned queue summaries for
            {" "}
            {activeTenant?.name ?? queueWorkspace.tenantId}
            .
          </p>
        ) : null}

        {queueWorkspace.status === "error" ? (
          <p className="governance-note" data-platform-governance="queue-error">
            <strong>Queue hydration failed.</strong> {queueWorkspace.error}
          </p>
        ) : null}

        {queueWorkspace.status === "ready" && queueWorkspace.visibleChanges.length === 0 ? (
          <div className="empty-state">
            No changes match the current queue slice.
            <div className="empty-state-actions">
              <span className="ghost-button">{queueWorkspace.searchQuery ? "Clear search or switch view" : "Switch view or filter"}</span>
            </div>
          </div>
        ) : null}

        {queueWorkspace.status === "ready" ? (
          <div className="reference-queue-list">
            {queueWorkspace.visibleChanges.map((change) => (
              <QueueRow
                key={change.id}
                change={change}
                isActive={queueWorkspace.selectedChangeId === change.id}
                onSelectQueueChange={onSelectQueueChange}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type QueueRowProps = {
  change: ChangeSummary;
  isActive: boolean;
  onSelectQueueChange: (changeId: string) => void;
};

function QueueRow({ change, isActive, onSelectQueueChange }: QueueRowProps) {
  return (
    <PlatformPrimitives.Button
      type="button"
      className={`reference-queue-row ${isActive ? "active" : ""}`}
      data-change-id={change.id}
      aria-pressed={isActive}
      onClick={() => onSelectQueueChange(change.id)}
    >
      <div className="reference-queue-row-main">
        <span className="reference-compact-label" data-platform-compact-label>
          Change
        </span>
        <div className="reference-queue-row-heading">
          <strong>{change.title}</strong>
          <StatusBadge status={change.state} label={formatStateLabel(change.state)} />
        </div>
        <p>{change.subtitle}</p>
        <div className="reference-queue-row-meta">
          <span>{change.id}</span>
          <span>{change.owner.label}</span>
          <span>{change.verificationStatus}</span>
        </div>
      </div>
      <div className="reference-queue-row-side">
        <div>
          <span className="reference-queue-row-label">Next</span>
          <strong>{change.nextAction}</strong>
          <p>{change.blocker}</p>
        </div>
        <div>
          <span className="reference-queue-row-label">Loop cadence</span>
          <strong>{change.lastRunAgo}</strong>
          <p>
            {change.loopCount}
            {" "}
            loops recorded
          </p>
        </div>
        <div className="reference-queue-row-summary">
          <span>{change.mandatoryGapCount} mandatory gaps</span>
          <span>{change.tenantId}</span>
        </div>
      </div>
    </PlatformPrimitives.Button>
  );
}

function buildQueueMetrics(queueWorkspace: QueueWorkspaceState, activeTenant: Tenant | null): QueueMetric[] {
  if (queueWorkspace.status !== "ready") {
    return [
      {
        label: "Visible changes",
        value: "0",
        meta: "Queue hydration in progress",
      },
      {
        label: "Blocked",
        value: "0",
        meta: "No queue facts are declared until hydration completes",
      },
      {
        label: "Ready",
        value: "0",
        meta: "Backend queue contract still loading",
      },
      {
        label: "Selection",
        value: queueWorkspace.selectedChangeId ? "1" : "0",
        meta: activeTenant?.name ?? queueWorkspace.tenantId,
      },
    ];
  }

  const blockedCount = queueWorkspace.changes.filter((change) =>
    ["blocked_by_spec", "escalated"].includes(change.state),
  ).length;
  const readyCount = queueWorkspace.changes.filter((change) =>
    ["approved", "ready_for_acceptance"].includes(change.state),
  ).length;
  const reviewCount = queueWorkspace.changes.filter(
    (change) => change.mandatoryGapCount > 0 || ["review_pending", "gap_fixing"].includes(change.state),
  ).length;

  return [
    {
      label: "Visible changes",
      value: String(queueWorkspace.visibleChanges.length),
      meta: `${queueWorkspace.changes.length} total for ${activeTenant?.name ?? queueWorkspace.tenantId}`,
    },
    {
      label: "Needs review",
      value: String(reviewCount),
      meta: reviewCount > 0 ? "Mandatory gaps or review states are active" : "No review backlog right now",
    },
    {
      label: "Blocked",
      value: String(blockedCount),
      meta: blockedCount > 0 ? "Escalated or spec-blocked work is present" : "No blocked work in this tenant",
    },
    {
      label: "Ready",
      value: String(readyCount),
      meta: queueWorkspace.selectedChangeId
        ? `Selected ${queueWorkspace.selectedChangeId}`
        : "Select a queue row to open summary handoff",
    },
  ];
}
