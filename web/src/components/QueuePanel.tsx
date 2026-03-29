import { useMemo } from "react";

import type { ChangeSummary } from "../types";
import { formatStateLabel } from "../lib";
import { PlatformPrimitives, PlatformTable } from "../platform/foundation";
import { StatusBadge } from "../platform/shells/StatusBadge";

type QueuePanelProps = {
  changes: ChangeSummary[];
  selectedChangeId: string | null;
  activeViewLabel: string;
  activeViewHint: string;
  activeViewCount: number;
  activeFilterLabel: string;
  activeFilterHint: string;
  searchQuery: string;
  onSelectChange: (changeId: string) => void;
};

export function QueuePanel({
  changes,
  selectedChangeId,
  activeViewLabel,
  activeViewHint,
  activeViewCount,
  activeFilterLabel,
  activeFilterHint,
  searchQuery,
  onSelectChange,
}: QueuePanelProps) {
  const normalizedQuery = searchQuery.trim();
  const columns = useMemo(
    () => [
      queueColumnHelper.accessor("id", {
        header: "ID",
        cell: (context) => <span className="queue-id">{context.getValue()}</span>,
      }),
      queueColumnHelper.display({
        id: "title",
        header: "Title",
        cell: (context) => (
          <span className="queue-title">
            <strong>{context.row.original.title}</strong>
            <span>{context.row.original.subtitle}</span>
          </span>
        ),
      }),
      queueColumnHelper.accessor("state", {
        header: "State",
        cell: (context) => <StatusBadge status={context.getValue()} label={formatStateLabel(context.getValue())} />,
      }),
      queueColumnHelper.accessor("mandatoryGapCount", {
        header: "Gaps",
        cell: (context) => (
          <span>
            <strong>{context.getValue()}</strong>
          </span>
        ),
      }),
      queueColumnHelper.accessor("loopCount", {
        header: "Loops",
      }),
      queueColumnHelper.accessor("lastRunAgo", {
        header: "Last run",
      }),
      queueColumnHelper.accessor("blocker", {
        header: "Blocker",
      }),
      queueColumnHelper.accessor("nextAction", {
        header: "Next action",
      }),
    ],
    [],
  );
  const queueTable = PlatformTable.useReactTable({
    data: changes,
    columns,
    getCoreRowModel: PlatformTable.getCoreRowModel(),
    getRowId: (change) => change.id,
  });

  return (
    <section className="panel queue-panel" data-platform-surface="control-queue">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Control Queue</p>
          <h2>{activeViewLabel}</h2>
          <p className="subtitle">{activeViewCount} active changes in the current slice</p>
        </div>
        <div className="panel-head-actions">
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button"
            data-platform-foundation="base-ui-queue-actions"
            data-platform-action="saved-filters"
            title="Requires an approved OpenSpec change before it can become a product action."
            disabled
          >
            Saved filters
          </PlatformPrimitives.Button>
          <PlatformPrimitives.Button
            type="button"
            className="ghost-button"
            data-platform-foundation="base-ui-queue-actions"
            data-platform-action="export-report"
            title="Requires an approved OpenSpec change before it can become a product action."
            disabled
          >
            Export report
          </PlatformPrimitives.Button>
        </div>
      </div>

      <div className="queue-context-grid" data-platform-surface="queue-filter-context">
        <article className="context-chip">
          <span>Active slice</span>
          <strong>{activeViewLabel}</strong>
          <small>{activeViewHint}</small>
        </article>
        <article className="context-chip">
          <span>Queue filter</span>
          <strong>{activeFilterLabel}</strong>
          <small>{activeFilterHint}</small>
        </article>
        <article className="context-chip">
          <span>Search</span>
          <strong>{normalizedQuery || "No active search"}</strong>
          <small>{normalizedQuery ? "Queue results are narrowed by the current query." : "Showing the full current slice."}</small>
        </article>
      </div>

      <p className="governance-note" data-platform-governance="queue-actions-closed">
        Saved filters and report export stay unavailable until an approved OpenSpec change defines their backend contract.
      </p>

      <div className="queue-table" data-platform-foundation="tanstack-table">
        {queueTable.getHeaderGroups().map((headerGroup) => (
          <div key={headerGroup.id} className="queue-table-head">
            {headerGroup.headers.map((header) => (
              <span key={header.id}>
                {header.isPlaceholder ? null : PlatformTable.flexRender(header.column.columnDef.header, header.getContext())}
              </span>
            ))}
          </div>
        ))}

        <div className="queue-list">
          {changes.length === 0 ? (
            <div className="empty-state">No changes match the current slice. Try another view or clear search.</div>
          ) : (
            queueTable.getRowModel().rows.map((row) => (
              <PlatformPrimitives.Button
                key={row.id}
                type="button"
                className={`queue-row ${selectedChangeId === row.original.id ? "active" : ""}`}
                data-platform-foundation="base-ui-queue-row"
                onClick={() => onSelectChange(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <span key={cell.id}>
                    {PlatformTable.flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                ))}
              </PlatformPrimitives.Button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

const queueColumnHelper = PlatformTable.createColumnHelper<ChangeSummary>();
