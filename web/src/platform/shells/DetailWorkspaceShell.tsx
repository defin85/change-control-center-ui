import type { ReactNode } from "react";

import { PlatformPrimitives } from "../foundation";

type DetailWorkspaceShellProps = {
  detail: ReactNode;
  runInspection: ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

export function DetailWorkspaceShell({ detail, runInspection, isOpen, onClose }: DetailWorkspaceShellProps) {
  return (
    <section className="detail-stage" data-platform-shell="detail-workspace" data-platform-open={isOpen ? "true" : "false"}>
      <PlatformPrimitives.Button
        type="button"
        className="detail-stage-backdrop"
        aria-label="Close detail workspace"
        onClick={onClose}
      />
      <div className="detail-stage-panel">
        <div className="detail-stage-header">
          <div>
            <p className="block-label">Detail workspace</p>
            <strong>Selected change context</strong>
          </div>
          <PlatformPrimitives.Button type="button" className="ghost-button" onClick={onClose}>
            Close workspace
          </PlatformPrimitives.Button>
        </div>
        <div className="detail-stage-content">
          <div data-platform-slot="detail">{detail}</div>
          <div data-platform-slot="run-inspection">{runInspection}</div>
        </div>
      </div>
    </section>
  );
}
