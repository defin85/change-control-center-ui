import { useRef, type ReactNode } from "react";

import { PlatformPrimitives } from "../foundation";

type RepositoryCatalogWorkspaceShellProps = {
  detail: ReactNode;
  isCompactViewport: boolean;
  isOpen: boolean;
  selectedTenantId: string | null;
  onClose: () => void;
};

export function RepositoryCatalogWorkspaceShell({
  detail,
  isCompactViewport,
  isOpen,
  selectedTenantId,
  onClose,
}: RepositoryCatalogWorkspaceShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  if (isCompactViewport) {
    return (
      <section
        className="detail-stage-shell"
        data-platform-shell="repository-catalog-workspace"
        data-platform-open={isOpen ? "true" : "false"}
      >
        <PlatformPrimitives.Drawer.Root open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
          <PlatformPrimitives.Drawer.Portal>
            <PlatformPrimitives.Drawer.Backdrop className="detail-stage-backdrop" />
            <PlatformPrimitives.Drawer.Viewport className="detail-stage detail-stage-viewport">
              <PlatformPrimitives.Drawer.Popup
                className="detail-stage-panel"
                initialFocus={closeButtonRef}
                finalFocus={() =>
                  selectedTenantId
                    ? (document.querySelector(`[data-tenant-id="${selectedTenantId}"]`) as HTMLElement | null)
                    : null
                }
              >
                <div className="detail-stage-header">
                  <div>
                    <p className="block-label">Repository profile</p>
                    <PlatformPrimitives.Drawer.Title>Selected repository</PlatformPrimitives.Drawer.Title>
                    <PlatformPrimitives.Drawer.Description className="subtitle">
                      Review workload and choose the next repository action.
                    </PlatformPrimitives.Drawer.Description>
                  </div>
                  <PlatformPrimitives.Drawer.Close
                    ref={closeButtonRef}
                    type="button"
                    className="ghost-button"
                    aria-label="Back to repositories"
                  >
                    Back to repositories
                  </PlatformPrimitives.Drawer.Close>
                </div>
                <div className="detail-stage-content">
                  <div data-platform-slot="detail">{detail}</div>
                </div>
              </PlatformPrimitives.Drawer.Popup>
            </PlatformPrimitives.Drawer.Viewport>
          </PlatformPrimitives.Drawer.Portal>
        </PlatformPrimitives.Drawer.Root>
      </section>
    );
  }

  return (
    <section
      className="context-workspace"
      data-platform-shell="repository-catalog-workspace"
      data-platform-surface="selected-repository-workspace"
      data-platform-open={isOpen ? "true" : "false"}
    >
      <div data-platform-slot="detail">{detail}</div>
    </section>
  );
}
