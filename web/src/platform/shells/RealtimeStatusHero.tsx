import type { ShellRealtimeBoundaryState } from "../navigation";

type RealtimeStatusHeroProps = {
  realtime: ShellRealtimeBoundaryState;
  onRetryRealtime: () => void;
};

export function RealtimeStatusHero({
  realtime,
  onRetryRealtime,
}: RealtimeStatusHeroProps) {
  if (realtime.status === "live" || !realtime.notice) {
    return null;
  }

  const isDegraded = realtime.status === "degraded";

  return (
    <div
      className={`hero-card hero-card-inline realtime-hero ${
        isDegraded ? "realtime-hero--degraded" : "realtime-hero--reconciling"
      }`}
      data-platform-surface="realtime-status"
      data-platform-governance={isDegraded ? "realtime-degraded" : "realtime-reconciling"}
      data-platform-realtime-status={realtime.status}
    >
      <div className="hero-inline-context">
        <strong>{isDegraded ? "Realtime degraded" : "Realtime reconciliation in progress"}</strong>
        <small>{realtime.notice}</small>
      </div>
      <div className="realtime-hero-actions">
        <span className="reference-detail-inline-note">
          {isDegraded
            ? "Retry the subscription without leaving the current tenant."
            : "Shared tenant events are reconciling queue, detail, and run state."}
        </span>
        {isDegraded ? (
          <button
            type="button"
            className="ghost-button"
            data-platform-action="retry-realtime"
            onClick={onRetryRealtime}
          >
            Retry realtime
          </button>
        ) : null}
      </div>
    </div>
  );
}
