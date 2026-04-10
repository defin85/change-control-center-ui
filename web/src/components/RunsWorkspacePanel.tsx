import { useMemo } from "react";

import { PlatformPrimitives } from "../platform/foundation";
import { StatusBadge } from "../platform/shells/StatusBadge";
import type { RunListEntry, RunListSlice } from "../types";

type RunsWorkspacePanelProps = {
  entries: RunListEntry[];
  activeRunSlice: RunListSlice;
  searchQuery: string;
  selectedRunId: string | null;
  onRunSliceChange: (runSlice: RunListSlice) => void;
  onSelectRun: (runId: string, changeId?: string | null) => void;
  onClearSelection: () => void;
};

export function RunsWorkspacePanel({
  entries,
  activeRunSlice,
  searchQuery,
  selectedRunId,
  onRunSliceChange,
  onSelectRun,
  onClearSelection,
}: RunsWorkspacePanelProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEntries = useMemo(() => {
    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) =>
      [
        entry.id,
        entry.kind,
        entry.status,
        entry.result,
        entry.outcome,
        entry.decision,
        entry.recentActivity,
        entry.change.id,
        entry.change.title,
        entry.change.subtitle,
        entry.change.state,
        entry.change.nextAction,
        entry.change.owner.label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [entries, normalizedQuery]);

  return (
    <section className="queue-panel reference-panel reference-queue-panel" data-platform-surface="runs-worklist">
      <div className="reference-panel-heading reference-panel-heading--queue">
        <div>
          <p className="eyebrow">Runs</p>
          <h2>{activeRunSlice === "attention" ? "Needs attention" : "All history"}</h2>
          <p className="subtitle">{filteredEntries.length} backend-owned runs in the current tenant slice</p>
        </div>
        <div className="reference-panel-actions">
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button reference-chip-button"
            data-platform-action="clear-run-selection"
            onClick={onClearSelection}
            disabled={!selectedRunId}
          >
            Clear selection
          </PlatformPrimitives.Button>
        </div>
      </div>

      <div className="reference-queue-toolbar" data-platform-surface="runs-filter-context">
        <div className="reference-queue-chip-stack">
          <PlatformPrimitives.Button
            type="button"
            className={`reference-chip-button ${activeRunSlice === "attention" ? "active" : ""}`}
            data-platform-action="runs-slice-attention"
            onClick={() => onRunSliceChange("attention")}
          >
            <span>Needs attention</span>
          </PlatformPrimitives.Button>
          <PlatformPrimitives.Button
            type="button"
            className={`reference-chip-button ${activeRunSlice === "all" ? "active" : ""}`}
            data-platform-action="runs-slice-all"
            onClick={() => onRunSliceChange("all")}
          >
            <span>All history</span>
          </PlatformPrimitives.Button>
        </div>
        <div className="reference-queue-context-note">
          <strong>{activeRunSlice === "attention" ? "Attention-first slice" : "Full run ledger"}</strong>
          <span>
            {normalizedQuery
              ? `Filtered by "${searchQuery.trim()}"`
              : "Scan run status, approvals, and linked change context without leaving the tenant."}
          </span>
        </div>
      </div>

      <div className="reference-queue-table" data-platform-foundation="tanstack-table">
        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            {activeRunSlice === "attention"
              ? "No runs currently require attention in this repository."
              : "No runs match the current query. Try another search or switch slices."}
          </div>
        ) : (
          <div className="reference-queue-list">
            {filteredEntries.map((entry) => (
              <PlatformPrimitives.Button
                key={entry.id}
                type="button"
                className={`reference-queue-row ${selectedRunId === entry.id ? "active" : ""}`}
                data-platform-foundation="base-ui-run-row"
                data-run-id={entry.id}
                aria-label={`${entry.id} ${entry.change.title}`}
                aria-pressed={selectedRunId === entry.id}
                onClick={() => onSelectRun(entry.id, entry.change.id)}
              >
                <div className="reference-queue-row-main" data-platform-compact-field="run">
                  <span className="reference-compact-label" data-platform-compact-label>
                    Run
                  </span>
                  <div className="reference-queue-row-heading">
                    <strong>{entry.id}</strong>
                    <StatusBadge status={entry.status} label={entry.status} />
                  </div>
                  <p>{entry.change.id} · {entry.change.title}</p>
                  <div className="reference-queue-row-meta">
                    <span>{entry.kind}</span>
                    <span>{entry.result}</span>
                    <span>{entry.recentActivity}</span>
                  </div>
                </div>
                <div className="reference-queue-row-side">
                  <div data-platform-compact-field="change">
                    <span className="reference-compact-label" data-platform-compact-label>
                      Owning change
                    </span>
                    <strong>{entry.change.state}</strong>
                    <p>{entry.change.owner.label}</p>
                  </div>
                  <div>
                    <span className="reference-queue-row-label reference-compact-label" data-platform-compact-label>
                      Outcome
                    </span>
                    <strong>{entry.outcome}</strong>
                  </div>
                  <div>
                    <span className="reference-queue-row-label">Next step</span>
                    <p>{entry.change.nextAction}</p>
                  </div>
                  <div className="reference-queue-row-summary">
                    <span>{entry.pendingApprovalCount} pending approvals</span>
                    <span>{entry.duration}</span>
                    <span>{entry.transport}</span>
                  </div>
                </div>
              </PlatformPrimitives.Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
