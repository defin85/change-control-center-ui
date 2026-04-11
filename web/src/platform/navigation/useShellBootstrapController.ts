import { useEffect, useMemo, useRef, useState } from "react";

import type { BootstrapResponse, ChangeSummary, RepositoryCatalogEntry, Tenant } from "../../types";
import {
  bootstrapResponseSchema,
  changesResponseSchema,
  createChangeResponseSchema,
  createTenantResponseSchema,
  requestControlApi,
} from "../contracts";
import {
  buildViewCounts,
  filterChanges,
  OPERATOR_FILTERS,
  REPOSITORY_CATALOG_FILTERS,
  resolveTenantId,
  resolveViewId,
  resolveVisibleChangeSelection,
} from "../server-state";

import {
  buildOperatorRouteHref,
  DEFAULT_OPERATOR_FILTER_ID,
  DEFAULT_OPERATOR_VIEW_ID,
  DEFAULT_OPERATOR_WORKSPACE_MODE,
  readOperatorRouteState,
  type OperatorWorkspaceMode,
} from "./operatorRouteState";

const BOOTSTRAP_ENDPOINT = "/api/bootstrap";
const TENANTS_ENDPOINT = "/api/tenants";

export type FunctionalShellRouteState = {
  workspaceMode: OperatorWorkspaceMode;
  tenantId: string;
  viewId: string;
  filterId: string;
  searchQuery: string;
  changeId: string | null;
};

type QueueWorkspaceStateBase = {
  tenantId: string;
  activeViewId: string;
  activeFilterId: string;
  searchQuery: string;
  selectedChangeId: string | null;
  repairNotice: string | null;
};

export type QueueWorkspaceStateLoading = QueueWorkspaceStateBase & {
  status: "loading";
};

export type QueueWorkspaceStateError = QueueWorkspaceStateBase & {
  status: "error";
  error: string;
};

export type QueueWorkspaceStateReady = QueueWorkspaceStateBase & {
  status: "ready";
  changes: ChangeSummary[];
  visibleChanges: ChangeSummary[];
  selectedChange: ChangeSummary | null;
  viewCounts: Record<string, number>;
};

export type QueueWorkspaceState =
  | QueueWorkspaceStateLoading
  | QueueWorkspaceStateError
  | QueueWorkspaceStateReady;

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
  queueWorkspace: QueueWorkspaceState;
  activeTenant: Tenant | null;
  activeRepositoryEntry: RepositoryCatalogEntry | null;
  hasExplicitCatalogSelection: boolean;
  toast: string | null;
  setWorkspaceMode: (workspaceMode: OperatorWorkspaceMode) => void;
  setTenantId: (tenantId: string) => void;
  setSearchQuery: (searchQuery: string) => void;
  setCatalogFilter: (filterId: string) => void;
  setQueueView: (viewId: string) => void;
  setQueueFilter: (filterId: string) => void;
  selectQueueChange: (changeId: string) => void;
  clearQueueSelection: () => void;
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

type QueueHydrationState =
  | { status: "idle" }
  | { status: "loading"; tenantId: string }
  | { status: "error"; tenantId: string; error: string; repairNotice: string | null }
  | { status: "ready"; tenantId: string; changes: ChangeSummary[]; repairNotice: string | null };

