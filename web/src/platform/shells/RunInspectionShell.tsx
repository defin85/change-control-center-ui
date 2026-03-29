import type { ReactNode } from "react";

type RunInspectionShellProps = {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function RunInspectionShell({ id, eyebrow, title, children }: RunInspectionShellProps) {
  return (
    <section id={id} className="panel detail-panel" data-platform-shell="run-inspection">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}
