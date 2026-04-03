import type { ReactNode } from "react";

type RunInspectionShellProps = {
  id?: string;
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function RunInspectionShell({ id, eyebrow, title, actions, children }: RunInspectionShellProps) {
  return (
    <section id={id} className="panel detail-panel run-inspection-panel" data-platform-shell="run-inspection">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {actions ? <div className="action-row">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
