import type { BootstrapResponse } from "../../types";
import type { OperatorWorkspaceMode } from "../navigation";
import { PlatformPrimitives } from "../foundation";
import { useAsyncWorkflowCommandMachine } from "../workflow";

type WorkbenchHeaderProps = {
  activeWorkspaceMode: OperatorWorkspaceMode;
  activeTenantId: string;
  canRunNext: boolean;
  hasVisibleContextualPrimaryAction: boolean;
  realtimeNotice: string | null;
  searchQuery: string;
  tenants: BootstrapResponse["tenants"];
  onSearchQueryChange: (value: string) => void;
  onOpenCreateTenant: () => void;
  onCreateChange: () => Promise<void>;
  onRunNext: () => Promise<void>;
  onTenantChange: (tenantId: string) => Promise<void>;
  onWorkspaceModeChange: (workspaceMode: OperatorWorkspaceMode) => void;
};

export function WorkbenchHeader({
  activeWorkspaceMode,
  activeTenantId,
  canRunNext,
  hasVisibleContextualPrimaryAction,
  realtimeNotice,
  searchQuery,
  tenants,
  onSearchQueryChange,
  onOpenCreateTenant,
  onCreateChange,
  onRunNext,
  onTenantChange,
  onWorkspaceModeChange,
}: WorkbenchHeaderProps) {
  const globalWorkflow = useAsyncWorkflowCommandMachine();
  const runNextClassName =
    activeWorkspaceMode === "catalog" || hasVisibleContextualPrimaryAction
      ? "ghost-button header-secondary-action"
      : "primary-button";
  const toolbarItems = tenants.map((tenant) => ({
    label: tenant.name,
    value: tenant.id,
  }));
  const shellSubtitle =
    activeWorkspaceMode === "catalog"
      ? "Portfolio-level repository catalog for choosing which workspace needs attention next."
      : "Operational workbench for backend-owned changes, run lineage, and clarification rounds.";
  const searchPlaceholder =
    activeWorkspaceMode === "catalog" ? "repository, path, attention" : "change, requirement, blocker";
  const shellModeLabel = activeWorkspaceMode === "catalog" ? "portfolio review" : "live operational shell";

  return (
    <header className="topbar workbench-masthead" data-platform-surface="workbench-header">
      <div className="workbench-masthead-row">
        <div className="topbar-title">
          <div className="topbar-brand">
            <div className="topbar-brand-mark" aria-hidden="true">
              CC
            </div>
            <div className="topbar-brand-copy">
              <p className="eyebrow">Operator Workbench</p>
              <h1>Change Control Center</h1>
              <p className="subtitle">{shellSubtitle}</p>
            </div>
          </div>
        </div>
        <PlatformPrimitives.Toolbar.Root
          className="workbench-masthead-nav"
          aria-label="Preview sections"
        >
          <PlatformPrimitives.Toolbar.Button
            type="button"
            className={`workbench-nav-pill ${activeWorkspaceMode === "queue" ? "active" : ""}`}
            data-platform-action="workspace-queue"
            aria-pressed={activeWorkspaceMode === "queue"}
            onClick={() => onWorkspaceModeChange("queue")}
          >
            Workbench
          </PlatformPrimitives.Toolbar.Button>
          <PlatformPrimitives.Toolbar.Button
            type="button"
            className={`workbench-nav-pill ${activeWorkspaceMode === "catalog" ? "active" : ""}`}
            data-platform-action="workspace-catalog"
            aria-pressed={activeWorkspaceMode === "catalog"}
            onClick={() => onWorkspaceModeChange("catalog")}
          >
            Repositories
          </PlatformPrimitives.Toolbar.Button>
          <span className="workbench-nav-pill workbench-nav-pill--static">Runs</span>
          <span className="workbench-nav-pill workbench-nav-pill--static">Governance</span>
        </PlatformPrimitives.Toolbar.Root>
        <div className="topbar-actions workbench-masthead-actions" data-platform-surface="global-actions">
          <PlatformPrimitives.Toolbar.Root className="topbar-toolbar workbench-masthead-toolbar" data-platform-foundation="base-ui-toolbar">
            <label className="search-field workbench-search-field">
              <span>Search</span>
              <PlatformPrimitives.Toolbar.Input
                aria-label="Search"
                className="toolbar-input"
                name="search"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder={searchPlaceholder}
                type="search"
              />
            </label>
            {activeWorkspaceMode === "queue" ? (
              <div className="tenant-picker">
                <span>Repository</span>
                <PlatformPrimitives.Select.Root
                  items={toolbarItems}
                  name="tenant"
                  value={activeTenantId}
                  onValueChange={(tenantId) => {
                    if (typeof tenantId === "string") {
                      void onTenantChange(tenantId);
                    }
                  }}
                >
                  <PlatformPrimitives.Select.Trigger
                    aria-label="Repository"
                    className="tenant-select-trigger"
                    data-platform-foundation="base-ui-select"
                    disabled={globalWorkflow.isPending}
                  >
                    <PlatformPrimitives.Select.Value placeholder="Choose repository" />
                    <PlatformPrimitives.Select.Icon className="tenant-select-icon">▾</PlatformPrimitives.Select.Icon>
                  </PlatformPrimitives.Select.Trigger>
                  <PlatformPrimitives.Select.Portal>
                    <PlatformPrimitives.Select.Positioner sideOffset={8}>
                      <PlatformPrimitives.Select.Popup className="tenant-select-popup">
                        <PlatformPrimitives.Select.List className="tenant-select-list">
                          {tenants.map((tenant) => (
                            <PlatformPrimitives.Select.Item key={tenant.id} className="tenant-select-item" value={tenant.id}>
                              <PlatformPrimitives.Select.ItemText>{tenant.name}</PlatformPrimitives.Select.ItemText>
                            </PlatformPrimitives.Select.Item>
                          ))}
                        </PlatformPrimitives.Select.List>
                      </PlatformPrimitives.Select.Popup>
                    </PlatformPrimitives.Select.Positioner>
                  </PlatformPrimitives.Select.Portal>
                </PlatformPrimitives.Select.Root>
              </div>
            ) : null}
            <PlatformPrimitives.Toolbar.Button
              type="button"
              className="ghost-button"
              data-platform-action="new-repository"
              disabled={globalWorkflow.isPending}
              onClick={onOpenCreateTenant}
            >
              New repository
            </PlatformPrimitives.Toolbar.Button>
            <PlatformPrimitives.Toolbar.Button
              type="button"
              className="ghost-button"
              data-platform-action="new-change"
              onClick={() =>
                globalWorkflow.runCommand({
                  label: "New change",
                  execute: onCreateChange,
                })
              }
              disabled={globalWorkflow.isPending}
            >
              New change
            </PlatformPrimitives.Toolbar.Button>
            {activeWorkspaceMode === "queue" ? (
              <PlatformPrimitives.Toolbar.Button
                type="button"
                className={runNextClassName}
                data-platform-action="run-next-step"
                data-platform-hierarchy={hasVisibleContextualPrimaryAction ? "secondary" : "primary"}
                disabled={!canRunNext || globalWorkflow.isPending}
                title={
                  !canRunNext
                    ? "Select a change to continue."
                    : hasVisibleContextualPrimaryAction
                      ? "Use the selected change workspace for the primary next step."
                      : undefined
                }
                onClick={() =>
                  globalWorkflow.runCommand({
                    label: "Run next step",
                    execute: onRunNext,
                  })
                }
              >
                Run next step
              </PlatformPrimitives.Toolbar.Button>
            ) : null}
          </PlatformPrimitives.Toolbar.Root>
          <div className="workbench-masthead-meta">
            <span className="workbench-ghost-chip">{shellModeLabel}</span>
            <span className="workbench-ghost-chip">backend-owned state</span>
          </div>
          {activeWorkspaceMode === "queue" && !canRunNext ? (
            <div className="shell-notices">
              <p className="governance-note" data-platform-governance="run-next-selection-required">
                Select a change to run the next step.
              </p>
            </div>
          ) : null}
          {globalWorkflow.error ? (
            <div className="shell-notices">
              <p className="governance-note" data-platform-governance="global-command-error">
                <strong>Global command failed.</strong> {globalWorkflow.error}
              </p>
            </div>
          ) : null}
          {globalWorkflow.isPending ? (
            <div className="shell-notices">
              <p className="governance-note" data-platform-governance="global-command-pending">
                {globalWorkflow.activeLabel ?? "Global operator command in progress."}
              </p>
            </div>
          ) : null}
          {realtimeNotice ? (
            <div className="shell-notices">
              <p className="governance-note" data-platform-governance="realtime-degraded">
                {realtimeNotice}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
