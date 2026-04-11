import { useEffect, useMemo, useState } from "react";

import type { BootstrapResponse, RepositoryCatalogEntry, Tenant } from "../../types";
import {
  bootstrapResponseSchema,
  createChangeResponseSchema,
  createTenantResponseSchema,
  requestControlApi,
} from "../contracts";
import { REPOSITORY_CATALOG_FILTERS, resolveTenantId } from "../server-state";

import {
  buildOperatorRouteHref,
  DEFAULT_OPERATOR_FILTER_ID,
  DEFAULT_OPERATOR_WORKSPACE_MODE,
  readOperatorRouteState,
  type OperatorWorkspaceMode,
} from "./operatorRouteState";

const BOOTSTRAP_ENDPOINT = "/api/bootstrap";
const TENANTS_ENDPOINT = "/api/tenants";

export type FunctionalShellRouteState = {
  workspaceMode: OperatorWorkspaceMode;
  tenantId: string;
  filterId: string;
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
  hasExplicitCatalogSelection: boolean;
  toast: string | null;
  setWorkspaceMode: (workspaceMode: OperatorWorkspaceMode) => void;
  setTenantId: (tenantId: string) => void;
  setSearchQuery: (searchQuery: string) => void;
  setCatalogFilter: (filterId: string) => void;
  selectCatalogTenant: (tenantId: string) => Promise<void>;
  clearCatalogSelection: () => void;
  createTenant: (name: string, repoPath: string, description: string) => Promise<void>;
  createChange: () => Promise<void>;
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
  const [hasExplicitCatalogSelection, setHasExplicitCatalogSelection] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const commitHydratedState = (
    payload: BootstrapResponse,
    normalized: NormalizedShellLocation,
    options?: {
      historyMode?: "push" | "replace";
      explicitCatalogSelection?: boolean;
      toast?: string | null;
    },
  ) => {
    const historyMode = options?.historyMode ?? "replace";
    const explicitCatalogSelection = options?.explicitCatalogSelection ?? normalized.hasExplicitCatalogSelection;
    const nextToast = options?.toast ?? null;
    const currentHref = `${window.location.pathname}${window.location.search}`;

    if (currentHref !== normalized.href) {
      if (historyMode === "push") {
        window.history.pushState(window.history.state, "", normalized.href);
      } else {
        window.history.replaceState(window.history.state, "", normalized.href);
      }
    }

    setBootstrap(payload);
    setRouteState(normalized.routeState);
    setHasExplicitCatalogSelection(explicitCatalogSelection);
    setToast(nextToast);
    setError(null);
  };

  const refreshBootstrap = async (options?: {
    historyMode?: "push" | "replace";
    nextRouteState?: Partial<FunctionalShellRouteState>;
    explicitCatalogSelection?: boolean;
    toast?: string | null;
  }) => {
    const payload = await requestControlApi(BOOTSTRAP_ENDPOINT, bootstrapResponseSchema);
    const normalized = options?.nextRouteState
      ? normalizePreferredRoute(payload, window.location.pathname, options.nextRouteState)
      : normalizeLocation(payload, window.location.pathname, window.location.search);

    commitHydratedState(payload, normalized, options);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const payload = await requestControlApi(BOOTSTRAP_ENDPOINT, bootstrapResponseSchema);
        if (cancelled) {
          return;
        }

        const normalized = normalizeLocation(payload, window.location.pathname, window.location.search);
        commitHydratedState(payload, normalized);
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
      setHasExplicitCatalogSelection(normalized.hasExplicitCatalogSelection);
      setToast(null);
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
    setHasExplicitCatalogSelection(false);
    setToast(null);
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

  const applyRouteState = (
    nextRouteState: FunctionalShellRouteState,
    historyMode: "push" | "replace",
    options?: { explicitCatalogSelection?: boolean },
  ) => {
    if (!bootstrap) {
      return;
    }

    const normalized = sanitizeRouteState(bootstrap, nextRouteState);
    const href = buildFunctionalShellHref(window.location.pathname, bootstrap, normalized);
    const nextExplicitCatalogSelection =
      options?.explicitCatalogSelection ??
      (normalized.workspaceMode === "catalog" ? hasExplicitCatalogSelection : false);

    setRouteState(normalized);
    setHasExplicitCatalogSelection(nextExplicitCatalogSelection);
    setToast(null);

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
    hasExplicitCatalogSelection,
    toast,
    retry,
    setWorkspaceMode: (workspaceMode) => {
      applyRouteState({ ...routeState, workspaceMode }, "push", {
        explicitCatalogSelection: workspaceMode === "catalog" ? false : false,
      });
    },
    setTenantId: (tenantId) => {
      applyRouteState({ ...routeState, tenantId }, "push");
    },
    setSearchQuery: (searchQuery) => {
      applyRouteState({ ...routeState, searchQuery }, "replace");
    },
    setCatalogFilter: (filterId) => {
      applyRouteState({ ...routeState, workspaceMode: "catalog", filterId }, "push");
    },
    selectCatalogTenant: async (tenantId) => {
      applyRouteState({ ...routeState, workspaceMode: "catalog", tenantId }, "push", {
        explicitCatalogSelection: true,
      });
    },
    clearCatalogSelection: () => {
      setHasExplicitCatalogSelection(false);
      setToast(null);
    },
    createTenant: async (name, repoPath, description) => {
      const response = await requestControlApi(TENANTS_ENDPOINT, createTenantResponseSchema, {
        method: "POST",
        body: JSON.stringify({ name, repoPath, description }),
      });

      await refreshBootstrap({
        historyMode: "push",
        nextRouteState: {
          ...routeState,
          workspaceMode: "catalog",
          tenantId: response.tenant.id,
          filterId: DEFAULT_OPERATOR_FILTER_ID,
          searchQuery: "",
        },
        explicitCatalogSelection: true,
        toast: `Repository ${response.tenant.name} registered.`,
      });
    },
    createChange: async () => {
      const response = await requestControlApi(
        `/api/tenants/${routeState.tenantId}/changes`,
        createChangeResponseSchema,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "catalog",
        },
        explicitCatalogSelection: hasExplicitCatalogSelection,
        toast: `Change ${response.change.id} created for ${activeTenant?.name ?? routeState.tenantId}.`,
      });
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
    filterId: parsed.filterId,
    searchQuery: parsed.searchQuery,
  });
  const href = buildFunctionalShellHref(pathname, bootstrap, routeState);
  const currentHref = `${pathname}${search}`;

  return {
    routeState,
    href,
    shouldReplace: currentHref !== href,
    hasExplicitCatalogSelection: parsed.workspaceMode === "catalog" && Boolean(parsed.tenantId),
  };
}

