import type { ChangeDetailResponse } from "../../types";

type WorkbenchStatusStripProps = {
  activeTenantRepoPath: string;
  detail: ChangeDetailResponse | null;
  filteredChangeCount: number;
};

export function WorkbenchStatusStrip({
  activeTenantRepoPath,
  detail,
  filteredChangeCount,
}: WorkbenchStatusStripProps) {
  const mandatoryGapCount = detail?.change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length ?? 0;

  return (
    <div className="hero-card hero-card-inline" data-platform-surface="signal-summary-card">
      <div className="hero-inline-context">
        <span>Repository</span>
        <strong>{activeTenantRepoPath}</strong>
      </div>
      <dl className="hero-inline-metrics">
        <div>
          <dt>Changes</dt>
          <dd>{filteredChangeCount}</dd>
        </div>
        <div>
          <dt>Mandatory gaps</dt>
          <dd>{mandatoryGapCount}</dd>
        </div>
        <div>
          <dt>Focus</dt>
          <dd>{detail ? detail.change.id : "No selection"}</dd>
        </div>
      </dl>
    </div>
  );
}
