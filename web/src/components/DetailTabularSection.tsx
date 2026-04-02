import type { ReactNode } from "react";

import { PlatformTable } from "../platform/foundation";
import type { TanStackRow, TanStackTable } from "../platform/foundation/table";

type DetailTabularSectionProps<TData> = {
  table: TanStackTable<TData>;
  emptyMessage: string;
  headerClassName: string;
  renderRow: (row: TanStackRow<TData>, renderCells: (row: TanStackRow<TData>) => ReactNode[]) => ReactNode;
};

export function DetailTabularSection<TData>({
  table,
  emptyMessage,
  headerClassName,
  renderRow,
}: DetailTabularSectionProps<TData>) {
  const rows = table.getRowModel().rows;
  const renderCells = (row: TanStackRow<TData>) =>
    row.getVisibleCells().map((cell) => {
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
    });

  return (
    <div className="table-shell" data-platform-foundation="tanstack-table">
      {table.getHeaderGroups().map((headerGroup) => (
        <div key={headerGroup.id} className={`table-head ${headerClassName}`}>
          {headerGroup.headers.map((header) => (
            <span key={header.id}>
              {header.isPlaceholder ? null : PlatformTable.flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          ))}
        </div>
      ))}

      <div className="detail-table-body">
        {rows.length === 0 ? <div className="empty-state">{emptyMessage}</div> : rows.map((row) => renderRow(row, renderCells))}
      </div>
    </div>
  );
}
