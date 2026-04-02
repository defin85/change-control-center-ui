import type { BootstrapResponse } from "../../types";
import { PlatformPrimitives } from "../foundation";
import { useAsyncWorkflowCommandMachine } from "../workflow";

type WorkbenchHeaderProps = {
  activeTenantId: string;
  canRunNext: boolean;
  realtimeNotice: string | null;
  searchQuery: string;
  tenants: BootstrapResponse["tenants"];
  onSearchQueryChange: (value: string) => void;
  onCreateChange: () => Promise<void>;
  onRunNext: () => Promise<void>;
  onTenantChange: (tenantId: string) => Promise<void>;
};

export function WorkbenchHeader({
  activeTenantId,
  canRunNext,
  realtimeNotice,
  searchQuery,
  tenants,
  onSearchQueryChange,
  onCreateChange,
  onRunNext,
  onTenantChange,
}: WorkbenchHeaderProps) {
  const globalWorkflow = useAsyncWorkflowCommandMachine();
  const toolbarItems = tenants.map((tenant) => ({
    label: tenant.name,
    value: tenant.id,
  }));

  return (
    <header className="topbar" data-platform-surface="workbench-header">
      <div className="topbar-title">
        <p className="eyebrow">Application Foundation</p>
        <h1>Change Control Center</h1>
        <p className="subtitle">Backend-owned operator shell with tenant memory, run lineage and clarification rounds.</p>
      </div>
      <div className="topbar-actions" data-platform-surface="global-actions">
        <PlatformPrimitives.Toolbar.Root className="topbar-toolbar" data-platform-foundation="base-ui-toolbar">
          <label className="search-field">
            <span>Search</span>
            <PlatformPrimitives.Toolbar.Input
              aria-label="Search"
              className="toolbar-input"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="change, requirement, blocker"
              type="search"
            />
          </label>
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
          <PlatformPrimitives.Toolbar.Button
            type="button"
            className="primary-button"
            data-platform-action="run-next-step"
            disabled={!canRunNext || globalWorkflow.isPending}
            title={canRunNext ? undefined : "Select a change before running the next backend-owned step."}
            onClick={() =>
              globalWorkflow.runCommand({
                label: "Run next step",
                execute: onRunNext,
              })
            }
          >
            Run next step
          </PlatformPrimitives.Toolbar.Button>
        </PlatformPrimitives.Toolbar.Root>
        <div className="tenant-picker">
          <span>Tenant</span>
          <PlatformPrimitives.Select.Root
            items={toolbarItems}
            value={activeTenantId}
            onValueChange={(tenantId) => {
              if (typeof tenantId === "string") {
                void onTenantChange(tenantId);
              }
            }}
          >
            <PlatformPrimitives.Select.Trigger
              aria-label="Tenant"
              className="tenant-select-trigger"
              data-platform-foundation="base-ui-select"
            >
              <PlatformPrimitives.Select.Value placeholder="Choose tenant" />
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
        {!canRunNext ? (
          <p className="governance-note" data-platform-governance="run-next-selection-required">
            Select a change before running the next backend-owned step.
          </p>
        ) : null}
        {globalWorkflow.error ? (
          <p className="governance-note" data-platform-governance="global-command-error">
            <strong>Global command failed.</strong> {globalWorkflow.error}
          </p>
        ) : null}
        {globalWorkflow.isPending ? (
          <p className="governance-note" data-platform-governance="global-command-pending">
            {globalWorkflow.activeLabel ?? "Global operator command in progress."}
          </p>
        ) : null}
        {realtimeNotice ? (
          <p className="governance-note" data-platform-governance="realtime-degraded">
            {realtimeNotice}
          </p>
        ) : null}
      </div>
    </header>
  );
}
