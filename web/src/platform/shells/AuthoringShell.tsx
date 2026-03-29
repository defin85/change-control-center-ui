import type { ReactNode } from "react";

type AuthoringShellProps = {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AuthoringShell({ eyebrow, title, actions, children }: AuthoringShellProps) {
  return (
    <section className="clarification-panel" data-platform-shell="authoring">
      <div className="clarification-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
