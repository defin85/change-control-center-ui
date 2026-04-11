import { useEffect, useMemo, useState } from "react";

import type { BootstrapResponse, RepositoryCatalogEntry, Tenant } from "../../types";
import { bootstrapResponseSchema, requestControlApi } from "../contracts";
import { resolveTenantId } from "../server-state";

import {
  buildOperatorRouteHref,
  DEFAULT_OPERATOR_WORKSPACE_MODE,
  readOperatorRouteState,
  type OperatorWorkspaceMode,
} from "./operatorRouteState";

const BOOTSTRAP_ENDPOINT = "/api/bootstrap";

export type FunctionalShellRouteState = {
  workspaceMode: OperatorWorkspaceMode;
  tenantId: string;
  searchQuery: string;
};

type ShellBootstrapControllerBase = {
  retry: () => void;
};

export type ShellBootstrapControllerLoading = ShellBootstrapControllerBase & {
  status: "loading";
};

export type ShellBootstrapControllerError = ShellBootstrapControllerBase & {
  status: "error";
  error: string;
};

export type ShellBootstrapControllerReady = ShellBootstrapControllerBase & {
  status: "ready";
  bootstrap: BootstrapResponse;
  routeState: FunctionalShellRouteState;
  activeTenant: Tenant | null;
  activeRepositoryEntry: RepositoryCatalogEntry | null;
  setWorkspaceMode: (workspaceMode: OperatorWorkspaceMode) => void;
  setTenantId: (tenantId: string) => void;
  setSearchQuery: (searchQuery: string) => void;
  buildWorkspaceHref: (workspaceMode: OperatorWorkspaceMode) => string;
};

export type ShellBootstrapController =
  | ShellBootstrapControllerLoading
  | ShellBootstrapControllerError
  | ShellBootstrapControllerReady;

export function useShellBootstrapController(): ShellBootstrapController {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [routeState, setRouteState] = useState<FunctionalShellRouteState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const payload = await requestControlApi(BOOTSTRAP_ENDPOINT, bootstrapResponseSchema);
        if (cancelled) {
          return;
        }

        const normalized = normalizeLocation(payload, window.location.pathname, window.location.search);
        if (normalized.shouldReplace) {
          window.history.replaceState(window.history.state, "", normalized.href);
        }

        setBootstrap(payload);
        setRouteState(normalized.routeState);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Unable to hydrate the operator shell.");
      }
    }

    void loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    const handlePopState = () => {
      const normalized = normalizeLocation(bootstrap, window.location.pathname, window.location.search);
      if (normalized.shouldReplace) {
        window.history.replaceState(window.history.state, "", normalized.href);
      }
      setRouteState(normalized.routeState);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [bootstrap]);

  const retry = () => {
    setBootstrap(null);
    setRouteState(null);
    setError(null);
    setReloadCount((count) => count + 1);
  };

  const activeTenant = useMemo(() => {
    if (!bootstrap || !routeState) {
      return null;
    }

    return bootstrap.tenants.find((tenant) => tenant.id === routeState.tenantId) ?? null;
  }, [bootstrap, routeState]);

  const activeRepositoryEntry = useMemo(() => {
    if (!bootstrap || !routeState) {
      return null;
    }

    return bootstrap.repositoryCatalog.find((entry) => entry.tenantId === routeState.tenantId) ?? null;
  }, [bootstrap, routeState]);

  const applyRouteState = (nextRouteState: FunctionalShellRouteState, historyMode: "push" | "replace") => {
    if (!bootstrap) {
      return;
    }

    const normalized = sanitizeRouteState(bootstrap, nextRouteState);
    const href = buildFunctionalShellHref(window.location.pathname, bootstrap, normalized);

    setRouteState(normalized);

    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (currentHref === href) {
      return;
    }

    if (historyMode === "push") {
      window.history.pushState(window.history.state, "", href);
      return;
    }

    window.history.replaceState(window.history.state, "", href);
  };

  if (error) {
    return {
      status: "error",
      error,
      retry,
    };
  }

  if (!bootstrap || !routeState) {
    return {
      status: "loading",
      retry,
    };
  }

  return {
    status: "ready",
    bootstrap,
    routeState,
    activeTenant,
    activeRepositoryEntry,
    retry,
    setWorkspaceMode: (workspaceMode) => {
      applyRouteState({ ...routeState, workspaceMode }, "push");
    },
    setTenantId: (tenantId) => {
      applyRouteState({ ...routeState, tenantId }, "push");
    },
    setSearchQuery: (searchQuery) => {
      applyRouteState({ ...routeState, searchQuery }, "replace");
    },
    buildWorkspaceHref: (workspaceMode) =>
      buildFunctionalShellHref(window.location.pathname, bootstrap, {
        ...routeState,
        workspaceMode,
      }),
  };
}

function normalizeLocation(bootstrap: BootstrapResponse, pathname: string, search: string) {
  const parsed = readOperatorRouteState(search);
  const routeState = sanitizeRouteState(bootstrap, {
    workspaceMode: parsed.workspaceMode,
    tenantId: parsed.tenantId,
    searchQuery: parsed.searchQuery,
  });
  const href = buildFunctionalShellHref(pathname, bootstrap, routeState);
  const currentHref = `${pathname}${search}`;

  return {
    routeState,
    href,
    shouldReplace: currentHref !== href,
  };
}

function sanitizeRouteState(
  bootstrap: BootstrapResponse,
  routeState: Partial<FunctionalShellRouteState>,
): FunctionalShellRouteState {
  return {
    workspaceMode: routeState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE,
    tenantId: resolveTenantId(bootstrap, routeState.tenantId),
    searchQuery: routeState.searchQuery?.trim() ?? "",
  };
}

function buildFunctionalShellHref(
  pathname: string,
  bootstrap: BootstrapResponse,
  routeState: FunctionalShellRouteState,
) {
  return buildOperatorRouteHref(pathname, {
    workspaceMode: routeState.workspaceMode,
    tenantId: routeState.tenantId === bootstrap.activeTenantId ? undefined : routeState.tenantId,
    searchQuery: routeState.searchQuery || undefined,
  });
}
