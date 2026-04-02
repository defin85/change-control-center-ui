import { useEffect, useEffectEvent } from "react";

export type TenantRealtimeEvent = {
  type: string;
  changeId?: string;
  runId?: string;
  approvalId?: string;
  roundId?: string;
  factId?: string;
  state?: string;
};

type TenantRealtimeBoundaryOptions = {
  tenantId: string | null;
  onTenantEvent: (event: TenantRealtimeEvent) => Promise<void> | void;
  onRealtimeError?: (message: string) => void;
};

export function useTenantRealtimeBoundary({
  tenantId,
  onTenantEvent,
  onRealtimeError,
}: TenantRealtimeBoundaryOptions) {
  const handleTenantEvent = useEffectEvent(onTenantEvent);
  const handleRealtimeError = useEffectEvent(onRealtimeError ?? (() => undefined));

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/tenants/${tenantId}/events`);
    let closedIntentionally = false;

    socket.onopen = () => socket.send("subscribe");
    socket.onmessage = (event) => {
      const tenantEvent = parseTenantRealtimeEvent(event.data);
      if (!tenantEvent) {
        handleRealtimeError("Control API realtime reconciliation failed.");
        return;
      }

      void Promise.resolve(handleTenantEvent(tenantEvent)).catch((reason: unknown) => {
        handleRealtimeError(resolveRealtimeError(reason));
      });
    };
    socket.onerror = () => {
      handleRealtimeError("Control API realtime subscription failed.");
    };
    socket.onclose = () => {
      if (!closedIntentionally) {
        handleRealtimeError("Control API realtime subscription failed.");
      }
    };

    return () => {
      closedIntentionally = true;
      socket.close();
    };
  }, [tenantId]);
}

function resolveRealtimeError(reason: unknown) {
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }

  return "Control API realtime reconciliation failed.";
}

function parseTenantRealtimeEvent(raw: unknown): TenantRealtimeEvent | null {
  const payload = resolveRealtimePayload(raw);
  if (!payload || typeof payload.type !== "string" || !payload.type.trim()) {
    return null;
  }

  return {
    type: payload.type,
    changeId: readOptionalString(payload.changeId),
    runId: readOptionalString(payload.runId),
    approvalId: readOptionalString(payload.approvalId),
    roundId: readOptionalString(payload.roundId),
    factId: readOptionalString(payload.factId),
    state: readOptionalString(payload.state),
  };
}

function resolveRealtimePayload(raw: unknown) {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  if (raw && typeof raw === "object") {
    return raw as Record<string, unknown>;
  }

  return null;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}
