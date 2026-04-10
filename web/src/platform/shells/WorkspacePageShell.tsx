import type { ReactNode } from "react";

type WorkspacePageShellProps = {
  header: ReactNode;
  hero?: ReactNode;
  workspace: ReactNode;
  detailWorkspace?: ReactNode;
  toast?: ReactNode;
};

export function WorkspacePageShell({
  header,
  hero,
  workspace,
  detailWorkspace,
  toast,
}: WorkspacePageShellProps) {
  return (
    <main className="app-shell operator-style-sample operator-style-live-workbench" data-platform-shell="workspace-page">
      {header}
      <div className="operator-style-sample__page canonical-workbench-page">
        {hero ? (
          <section className="hero-ribbon" data-platform-shell="status-strip">
            {hero}
          </section>
        ) : null}
        {workspace}
        {detailWorkspace}
        {toast}
      </div>
    </main>
  );
}
