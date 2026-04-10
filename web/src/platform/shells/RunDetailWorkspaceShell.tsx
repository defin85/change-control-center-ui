import { useRef, type ReactNode } from "react";

import { PlatformPrimitives } from "../foundation";

type RunDetailWorkspaceShellProps = {
  detail: ReactNode;
  isCompactViewport: boolean;
  isOpen: boolean;
  selectedRunId: string | null;
  onClose: () => void;
};

export function RunDetailWorkspaceShell({
  detail,
  isCompactViewport,
  isOpen,
  selectedRunId,
  onClose,
}: RunDetailWorkspaceShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  if (isCompactViewport) {
    return (
      <section
        className="detail-stage-shell"
        data-platform-shell="run-detail-workspace"
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
                  selectedRunId
                    ? (document.querySelector(`[data-run-id="${selectedRunId}"]`) as HTMLElement | null)
                    : null
                }
              >
                <div className="detail-stage-header">
                  <div>
                    <p className="block-label">Run workspace</p>
                    <PlatformPrimitives.Drawer.Title>Selected run</PlatformPrimitives.Drawer.Title>
                    <PlatformPrimitives.Drawer.Description className="subtitle">
                      Inspect this run while keeping your place in the tenant worklist.
                    </PlatformPrimitives.Drawer.Description>
                  </div>
                  <PlatformPrimitives.Drawer.Close
                    ref={closeButtonRef}
                    type="button"
                    className="ghost-button"
                    aria-label="Back to runs"
                  >
                    Back to runs
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
      data-platform-shell="run-detail-workspace"
      data-platform-surface="selected-run-workspace"
      data-platform-open={isOpen ? "true" : "false"}
    >
      <div data-platform-slot="detail">{detail}</div>
    </section>
  );
}