export function useShellBootstrapController(): ShellBootstrapController {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [routeState, setRouteState] = useState<FunctionalShellRouteState | null>(null);
  const [queueHydration, setQueueHydration] = useState<QueueHydrationState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [hasExplicitCatalogSelection, setHasExplicitCatalogSelection] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const routeStateRef = useRef<FunctionalShellRouteState | null>(null);
  const queueHydrationTenantId = routeState?.tenantId ?? null;
  const queueHydrationWorkspaceMode = routeState?.workspaceMode ?? null;

  useEffect(() => {
    routeStateRef.current = routeState;
  }, [routeState]);

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
    const explicitCatalogSelection =
      options?.explicitCatalogSelection ?? normalized.hasExplicitCatalogSelection;
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
      const currentQueueChanges =
        queueHydration.status === "ready" && routeState?.tenantId === queueHydration.tenantId
          ? queueHydration.changes
          : undefined;
      const normalized = normalizeLocation(
        bootstrap,
        window.location.pathname,
        window.location.search,
        currentQueueChanges,
      );
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
  }, [bootstrap, queueHydration, routeState?.tenantId]);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    const bootstrapPayload = bootstrap;
    const routeStateSnapshot = routeStateRef.current;

    if (!bootstrapPayload || !routeStateSnapshot || routeStateSnapshot.workspaceMode !== "queue") {
      return;
    }

    const queueRouteState: FunctionalShellRouteState = routeStateSnapshot;
    const queueTenantId = queueRouteState.tenantId;

    let cancelled = false;

    async function loadQueue() {
      setQueueHydration({ status: "loading", tenantId: queueTenantId });

      try {
        const response = await requestControlApi(
          `/api/tenants/${queueTenantId}/changes`,
          changesResponseSchema,
        );
        if (cancelled) {
          return;
        }

        const normalizedRouteState = sanitizeRouteState(
          bootstrapPayload,
          queueRouteState,
          response.changes,
        );
        const repairNotice = resolveQueueRepairNotice(
          queueRouteState,
          normalizedRouteState,
          response.changes,
        );

        if (!areRouteStatesEqual(queueRouteState, normalizedRouteState)) {
          const href = buildFunctionalShellHref(
            window.location.pathname,
            bootstrapPayload,
            normalizedRouteState,
          );
          const currentHref = `${window.location.pathname}${window.location.search}`;
          if (currentHref !== href) {
            window.history.replaceState(window.history.state, "", href);
          }
          setRouteState(normalizedRouteState);
        }

        setQueueHydration({
          status: "ready",
          tenantId: queueTenantId,
          changes: response.changes,
          repairNotice,
        });
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setQueueHydration({
          status: "error",
          tenantId: queueTenantId,
          error:
            caughtError instanceof Error
              ? caughtError.message
              : `Unable to hydrate the queue for ${queueTenantId}.`,
          repairNotice: null,
        });
      }
    }

    void loadQueue();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, queueHydrationTenantId, queueHydrationWorkspaceMode]);

  const retry = () => {
    setBootstrap(null);
    setRouteState(null);
    setQueueHydration({ status: "idle" });
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

  const queueWorkspace = useMemo(() => {
    if (!bootstrap || !routeState) {
      return null;
    }

    return buildQueueWorkspaceState(bootstrap, routeState, queueHydration);
  }, [bootstrap, queueHydration, routeState]);

  const applyRouteState = (
    nextRouteState: Partial<FunctionalShellRouteState>,
    historyMode: "push" | "replace",
    options?: { explicitCatalogSelection?: boolean },
  ) => {
    if (!bootstrap || !routeState) {
      return;
    }

    const queueChanges = resolveCurrentQueueChanges(queueHydration, routeState, nextRouteState.tenantId);
    const requestedRouteState = sanitizeRouteState(bootstrap, { ...routeState, ...nextRouteState });
    const normalized = sanitizeRouteState(
      bootstrap,
      { ...routeState, ...nextRouteState },
      queueChanges,
    );
    const href = buildFunctionalShellHref(window.location.pathname, bootstrap, normalized);
    const nextExplicitCatalogSelection =
      options?.explicitCatalogSelection ??
      (normalized.workspaceMode === "catalog" ? hasExplicitCatalogSelection : false);
    const repairNotice =
      queueChanges && normalized.workspaceMode === "queue"
        ? resolveQueueRepairNotice(requestedRouteState, normalized, queueChanges)
        : null;

    setRouteState(normalized);
    setHasExplicitCatalogSelection(nextExplicitCatalogSelection);
    setToast(null);
    if (queueHydration.status === "ready" && normalized.workspaceMode === "queue") {
      setQueueHydration({
        ...queueHydration,
        repairNotice,
      });
    }

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

  if (!bootstrap || !routeState || !queueWorkspace) {
    return {
      status: "loading",
      retry,
    };
  }

  return {
    status: "ready",
    bootstrap,
    routeState,
    queueWorkspace,
    activeTenant,
    activeRepositoryEntry,
    hasExplicitCatalogSelection,
    toast,
    retry,
    setWorkspaceMode: (workspaceMode) => {
      applyRouteState({ workspaceMode }, "push", {
        explicitCatalogSelection: false,
      });
    },
    setTenantId: (tenantId) => {
      applyRouteState(
        {
          tenantId,
          changeId: routeState.workspaceMode === "queue" ? null : routeState.changeId,
        },
        "push",
      );
    },
    setSearchQuery: (searchQuery) => {
      applyRouteState({ searchQuery }, "replace");
    },
    setCatalogFilter: (filterId) => {
      applyRouteState({ workspaceMode: "catalog", filterId }, "push");
    },
    setQueueView: (viewId) => {
      applyRouteState({ workspaceMode: "queue", viewId }, "push");
    },
    setQueueFilter: (filterId) => {
      applyRouteState({ workspaceMode: "queue", filterId }, "push");
    },
    selectQueueChange: (changeId) => {
      applyRouteState({ workspaceMode: "queue", changeId }, "push");
    },
    clearQueueSelection: () => {
      applyRouteState({ workspaceMode: "queue", changeId: null }, "replace");
    },
    selectCatalogTenant: async (tenantId) => {
      applyRouteState({ workspaceMode: "catalog", tenantId }, "push", {
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
          changeId: null,
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
          changeId: null,
        },
        explicitCatalogSelection: hasExplicitCatalogSelection,
        toast: `Change ${response.change.id} created for ${activeTenant?.name ?? routeState.tenantId}.`,
      });
    },
    buildWorkspaceHref: (workspaceMode) => {
      const queueChanges = resolveCurrentQueueChanges(queueHydration, routeState);
      return buildFunctionalShellHref(
        window.location.pathname,
        bootstrap,
        sanitizeRouteState(bootstrap, { ...routeState, workspaceMode }, queueChanges),
      );
    },
  };
}

