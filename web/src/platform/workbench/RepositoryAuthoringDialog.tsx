import type { FormEvent } from "react";
import { useState } from "react";

import { PlatformPrimitives } from "../foundation";
import { useAsyncWorkflowCommandMachine } from "../workflow";

type RepositoryAuthoringDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTenant: (name: string, repoPath: string, description: string) => Promise<void>;
};

export function RepositoryAuthoringDialog({
  open,
  onOpenChange,
  onCreateTenant,
}: RepositoryAuthoringDialogProps) {
  const [repositoryName, setRepositoryName] = useState("");
  const [repositoryPath, setRepositoryPath] = useState("");
  const [repositoryDescription, setRepositoryDescription] = useState("");
  const workflow = useAsyncWorkflowCommandMachine();
  const normalizedRepositoryName = repositoryName.trim();
  const normalizedRepositoryPath = repositoryPath.trim();
  const normalizedRepositoryDescription = repositoryDescription.trim();
  const canCreateTenant = normalizedRepositoryName.length > 0 && normalizedRepositoryPath.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateTenant || workflow.isPending) {
      return;
    }
    workflow.runCommand({
      label: "Create repository",
      execute: async () => {
        await onCreateTenant(normalizedRepositoryName, normalizedRepositoryPath, normalizedRepositoryDescription);
        setRepositoryName("");
        setRepositoryPath("");
        setRepositoryDescription("");
        onOpenChange(false);
      },
    });
  }

  return (
    <PlatformPrimitives.Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!workflow.isPending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <PlatformPrimitives.Dialog.Portal>
        <PlatformPrimitives.Dialog.Backdrop className="modal-backdrop" />
        <PlatformPrimitives.Dialog.Viewport className="modal-viewport">
          <PlatformPrimitives.Dialog.Popup className="modal-popup">
            <div className="dialog-stack">
              <div className="dialog-header">
                <div className="stack">
                  <p className="eyebrow">Repository authoring</p>
                  <PlatformPrimitives.Dialog.Title>New repository</PlatformPrimitives.Dialog.Title>
                  <PlatformPrimitives.Dialog.Description className="muted">
                    Register a backend-owned repository workspace before creating changes inside it.
                  </PlatformPrimitives.Dialog.Description>
                </div>
              </div>
              <form className="dialog-form" onSubmit={handleSubmit}>
                <label className="field-stack">
                  <span>Repository name</span>
                  <input
                    aria-label="Repository name"
                    name="repository-name"
                    value={repositoryName}
                    onChange={(event) => setRepositoryName(event.target.value)}
                    placeholder="change-control-center-ui"
                    type="text"
                  />
                </label>
                <label className="field-stack">
                  <span>Repository path</span>
                  <input
                    aria-label="Repository path"
                    name="repository-path"
                    value={repositoryPath}
                    onChange={(event) => setRepositoryPath(event.target.value)}
                    placeholder="/home/egor/code/new-repository"
                    type="text"
                  />
                </label>
                <label className="field-stack">
                  <span>Description</span>
                  <textarea
                    aria-label="Repository description"
                    name="repository-description"
                    value={repositoryDescription}
                    onChange={(event) => setRepositoryDescription(event.target.value)}
                    placeholder="Short backend-owned description for this repository workspace."
                  />
                </label>
                {workflow.error ? (
                  <p className="governance-note" data-platform-governance="create-repository-error">
                    <strong>Repository creation failed.</strong> {workflow.error}
                  </p>
                ) : null}
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={workflow.isPending}
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={!canCreateTenant || workflow.isPending}
                  >
                    Create repository
                  </button>
                </div>
              </form>
            </div>
          </PlatformPrimitives.Dialog.Popup>
        </PlatformPrimitives.Dialog.Viewport>
      </PlatformPrimitives.Dialog.Portal>
    </PlatformPrimitives.Dialog.Root>
  );
}
