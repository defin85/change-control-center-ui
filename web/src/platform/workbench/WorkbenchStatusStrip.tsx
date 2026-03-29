import { formatStateLabel } from "../../lib";
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
    <>
      <div className="hero-card" data-platform-surface="signal-summary-card">
        <span>Repository</span>
        <strong>{activeTenantRepoPath}</strong>
      </div>
      <div className="hero-card" data-platform-surface="signal-summary-card">
        <span>Changes</span>
        <strong>{filteredChangeCount}</strong>
      </div>
      <div className="hero-card" data-platform-surface="signal-summary-card">
        <span>Mandatory gaps</span>
        <strong>{mandatoryGapCount}</strong>
      </div>
      <div className="hero-card" data-platform-surface="signal-summary-card">
        <span>Selected State</span>
        <strong>{detail ? formatStateLabel(detail.change.state) : "none"}</strong>
      </div>
    </>
  );
}
