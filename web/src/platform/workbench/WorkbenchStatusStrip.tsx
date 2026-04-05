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
  const needsSetupRepositoryCount = repositoryCatalog.filter((entry) => entry.attentionState === "needs_setup").length;
  const quietRepositoryCount = repositoryCatalog.filter((entry) => entry.attentionState === "quiet").length;
  const selectedRunCount = detail?.runs.length ?? 0;
  const selectedClarificationCount = detail?.clarificationRounds.length ?? 0;
  const executionDenominator = Math.max(selectedRunCount, mandatoryGapCount, selectedClarificationCount, 1);
  const pressureDenominator = Math.max(
    blockedRepositoryCount,
    activeRepositoryCount,
    needsSetupRepositoryCount,
    quietRepositoryCount,
    1,
  );

  if (activeWorkspaceMode === "catalog") {
    return (
      <section className="reference-overview" data-platform-surface="workbench-overview">
        <div className="reference-page-header">
          <div>
            <p className="eyebrow">Repository operations</p>
            <h1>Repository portfolio</h1>
            <p className="subtitle">
              Backend-owned catalog for choosing where operator attention should move next.
            </p>
          </div>
          <div className="reference-header-note">
            <span className="reference-live-dot" aria-hidden="true" />
            served portfolio mode
          </div>
        </div>

        <div className="reference-metrics-grid" aria-label="Repository portfolio metrics">
          <MetricCard label="Repositories" value={String(repositoryCatalog.length)} meta="Tracked in the backend-owned catalog" />
          <MetricCard label="Blocked" value={String(blockedRepositoryCount)} meta="Need operator or spec intervention" />
          <MetricCard label="Active" value={String(activeRepositoryCount)} meta="Repositories with live work in progress" />
          <MetricCard label="Changes" value={String(totalChangeCount)} meta="Total backend-owned changes across the fleet" />
        </div>

        <div className="reference-support-grid">
          <article className="reference-panel reference-panel--wide">
            <div className="reference-panel-heading">
              <div>
                <h2>Portfolio pressure</h2>
                <p>Attention distribution across the repository fleet.</p>
              </div>
            </div>
            <div className="reference-lane-stack">
              <MetricLane
                label="Blocked"
                detail={`${blockedRepositoryCount} repositories`}
                percent={(blockedRepositoryCount / pressureDenominator) * 100}
                tone="amber"
              />
              <MetricLane
                label="Active"
                detail={`${activeRepositoryCount} repositories`}
                percent={(activeRepositoryCount / pressureDenominator) * 100}
                tone="blue"
              />
              <MetricLane
                label="Needs setup"
                detail={`${needsSetupRepositoryCount} repositories`}
                percent={(needsSetupRepositoryCount / pressureDenominator) * 100}
                tone="violet"
              />
              <MetricLane
                label="Quiet"
                detail={`${quietRepositoryCount} repositories`}
                percent={(quietRepositoryCount / pressureDenominator) * 100}
                tone="emerald"
              />
            </div>
          </article>

          <article className="reference-panel">
            <div className="reference-panel-heading">
              <div>
                <h2>Current selection</h2>
                <p>Repository context that anchors this portfolio view.</p>
              </div>
            </div>
            <dl className="reference-fact-list">
              <div>
                <dt>Repository</dt>
                <dd>{activeTenantName}</dd>
              </div>
              <div>
                <dt>Path</dt>
                <dd>{activeTenantRepoPath}</dd>
              </div>
              <div>
                <dt>Search</dt>
                <dd>{searchQuery.trim() || "No active query"}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="reference-overview" data-platform-surface="workbench-overview">
      <div className="reference-page-header">
        <div>
          <p className="eyebrow">Operator shell</p>
          <h1>Operator workbench</h1>
          <p className="subtitle">
            Backend-owned queue and selected-change workspace for {activeTenantName}.
          </p>
        </div>
        <div className="reference-header-note">
          <span className="reference-live-dot" aria-hidden="true" />
          served workbench · {activeTenantRepoPath}
        </div>
      </div>

      <div className="reference-metrics-grid" aria-label="Operator workbench metrics">
        <MetricCard label="Repositories" value={String(repositoryCatalog.length)} meta={`${blockedRepositoryCount} blocked right now`} />
        <MetricCard label="Visible queue" value={String(filteredChangeCount)} meta={`Slice ${activeViewLabel} · filter ${activeFilterLabel}`} />
        <MetricCard
          label="Focus"
          value={detail ? detail.change.id : "No selection"}
          meta={detail ? detail.change.title : "Select a change from the queue"}
        />
        <MetricCard label="Mandatory gaps" value={String(mandatoryGapCount)} meta="Open findings still blocking delivery" />
      </div>

      <div className="reference-support-grid">
        <article className="reference-panel reference-panel--wide">
          <div className="reference-panel-heading">
            <div>
              <h2>Repository pressure</h2>
              <p>Portfolio distribution behind the current queue slice.</p>
            </div>
          </div>
          <div className="reference-lane-stack">
            <MetricLane
              label="Blocked repositories"
              detail={`${blockedRepositoryCount} blocked`}
              percent={(blockedRepositoryCount / pressureDenominator) * 100}
              tone="amber"
            />
            <MetricLane
              label="Active repositories"
              detail={`${activeRepositoryCount} active`}
              percent={(activeRepositoryCount / pressureDenominator) * 100}
              tone="blue"
            />
            <MetricLane
              label="Needs setup"
              detail={`${needsSetupRepositoryCount} empty`}
              percent={(needsSetupRepositoryCount / pressureDenominator) * 100}
              tone="violet"
            />
            <MetricLane
              label="Quiet repositories"
              detail={`${quietRepositoryCount} quiet`}
              percent={(quietRepositoryCount / pressureDenominator) * 100}
              tone="emerald"
            />
          </div>
        </article>

        <article className="reference-panel">
          <div className="reference-panel-heading">
            <div>
              <h2>Execution health</h2>
              <p>Current selected-change load and workflow state.</p>
            </div>
          </div>
          <div className="reference-lane-stack">
            <MetricLane
              label="Visible queue"
              detail={`${filteredChangeCount} changes in ${activeViewLabel}`}
              percent={100}
              tone="blue"
            />
            <MetricLane
              label="Run lineage"
              detail={selectedRunCount > 0 ? `${selectedRunCount} runs captured` : "No runs yet"}
              percent={(selectedRunCount / executionDenominator) * 100}
              tone="violet"
            />
            <MetricLane
              label="Clarifications"
              detail={
                selectedClarificationCount > 0
                  ? `${selectedClarificationCount} rounds recorded`
                  : "No clarification rounds"
              }
              percent={(selectedClarificationCount / executionDenominator) * 100}
              tone="emerald"
            />
            <MetricLane
              label="Mandatory gaps"
              detail={mandatoryGapCount > 0 ? `${mandatoryGapCount} still open` : "No mandatory blockers"}
              percent={(mandatoryGapCount / executionDenominator) * 100}
              tone="amber"
            />
          </div>
          <dl className="reference-fact-list">
            <div>
              <dt>Selection</dt>
              <dd>{detail ? detail.change.owner.label : "Awaiting selection"}</dd>
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
    <article className="reference-metric-card">
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      <p>{meta}</p>
    </article>
  );
}

type MetricLaneProps = {
  label: string;
  detail: string;
  percent: number;
  tone: "amber" | "blue" | "emerald" | "violet";
};

function MetricLane({ label, detail, percent, tone }: MetricLaneProps) {
  return (
    <div className="reference-lane">
      <div className="reference-lane-header">
        <span>{label}</span>
        <strong>{detail}</strong>
      </div>
      <div className="reference-lane-track">
        <span className={`reference-lane-fill reference-lane-fill--${tone}`} style={{ width: `${Math.max(percent, 6)}%` }} aria-hidden="true" />
      </div>
    </div>
  );
}
