import type { ReactNode } from "react";

type DetailPanelShellProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DetailPanelShell({ eyebrow, title, subtitle, actions, children }: DetailPanelShellProps) {
  return (
    <section className="panel detail-panel detail-surface-panel" data-platform-shell="detail-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="action-row">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
