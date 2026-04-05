import { formatStateLabel } from "../../lib";
import type { ChangeDetailResponse, RepositoryCatalogEntry } from "../../types";
import type { OperatorWorkspaceMode } from "../navigation";

type WorkbenchStatusStripProps = {
  activeWorkspaceMode: OperatorWorkspaceMode;
  activeTenantRepoPath: string;
  activeTenantName: string;
  activeViewLabel: string;
  activeFilterLabel: string;
  searchQuery: string;
  detail: ChangeDetailResponse | null;
  filteredChangeCount: number;
  repositoryCatalog: RepositoryCatalogEntry[];
};

export function WorkbenchStatusStrip({
  activeWorkspaceMode,
  activeTenantRepoPath,
  activeTenantName,
  activeViewLabel,
  activeFilterLabel,
  searchQuery,
  detail,
  filteredChangeCount,
  repositoryCatalog,
}: WorkbenchStatusStripProps) {
  const mandatoryGapCount = detail?.change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length ?? 0;
  const blockedRepositoryCount = repositoryCatalog.filter((entry) => entry.attentionState === "blocked").length;
  const activeRepositoryCount = repositoryCatalog.filter((entry) => entry.attentionState === "active").length;
  const totalChangeCount = repositoryCatalog.reduce((sum, entry) => sum + entry.changeCount, 0);

  if (activeWorkspaceMode === "catalog") {
    return (
      <section className="workbench-overview" data-platform-surface="signal-summary-card">
        <div className="workbench-overview-header">
          <div>
            <p className="eyebrow">Repository operations</p>
            <h2>Portfolio command surface</h2>
            <p className="subtitle">
              Live repository catalog for deciding where operator attention should move next.
            </p>
          </div>
          <div className="workbench-summary-note">
            <span className="workbench-live-dot" aria-hidden="true" />
            backend-served portfolio mode
          </div>
        </div>

        <div className="workbench-metrics-grid">
          <MetricCard label="Repositories" value={String(repositoryCatalog.length)} meta="Tracked in the portfolio catalog" />
          <MetricCard label="Blocked" value={String(blockedRepositoryCount)} meta="Need operator or spec intervention" />
          <MetricCard label="Active" value={String(activeRepositoryCount)} meta="Repositories with live work in progress" />
          <MetricCard label="Changes" value={String(totalChangeCount)} meta="Total backend-owned changes across the fleet" />
        </div>

        <div className="workbench-overview-grid">
          <article className="workbench-overview-panel">
            <div className="workbench-overview-panel-head">
              <div>
                <p className="eyebrow">Active repository</p>
                <h3>{activeTenantName}</h3>
              </div>
            </div>
            <dl className="workbench-overview-list">
              <div>
                <dt>Path</dt>
                <dd>{activeTenantRepoPath}</dd>
              </div>
              <div>
                <dt>Repository count</dt>
                <dd>{repositoryCatalog.length} visible</dd>
              </div>
            </dl>
          </article>

          <article className="workbench-overview-panel">
            <div className="workbench-overview-panel-head">
              <div>
                <p className="eyebrow">Pressure snapshot</p>
                <h3>Attention distribution</h3>
              </div>
            </div>
            <dl className="workbench-overview-list">
              <div>
                <dt>Blocked</dt>
                <dd>{blockedRepositoryCount} repositories</dd>
              </div>
              <div>
                <dt>Active</dt>
                <dd>{activeRepositoryCount} repositories</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="workbench-overview" data-platform-surface="signal-summary-card">
      <div className="workbench-overview-header">
        <div>
          <p className="eyebrow">Operator shell</p>
          <h2>{activeTenantName}</h2>
          <p className="subtitle">
            Backend-owned workbench for queue control, selected-change inspection, and run lineage.
          </p>
        </div>
        <div className="workbench-summary-note">
          <span className="workbench-live-dot" aria-hidden="true" />
          served workbench · {activeTenantRepoPath}
        </div>
      </div>

      <div className="workbench-metrics-grid">
        <MetricCard label="Queue" value={String(filteredChangeCount)} meta="Active changes in the current slice" />
        <MetricCard label="Focus" value={detail ? detail.change.id : "No selection"} meta={detail ? detail.change.title : "Select a change from the queue"} />
        <MetricCard label="Owner" value={detail ? detail.change.owner.label : "Queue idle"} meta={detail ? detail.change.owner.id : "Backend-owned owner contract"} />
        <MetricCard label="Mandatory gaps" value={String(mandatoryGapCount)} meta="Open findings still blocking delivery" />
      </div>

      <div className="workbench-overview-grid">
        <article className="workbench-overview-panel workbench-overview-panel--wide">
          <div className="workbench-overview-panel-head">
            <div>
              <p className="eyebrow">Queue posture</p>
              <h3>Current slice</h3>
            </div>
          </div>
          <dl className="workbench-overview-list">
            <div>
              <dt>View</dt>
              <dd>{activeViewLabel}</dd>
            </div>
            <div>
              <dt>Filter</dt>
              <dd>{activeFilterLabel}</dd>
            </div>
            <div>
              <dt>Search</dt>
              <dd>{searchQuery.trim() || "No active query"}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{detail ? formatStateLabel(detail.change.state) : "Awaiting selection"}</dd>
            </div>
          </dl>
        </article>

        <article className="workbench-overview-panel">
          <div className="workbench-overview-panel-head">
            <div>
              <p className="eyebrow">Repository pressure</p>
              <h3>Fleet snapshot</h3>
            </div>
          </div>
          <dl className="workbench-overview-list">
            <div>
              <dt>Repositories</dt>
              <dd>{repositoryCatalog.length}</dd>
            </div>
            <div>
              <dt>Blocked</dt>
              <dd>{blockedRepositoryCount}</dd>
            </div>
            <div>
              <dt>Active</dt>
              <dd>{activeRepositoryCount}</dd>
            </div>
            <div>
              <dt>Changes</dt>
              <dd>{totalChangeCount}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  meta: string;
};

function MetricCard({ label, value, meta }: MetricCardProps) {
  return (
    <article className="workbench-metric-card">
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      <p>{meta}</p>
    </article>
  );
}
