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
  onClearSelection: () => void;
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
  onClearSelection,
  onSelectChange,
}: QueuePanelProps) {
  const normalizedQuery = searchQuery.trim();
  const columns = useMemo(
    () => [
      queueColumnHelper.display({
        id: "change",
        header: "Change",
        cell: (context) => (
          <span className="queue-title">
            <strong>{context.row.original.title}</strong>
            <span>{context.row.original.subtitle}</span>
            <small className="queue-id">{context.row.original.id}</small>
          </span>
        ),
      }),
      queueColumnHelper.accessor("state", {
        header: "State",
        cell: (context) => <StatusBadge status={context.getValue()} label={formatStateLabel(context.getValue())} />,
      }),
      queueColumnHelper.display({
        id: "owner",
        header: "Owner",
        cell: (context) => (
          <span className="queue-owner">
            <strong>{context.row.original.owner.label}</strong>
            <span>{context.row.original.owner.id}</span>
          </span>
        ),
      }),
      queueColumnHelper.accessor("blocker", {
        header: "Blocker",
        cell: (context) => <span className="queue-blocker">{context.getValue()}</span>,
      }),
      queueColumnHelper.display({
        id: "next-step",
        header: "Next step",
        cell: (context) => (
          <span className="queue-next-step">
            <strong>{context.row.original.nextAction}</strong>
            <span>
              {context.row.original.mandatoryGapCount} gaps · {context.row.original.loopCount} loops ·{" "}
              {context.row.original.lastRunAgo}
            </span>
          </span>
        ),
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
            data-platform-action="clear-selection"
            onClick={onClearSelection}
            disabled={!selectedChangeId}
          >
            Clear selection
          </PlatformPrimitives.Button>
        </div>
      </div>

      <div className="queue-context-grid" data-platform-surface="queue-filter-context">
        <article className="context-chip">
          <span>Slice</span>
          <strong>{activeViewLabel}</strong>
          <small>{activeViewHint}</small>
        </article>
        <article className="context-chip">
          <span>Filter</span>
          <strong>{activeFilterLabel}</strong>
          <small>{activeFilterHint}</small>
        </article>
        <article className="context-chip">
          <span>Search</span>
          <strong>{normalizedQuery || "No active search"}</strong>
          <small>{normalizedQuery ? "Queue results are narrowed by the current query." : "Showing the full current slice."}</small>
        </article>
        <article className="context-chip">
          <span>Ownership</span>
          <strong>Backend-owned</strong>
          <small>Queue rows use the same orchestrator contract as change detail.</small>
        </article>
      </div>

      <p className="governance-note" data-platform-governance="queue-actions-closed">
        Additional queue tools are unavailable in this workspace.
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
                data-change-id={row.original.id}
                aria-label={`${row.original.id} ${row.original.title}`}
                aria-pressed={selectedChangeId === row.original.id}
                onClick={() => onSelectChange(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => {
                  const header = cell.column.columnDef.header;
                  const compactLabel = typeof header === "string" ? header : cell.column.id;

                  return (
                    <span key={cell.id} className="responsive-field" data-platform-compact-field={cell.column.id}>
                      <span className="responsive-field-label" data-platform-compact-label>
                        {compactLabel}
                      </span>
                      <span className="responsive-field-value" data-platform-compact-value>
                        {PlatformTable.flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </span>
                    </span>
                  );
                })}
              </PlatformPrimitives.Button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

const queueColumnHelper = PlatformTable.createColumnHelper<ChangeSummary>();
