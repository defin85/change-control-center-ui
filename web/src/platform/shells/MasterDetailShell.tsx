import type { ReactNode } from "react";

type MasterDetailShellProps = {
  navigation: ReactNode;
  list: ReactNode;
  inspector: ReactNode;
};

export function MasterDetailShell({ navigation, list, inspector }: MasterDetailShellProps) {
  return (
    <section className="operator-grid" data-platform-shell="master-detail">
      <div data-platform-slot="navigation">{navigation}</div>
      <div data-platform-slot="list">{list}</div>
      <div data-platform-slot="inspector">{inspector}</div>
    </section>
  );
}
