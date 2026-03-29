import { useEffect, useEffectEvent } from "react";

type TenantRealtimeBoundaryOptions = {
  tenantId: string | null;
  onTenantEvent: () => Promise<void> | void;
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

    socket.onopen = () => socket.send("subscribe");
    socket.onmessage = () => {
      void Promise.resolve(handleTenantEvent()).catch((reason: unknown) => {
        handleRealtimeError(resolveRealtimeError(reason));
      });
    };
    socket.onerror = () => {
      handleRealtimeError("Control API realtime subscription failed.");
    };

    return () => socket.close();
  }, [tenantId]);
}

function resolveRealtimeError(reason: unknown) {
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }

  return "Control API realtime reconciliation failed.";
}
