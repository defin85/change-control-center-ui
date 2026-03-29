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
    <main className="app-shell" data-platform-shell="workspace-page">
      {header}
      {hero ? (
        <section className="hero-ribbon" data-platform-shell="status-strip">
          {hero}
        </section>
      ) : null}
      {workspace}
      {detailWorkspace}
      {toast}
    </main>
  );
}
