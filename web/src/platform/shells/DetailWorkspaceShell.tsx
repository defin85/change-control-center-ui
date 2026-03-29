import type { ReactNode } from "react";

type DetailWorkspaceShellProps = {
  detail: ReactNode;
  runInspection: ReactNode;
};

export function DetailWorkspaceShell({ detail, runInspection }: DetailWorkspaceShellProps) {
  return (
    <section className="detail-stage" data-platform-shell="detail-workspace">
      <div data-platform-slot="detail">{detail}</div>
      <div data-platform-slot="run-inspection">{runInspection}</div>
    </section>
  );
}