function normalizePreferredRoute(
  bootstrap: BootstrapResponse,
  pathname: string,
  routeState: Partial<FunctionalShellRouteState>,
) {
  const normalizedRouteState = sanitizeRouteState(bootstrap, routeState);
  const href = buildFunctionalShellHref(pathname, bootstrap, normalizedRouteState);
  const currentHref = `${window.location.pathname}${window.location.search}`;

  return {
    routeState: normalizedRouteState,
    href,
    shouldReplace: currentHref !== href,
    hasExplicitCatalogSelection: false,
  };
}

function sanitizeRouteState(
  bootstrap: BootstrapResponse,
  routeState: Partial<FunctionalShellRouteState>,
): FunctionalShellRouteState {
  const workspaceMode = routeState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE;

  return {
    workspaceMode,
    tenantId: resolveTenantId(bootstrap, routeState.tenantId),
    filterId: resolveCatalogFilterId(workspaceMode, routeState.filterId),
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
    filterId:
      routeState.workspaceMode === "catalog" && routeState.filterId !== DEFAULT_OPERATOR_FILTER_ID
        ? routeState.filterId
        : undefined,
    searchQuery: routeState.searchQuery || undefined,
  });
}

type NormalizedShellLocation = {
  routeState: FunctionalShellRouteState;
  href: string;
  shouldReplace: boolean;
  hasExplicitCatalogSelection: boolean;
};

function resolveCatalogFilterId(workspaceMode: OperatorWorkspaceMode, filterId?: string) {
  if (workspaceMode !== "catalog") {
    return DEFAULT_OPERATOR_FILTER_ID;
  }

  return REPOSITORY_CATALOG_FILTERS.some((filter) => filter.id === filterId)
    ? (filterId ?? DEFAULT_OPERATOR_FILTER_ID)
    : DEFAULT_OPERATOR_FILTER_ID;
}
