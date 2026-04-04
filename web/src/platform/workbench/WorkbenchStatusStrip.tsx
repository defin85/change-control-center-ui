import type { ChangeDetailResponse, RepositoryCatalogEntry } from "../../types";
import type { OperatorWorkspaceMode } from "../navigation";

type WorkbenchStatusStripProps = {
  activeWorkspaceMode: OperatorWorkspaceMode;
  activeTenantRepoPath: string;
  activeTenantName: string;
  detail: ChangeDetailResponse | null;
  filteredChangeCount: number;
  repositoryCatalog: RepositoryCatalogEntry[];
};

export function WorkbenchStatusStrip({
  activeWorkspaceMode,
  activeTenantRepoPath,
  activeTenantName,
  detail,
  filteredChangeCount,
  repositoryCatalog,
}: WorkbenchStatusStripProps) {
  const mandatoryGapCount = detail?.change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length ?? 0;

  if (activeWorkspaceMode === "catalog") {
    const blockedRepositoryCount = repositoryCatalog.filter((entry) => entry.attentionState === "blocked").length;
    const totalChangeCount = repositoryCatalog.reduce((sum, entry) => sum + entry.changeCount, 0);

    return (
      <div className="hero-card hero-card-inline" data-platform-surface="signal-summary-card">
        <div className="hero-inline-context">
          <span>Portfolio</span>
          <strong>{activeTenantName}</strong>
        </div>
        <dl className="hero-inline-metrics">
          <div>
            <dt>Repositories</dt>
            <dd>{repositoryCatalog.length}</dd>
          </div>
          <div>
            <dt>Blocked</dt>
            <dd>{blockedRepositoryCount}</dd>
          </div>
          <div>
            <dt>Changes</dt>
            <dd>{totalChangeCount}</dd>
          </div>
        </dl>
      </div>
    );
  }

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
