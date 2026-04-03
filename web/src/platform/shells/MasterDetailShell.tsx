import type { ReactNode } from "react";

type MasterDetailShellProps = {
  navigation: ReactNode;
  list: ReactNode;
  workspace?: ReactNode;
};

export function MasterDetailShell({ navigation, list, workspace }: MasterDetailShellProps) {
  return (
    <section className="operator-grid" data-platform-shell="master-detail">
      <div data-platform-slot="navigation">{navigation}</div>
      <div data-platform-slot="list">{list}</div>
      {workspace ? <div data-platform-slot="workspace">{workspace}</div> : null}
    </section>
  );
}