function buildQueueWorkspaceState(
  bootstrap: BootstrapResponse,
  routeState: FunctionalShellRouteState,
  queueHydration: QueueHydrationState,
): QueueWorkspaceState {
  const baseState = {
    tenantId: routeState.tenantId,
    activeViewId: routeState.viewId,
    activeFilterId: routeState.filterId,
    searchQuery: routeState.searchQuery,
    selectedChangeId: routeState.changeId,
  };

  if (queueHydration.status === "error" && queueHydration.tenantId === routeState.tenantId) {
    return {
      ...baseState,
      status: "error",
      error: queueHydration.error,
      repairNotice: queueHydration.repairNotice,
    };
  }

  if (queueHydration.status === "ready" && queueHydration.tenantId === routeState.tenantId) {
    const visibleChanges = filterChanges(queueHydration.changes, {
      activeViewId: routeState.viewId,
      activeFilterId: routeState.filterId,
      searchQuery: routeState.searchQuery,
    });

    return {
      ...baseState,
      status: "ready",
      repairNotice: queueHydration.repairNotice,
      changes: queueHydration.changes,
      visibleChanges,
      selectedChange:
        visibleChanges.find((change) => change.id === routeState.changeId) ?? null,
      viewCounts: buildViewCounts(bootstrap.views, queueHydration.changes),
    };
  }

  return {
    ...baseState,
    status: "loading",
    repairNotice: null,
  };
}

