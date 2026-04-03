import type { FormEvent } from "react";
import { useState } from "react";

import type { BootstrapResponse } from "../../types";
import { PlatformPrimitives } from "../foundation";
import { useAsyncWorkflowCommandMachine } from "../workflow";

type WorkbenchHeaderProps = {
  activeTenantId: string;
  canRunNext: boolean;
  hasVisibleContextualPrimaryAction: boolean;
  realtimeNotice: string | null;
  searchQuery: string;
  tenants: BootstrapResponse["tenants"];
  onSearchQueryChange: (value: string) => void;
  onCreateTenant: (name: string, repoPath: string, description: string) => Promise<void>;
  onCreateChange: () => Promise<void>;
  onRunNext: () => Promise<void>;
  onTenantChange: (tenantId: string) => Promise<void>;
};

export function WorkbenchHeader({
  activeTenantId,
  canRunNext,
  hasVisibleContextualPrimaryAction,
  realtimeNotice,
  searchQuery,
  tenants,
  onSearchQueryChange,
  onCreateTenant,
  onCreateChange,
  onRunNext,
  onTenantChange,
}: WorkbenchHeaderProps) {
  const [isCreateTenantDialogOpen, setIsCreateTenantDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectRepoPath, setProjectRepoPath] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const globalWorkflow = useAsyncWorkflowCommandMachine();
  const runNextClassName = hasVisibleContextualPrimaryAction ? "ghost-button header-secondary-action" : "primary-button";
  const toolbarItems = tenants.map((tenant) => ({
    label: tenant.name,
    value: tenant.id,
  }));
  const normalizedProjectName = projectName.trim();
  const normalizedProjectRepoPath = projectRepoPath.trim();
  const normalizedProjectDescription = projectDescription.trim();
  const canCreateTenant = normalizedProjectName.length > 0 && normalizedProjectRepoPath.length > 0;

  function handleCreateTenantSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateTenant || globalWorkflow.isPending) {
      return;
    }
    globalWorkflow.runCommand({
      label: "Create project",
      execute: async () => {
        await onCreateTenant(normalizedProjectName, normalizedProjectRepoPath, normalizedProjectDescription);
        setProjectName("");
        setProjectRepoPath("");
        setProjectDescription("");
        setIsCreateTenantDialogOpen(false);
      },
    });
  }

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
              name="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="change, requirement, blocker"
              type="search"
            />
          </label>
          <PlatformPrimitives.Dialog.Root
            open={isCreateTenantDialogOpen}
            onOpenChange={(open) => {
              if (!globalWorkflow.isPending) {
                setIsCreateTenantDialogOpen(open);
              }
            }}
          >
            <PlatformPrimitives.Dialog.Trigger
              type="button"
              className="ghost-button"
              data-platform-action="new-project"
              disabled={globalWorkflow.isPending}
            >
              New project
            </PlatformPrimitives.Dialog.Trigger>
            <PlatformPrimitives.Dialog.Portal>
              <PlatformPrimitives.Dialog.Backdrop className="modal-backdrop" />
              <PlatformPrimitives.Dialog.Viewport className="modal-viewport">
                <PlatformPrimitives.Dialog.Popup className="modal-popup">
                  <div className="dialog-stack">
                    <div className="dialog-header">
                      <div className="stack">
                        <p className="eyebrow">Tenant Authoring</p>
                        <PlatformPrimitives.Dialog.Title>New project</PlatformPrimitives.Dialog.Title>
                        <PlatformPrimitives.Dialog.Description className="muted">
                          Register a backend-owned tenant entry for a new workspace before creating changes inside it.
                        </PlatformPrimitives.Dialog.Description>
                      </div>
                    </div>
                    <form className="dialog-form" onSubmit={handleCreateTenantSubmit}>
                      <label className="field-stack">
                        <span>Project name</span>
                        <input
                          aria-label="Project name"
                          name="project-name"
                          value={projectName}
                          onChange={(event) => setProjectName(event.target.value)}
                          placeholder="change-control-center-ui"
                          type="text"
                        />
                      </label>
                      <label className="field-stack">
                        <span>Repository path</span>
                        <input
                          aria-label="Repository path"
                          name="project-repo-path"
                          value={projectRepoPath}
                          onChange={(event) => setProjectRepoPath(event.target.value)}
                          placeholder="/home/egor/code/new-project"
                          type="text"
                        />
                      </label>
                      <label className="field-stack">
                        <span>Description</span>
                        <textarea
                          aria-label="Project description"
                          name="project-description"
                          value={projectDescription}
                          onChange={(event) => setProjectDescription(event.target.value)}
                          placeholder="Short backend-owned description for this tenant workspace."
                        />
                      </label>
                      {globalWorkflow.error ? (
                        <p className="governance-note" data-platform-governance="create-project-error">
                          <strong>Project creation failed.</strong> {globalWorkflow.error}
                        </p>
                      ) : null}
                      <div className="dialog-actions">
                        <PlatformPrimitives.Dialog.Close
                          type="button"
                          className="ghost-button"
                          disabled={globalWorkflow.isPending}
                        >
                          Cancel
                        </PlatformPrimitives.Dialog.Close>
                        <button type="submit" className="primary-button" disabled={!canCreateTenant || globalWorkflow.isPending}>
                          Create project
                        </button>
                      </div>
                    </form>
                  </div>
                </PlatformPrimitives.Dialog.Popup>
              </PlatformPrimitives.Dialog.Viewport>
            </PlatformPrimitives.Dialog.Portal>
          </PlatformPrimitives.Dialog.Root>
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
        </PlatformPrimitives.Toolbar.Root>
        <div className="tenant-picker">
          <span>Tenant</span>
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
              aria-label="Tenant"
              className="tenant-select-trigger"
              data-platform-foundation="base-ui-select"
              disabled={globalWorkflow.isPending}
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
            Select a change to run the next step.
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
