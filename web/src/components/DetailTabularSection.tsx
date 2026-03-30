import type { ReactNode } from "react";

import { PlatformTable } from "../platform/foundation";
import type { TanStackRow, TanStackTable } from "../platform/foundation/table";

type DetailTabularSectionProps<TData> = {
  table: TanStackTable<TData>;
  emptyMessage: string;
  headerClassName: string;
  renderRow: (row: TanStackRow<TData>) => ReactNode;
};

export function DetailTabularSection<TData>({
  table,
  emptyMessage,
  headerClassName,
  renderRow,
}: DetailTabularSectionProps<TData>) {
  const rows = table.getRowModel().rows;

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
        {rows.length === 0 ? <div className="empty-state">{emptyMessage}</div> : rows.map(renderRow)}
      </div>
    </div>
  );
}
