import { useRef, type ReactNode } from "react";

import { PlatformPrimitives } from "../foundation";

type DetailWorkspaceShellProps = {
  detail: ReactNode;
  runInspection?: ReactNode | null;
  isCompactViewport: boolean;
  isOpen: boolean;
  selectedChangeId: string | null;
  onClose: () => void;
};

export function DetailWorkspaceShell({
  detail,
  runInspection,
  isCompactViewport,
  isOpen,
  selectedChangeId,
  onClose,
}: DetailWorkspaceShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  if (isCompactViewport) {
    return (
      <section
        className="detail-stage-shell"
        data-platform-shell="detail-workspace"
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
                  selectedChangeId
                    ? (document.querySelector(`[data-change-id="${selectedChangeId}"]`) as HTMLElement | null)
                    : null
                }
              >
                <div className="detail-stage-header">
                  <div>
                    <p className="block-label">Detail workspace</p>
                    <PlatformPrimitives.Drawer.Title>Selected change</PlatformPrimitives.Drawer.Title>
                    <PlatformPrimitives.Drawer.Description className="subtitle">
                      Review this change while keeping your queue place.
                    </PlatformPrimitives.Drawer.Description>
                  </div>
                  <PlatformPrimitives.Drawer.Close
                    ref={closeButtonRef}
                    type="button"
                    className="ghost-button"
                    aria-label="Back to queue"
                  >
                    Back to queue
                  </PlatformPrimitives.Drawer.Close>
                </div>
                <div className="detail-stage-content">
                  <div data-platform-slot="detail">{detail}</div>
                  {runInspection ? <div data-platform-slot="run-inspection">{runInspection}</div> : null}
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
      data-platform-shell="detail-workspace"
      data-platform-surface="selected-change-workspace"
      data-platform-open={isOpen ? "true" : "false"}
    >
      <div data-platform-slot="detail">{detail}</div>
      {runInspection ? <div data-platform-slot="run-inspection">{runInspection}</div> : null}
    </section>
  );
}
