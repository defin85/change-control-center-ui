import type { ReactNode } from "react";

import "../../reference/OperatorStyleSamplePage.css";
import { ReferenceRepositoryCatalogPage } from "../../reference/ReferenceRepositoryCatalogPage";
import { ReferenceRunsWorkspacePage } from "../../reference/ReferenceRunsWorkspacePage";
import { ReferenceTenantQueuePage } from "../../reference/ReferenceTenantQueuePage";
import "./ShellBootstrapApp.css";

import { useShellBootstrapController } from "../navigation";

import { WorkspacePageShell } from "./WorkspacePageShell";

export function ShellBootstrapApp() {
  const controller = useShellBootstrapController();

  if (controller.status === "loading") {
    return <BootstrapShellStatus heading="Hydrating operator shell" body="Requesting backend-owned bootstrap state before any functional shell route is declared ready." />;
  }

  if (controller.status === "error") {
    return (
      <BootstrapShellStatus
        heading="Operator shell bootstrap failed"
        body={controller.error}
        actions={
          <button type="button" className="primary-button" onClick={controller.retry}>
            Retry bootstrap
          </button>
        }
      />
    );
  }

  const { bootstrap, routeState, activeTenant, hasExplicitCatalogSelection, toast } = controller;

  if (routeState.workspaceMode === "catalog") {
    return (
      <ReferenceRepositoryCatalogPage
        activeTenantId={routeState.tenantId}
        activeFilterId={routeState.filterId}
        buildWorkspaceHref={controller.buildWorkspaceHref}
        hasExplicitCatalogSelection={hasExplicitCatalogSelection}
        repositoryCatalog={bootstrap.repositoryCatalog}
        searchQuery={routeState.searchQuery}
        toast={toast}
        onWorkspaceModeChange={controller.setWorkspaceMode}
        onCreateTenant={controller.createTenant}
        onCreateChange={controller.createChange}
        onOpenQueue={() => controller.setWorkspaceMode("queue")}
        onSearchQueryChange={controller.setSearchQuery}
        onSelectCatalogTenant={controller.selectCatalogTenant}
        onClearCatalogSelection={controller.clearCatalogSelection}
        onSelectFilter={controller.setCatalogFilter}
      />
    );
  }

  if (routeState.workspaceMode === "queue") {
    return (
      <ReferenceTenantQueuePage
        activeTenant={activeTenant}
        activeTenantId={routeState.tenantId}
        buildWorkspaceHref={controller.buildWorkspaceHref}
        queueWorkspace={controller.queueWorkspace}
        toast={toast}
        tenants={bootstrap.tenants}
        views={bootstrap.views}
        onWorkspaceModeChange={controller.setWorkspaceMode}
        onTenantChange={controller.setTenantId}
        onSearchQueryChange={controller.setSearchQuery}
        onSelectQueueView={controller.setQueueView}
        onSelectQueueFilter={controller.setQueueFilter}
        onSelectQueueTab={controller.setQueueTab}
        onSelectQueueChange={controller.selectQueueChange}
        onClearQueueSelection={controller.clearQueueSelection}
        onRetrySelectedChangeDetail={controller.retrySelectedChangeDetail}
        onDeleteSelectedChange={controller.deleteSelectedChange}
        onRunSelectedChangeNextStep={controller.runSelectedChangeNextStep}
        onEscalateSelectedChange={controller.escalateSelectedChange}
        onBlockSelectedChangeBySpec={controller.blockSelectedChangeBySpec}
      />
    );
  }

  return (
    <ReferenceRunsWorkspacePage
      activeTenant={activeTenant}
      activeTenantId={routeState.tenantId}
      buildWorkspaceHref={controller.buildWorkspaceHref}
      runsWorkspace={controller.runsWorkspace}
      tenants={bootstrap.tenants}
      onWorkspaceModeChange={controller.setWorkspaceMode}
      onTenantChange={controller.setTenantId}
      onSearchQueryChange={controller.setSearchQuery}
      onSelectRunSlice={controller.setRunSlice}
      onSelectRun={controller.selectRun}
      onClearSelectedRun={controller.clearSelectedRun}
      onOpenSelectedRunChange={controller.openSelectedRunChange}
      onRetrySelectedRunDetail={controller.retrySelectedRunDetail}
    />
  );
}

type BootstrapShellStatusProps = {
  heading: string;
  body: string;
  actions?: ReactNode;
};

function BootstrapShellStatus({ heading, body, actions }: BootstrapShellStatusProps) {
  return (
    <WorkspacePageShell
      header={
        <header className="operator-style-sample__masthead">
          <div className="operator-style-sample__masthead-inner">
            <div className="operator-style-sample__brand">
              <div className="operator-style-sample__brand-mark" aria-hidden="true">
                CC
              </div>
              <div>
                <strong>Change Control Center</strong>
                <p>Functional shell bootstrap</p>
              </div>
            </div>
            <div className="operator-style-sample__actions">
              <span className="operator-style-sample__ghost-chip">bootstrap controller</span>
            </div>
          </div>
        </header>
      }
      workspace={
        <div className="bootstrap-shell-status" data-platform-surface="shell-bootstrap-status">
          <section className="reference-panel" data-platform-surface={actions ? "shell-bootstrap-error" : "shell-bootstrap-loading"}>
            <div className="reference-panel-heading">
              <div>
                <p className="eyebrow">Operator shell</p>
                <h2>{heading}</h2>
                <p>{body}</p>
              </div>
            </div>
            <div className="empty-state">
              The backend-served route stays explicit about hydration state instead of silently falling back to client-only sample UI.
              {actions ? <div className="empty-state-actions">{actions}</div> : null}
            </div>
          </section>
        </div>
      }
    />
  );
}