function normalizeLocation(
  bootstrap: BootstrapResponse,
  pathname: string,
  search: string,
  queueChanges?: ChangeSummary[],
) {
  const parsed = readOperatorRouteState(search);
  const routeState = sanitizeRouteState(
    bootstrap,
    {
      workspaceMode: parsed.workspaceMode,
      tenantId: parsed.tenantId,
      viewId: parsed.viewId,
      filterId: parsed.filterId,
      searchQuery: parsed.searchQuery,
      changeId: parsed.changeId ?? null,
    },
    queueChanges,
  );
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
  queueChanges?: ChangeSummary[],
): FunctionalShellRouteState {
  const workspaceMode = routeState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE;
  const tenantId = resolveTenantId(bootstrap, routeState.tenantId);
  const searchQuery = routeState.searchQuery?.trim() ?? "";

  if (workspaceMode === "catalog") {
    return {
      workspaceMode,
      tenantId,
      viewId: DEFAULT_OPERATOR_VIEW_ID,
      filterId: resolveCatalogFilterId(routeState.filterId),
      searchQuery,
      changeId: null,
    };
  }

  if (workspaceMode === "queue") {
    const viewId = resolveViewId(
      bootstrap,
      routeState.viewId ?? DEFAULT_OPERATOR_VIEW_ID,
      DEFAULT_OPERATOR_VIEW_ID,
    );
    const filterId = resolveQueueFilterId(routeState.filterId);

    return {
      workspaceMode,
      tenantId,
      viewId,
      filterId,
      searchQuery,
      changeId: queueChanges
        ? resolveVisibleChangeSelection(
            queueChanges,
            {
              activeViewId: viewId,
              activeFilterId: filterId,
              searchQuery,
            },
            routeState.changeId ?? null,
            false,
          )
        : routeState.changeId ?? null,
    };
  }

  return {
    workspaceMode,
    tenantId,
    viewId: DEFAULT_OPERATOR_VIEW_ID,
    filterId: DEFAULT_OPERATOR_FILTER_ID,
    searchQuery,
    changeId: null,
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
    viewId: routeState.workspaceMode === "queue" ? routeState.viewId : undefined,
    filterId:
      routeState.workspaceMode === "catalog" || routeState.workspaceMode === "queue"
        ? routeState.filterId
        : undefined,
    searchQuery: routeState.searchQuery || undefined,
    changeId: routeState.workspaceMode === "queue" ? routeState.changeId ?? undefined : undefined,
  });
}

function resolveCurrentQueueChanges(
  queueHydration: QueueHydrationState,
  routeState: FunctionalShellRouteState,
  preferredTenantId?: string,
) {
  const tenantId = preferredTenantId ?? routeState.tenantId;
  return queueHydration.status === "ready" && queueHydration.tenantId === tenantId
    ? queueHydration.changes
    : undefined;
}

function resolveCatalogFilterId(filterId?: string) {
  return REPOSITORY_CATALOG_FILTERS.some((filter) => filter.id === filterId)
    ? (filterId ?? DEFAULT_OPERATOR_FILTER_ID)
    : DEFAULT_OPERATOR_FILTER_ID;
}

function resolveQueueFilterId(filterId?: string) {
  return OPERATOR_FILTERS.some((filter) => filter.id === filterId)
    ? (filterId ?? DEFAULT_OPERATOR_FILTER_ID)
    : DEFAULT_OPERATOR_FILTER_ID;
}

function resolveQueueRepairNotice(
  originalRouteState: FunctionalShellRouteState,
  normalizedRouteState: FunctionalShellRouteState,
  queueChanges: ChangeSummary[],
) {
  if (
    originalRouteState.workspaceMode !== "queue" ||
    !originalRouteState.changeId ||
    originalRouteState.changeId === normalizedRouteState.changeId
  ) {
    return null;
  }

  const visibleChanges = filterChanges(queueChanges, {
    activeViewId: normalizedRouteState.viewId,
    activeFilterId: normalizedRouteState.filterId,
    searchQuery: normalizedRouteState.searchQuery,
  });

  if (visibleChanges.length === 0) {
    return `Selected change ${originalRouteState.changeId} was cleared because this queue slice is empty.`;
  }

  if (normalizedRouteState.changeId) {
    return `Selected change ${originalRouteState.changeId} was repaired to ${normalizedRouteState.changeId} because the original selection is not available in the current queue slice.`;
  }

  return `Selected change ${originalRouteState.changeId} was cleared because it is not available in the current queue slice.`;
}

function areRouteStatesEqual(
  currentRouteState: FunctionalShellRouteState,
  nextRouteState: FunctionalShellRouteState,
) {
  return (
    currentRouteState.workspaceMode === nextRouteState.workspaceMode &&
    currentRouteState.tenantId === nextRouteState.tenantId &&
    currentRouteState.viewId === nextRouteState.viewId &&
    currentRouteState.filterId === nextRouteState.filterId &&
    currentRouteState.searchQuery === nextRouteState.searchQuery &&
    currentRouteState.changeId === nextRouteState.changeId
  );
}

type NormalizedShellLocation = {
  routeState: FunctionalShellRouteState;
  href: string;
  shouldReplace: boolean;
  hasExplicitCatalogSelection: boolean;
};
