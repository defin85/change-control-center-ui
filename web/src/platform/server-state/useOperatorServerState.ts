import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import {
  answerClarificationRound,
  blockChangeBySpec,
  createChange,
  createClarificationRound,
  createTenant,
  decideApproval,
  deleteChange,
  escalateChange,
  fetchBootstrap,
  fetchChangeDetail,
  fetchChanges,
  fetchRunDetail,
  promoteFact,
  runNext,
} from "../../api";
import type {
  ApprovalRecord,
  BootstrapResponse,
  ChangeDetailResponse,
  ChangeDetailTabId,
  ClarificationAnswer,
  RuntimeEvent,
} from "../../types";
import {
  buildOperatorRouteHref,
  DEFAULT_OPERATOR_FILTER_ID,
  DEFAULT_OPERATOR_TAB_ID,
  DEFAULT_OPERATOR_VIEW_ID,
  DEFAULT_OPERATOR_WORKSPACE_MODE,
  readOperatorRouteState,
  type OperatorRouteState,
  type OperatorWorkspaceMode,
} from "../navigation";
import { ControlApiError } from "../contracts";
import { useTenantRealtimeBoundary, type TenantRealtimeEvent } from "../realtime";
import type { OperatorWorkbenchProps } from "../workbench/OperatorWorkbench";
import { filterChanges, resolveTenantId, resolveViewId, resolveVisibleChangeSelection } from "./filtering";

type OperatorServerStateResult =
  | {
      state: "loading";
      message: string;
    }
  | {
      state: "error";
      message: string;
    }
  | {
      state: "ready";
      workbenchProps: OperatorWorkbenchProps;
    };

const QUEUE_REFRESH_EVENT_TYPES = new Set([
  "change-created",
  "change-deleted",
  "change-escalated",
  "change-blocked-by-spec",
  "clarification-created",
  "clarification-answered",
  "fact-promoted",
  "run-created",
  "run-updated",
  "run-completed",
]);

const CHANGE_REFRESH_EVENT_TYPES = new Set([
  "change-deleted",
  "change-escalated",
  "change-blocked-by-spec",
  "clarification-created",
  "clarification-answered",
  "fact-promoted",
  "run-created",
  "run-updated",
  "run-completed",
]);

const RUN_REFRESH_EVENT_TYPES = new Set([
  "approval-decided",
  "run-created",
  "run-updated",
  "run-completed",
]);

type RefreshCurrentChangeFailureMode = "global" | "throw";
type RefreshCurrentChangeOptions = {
  preferredRunId?: string | null;
  onFailure?: RefreshCurrentChangeFailureMode;
  missingSelectionToast?: string | null;
};

export function useOperatorServerState(): OperatorServerStateResult {
  const [initialRouteState] = useState(() => readOperatorRouteState(window.location.search));
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [changes, setChanges] = useState<BootstrapResponse["changes"]>([]);
  const [hasExplicitCatalogSelection, setHasExplicitCatalogSelection] = useState(
    () => initialRouteState.workspaceMode === "catalog" && Boolean(initialRouteState.tenantId),
  );
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<OperatorWorkspaceMode>(
    initialRouteState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE,
  );
  const [activeTenantId, setActiveTenantId] = useState<string | null>(initialRouteState.tenantId ?? null);
  const [activeViewId, setActiveViewId] = useState(initialRouteState.viewId ?? DEFAULT_OPERATOR_VIEW_ID);
  const [activeFilterId, setActiveFilterId] = useState(initialRouteState.filterId ?? DEFAULT_OPERATOR_FILTER_ID);
  const [searchQuery, setSearchQuery] = useState(initialRouteState.searchQuery ?? "");
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(initialRouteState.changeId ?? null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRouteState.runId ?? null);
  const [activeTabId, setActiveTabId] = useState<ChangeDetailTabId>(initialRouteState.tabId ?? DEFAULT_OPERATOR_TAB_ID);
  const [detail, setDetail] = useState<ChangeDetailResponse | null>(null);
  const [runApprovals, setRunApprovals] = useState<Record<string, ApprovalRecord[]>>({});
  const [runEvents, setRunEvents] = useState<Record<string, RuntimeEvent[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const activeTenantRef = useRef<string | null>(null);
  const selectedChangeRef = useRef<string | null>(null);
  const selectedRunRef = useRef<string | null>(null);
  const historyModeRef = useRef<"push" | "replace">("replace");
  const historyInitializedRef = useRef(false);
  const orchestrationVersionRef = useRef(0);
  const runRequestVersionRef = useRef(0);
  const isCompactViewport = window.matchMedia("(max-width: 1080px)").matches;
  const shouldAutoSelectChange = !isCompactViewport;

  function beginOrchestration() {
    orchestrationVersionRef.current += 1;
    return orchestrationVersionRef.current;
  }

  function beginRunRequest() {
    runRequestVersionRef.current += 1;
    return runRequestVersionRef.current;
  }

  function isActiveOrchestration(version: number, tenantId: string, changeId?: string | null) {
    return (
      orchestrationVersionRef.current === version &&
      activeTenantRef.current === tenantId &&
      (changeId === undefined || selectedChangeRef.current === changeId)
    );
  }

  function isActiveTenantOrchestration(version: number, tenantId: string) {
    return orchestrationVersionRef.current === version && activeTenantRef.current === tenantId;
  }

  function resolveOperatorError(reason: unknown) {
    if (reason instanceof Error && reason.message) {
      return reason.message;
    }

    return "Operator shell request failed.";
  }

  function isMissingSelectedChange(reason: unknown) {
    return reason instanceof ControlApiError && reason.kind === "http" && reason.status === 404;
  }

  function selectionContext(
    workspaceMode: OperatorWorkspaceMode,
    viewId: string,
    filterId: string,
    currentSearchQuery: string,
  ) {
    return {
      activeViewId: viewId,
      activeFilterId: filterId,
      searchQuery: workspaceMode === "catalog" ? "" : currentSearchQuery,
    };
  }

  async function refreshBootstrapSnapshot(targetTenantId?: string) {
    const payload = await fetchBootstrap();
    if (targetTenantId && activeTenantRef.current !== targetTenantId) {
      return;
    }
    setBootstrap(payload);
  }

  function selectChange(changeId: string | null) {
    beginRunRequest();
    selectedChangeRef.current = changeId;
    selectedRunRef.current = null;
    setSelectedChangeId(changeId);
    setSelectedRunId(null);
    setDetail((current) => (changeId && current?.change.id === changeId ? current : null));
  }

  function applyDetailPayload(payload: ChangeDetailResponse, preferredRunId?: string | null) {
    setDetail(payload);
    beginRunRequest();
    setSelectedRunId((current) => {
      const requestedRunId = preferredRunId ?? current;
      if (requestedRunId && payload.runs.some((run) => run.id === requestedRunId)) {
        selectedRunRef.current = requestedRunId;
        return requestedRunId;
      }
      const fallbackRunId = payload.runs[0]?.id ?? null;
      selectedRunRef.current = fallbackRunId;
      return fallbackRunId;
    });
  }

  async function refreshRunDetail(tenantId: string, runId: string) {
    const runCacheKey = buildRunCacheKey(tenantId, runId);
    const requestVersion = beginRunRequest();
    const payload = await fetchRunDetail(tenantId, runId);
    if (runRequestVersionRef.current !== requestVersion || activeTenantRef.current !== tenantId || selectedRunRef.current !== runId) {
      return;
    }
    setRunApprovals((current) => ({
      ...current,
      [runCacheKey]: payload.approvals,
    }));
    setRunEvents((current) => ({
      ...current,
      [runCacheKey]: payload.events,
    }));
  }

  async function refreshCurrentChange(
    tenantId: string,
    changeId: string,
    options?: RefreshCurrentChangeOptions,
  ) {
    const flowVersion = beginOrchestration();
    const preferredRunId = options?.preferredRunId;
    const onFailure = options?.onFailure ?? "global";
    const missingSelectionToast =
      options?.missingSelectionToast === undefined
        ? `Selected change ${changeId} is no longer visible in the active queue context.`
        : options.missingSelectionToast;
    let queueSnapshot: BootstrapResponse["changes"] | null = null;

    try {
      const changesPayload = await fetchChanges(tenantId);
      queueSnapshot = changesPayload.changes;
      if (!isActiveTenantOrchestration(flowVersion, tenantId)) {
        return;
      }

      setChanges(queueSnapshot);
      const nextSelectedChangeId = resolveVisibleChangeSelection(
        queueSnapshot,
        selectionContext(activeWorkspaceMode, activeViewId, activeFilterId, searchQuery),
        changeId,
        shouldAutoSelectChange,
      );
      if (nextSelectedChangeId !== changeId) {
        selectChange(nextSelectedChangeId);
        if (missingSelectionToast) {
          setToast(missingSelectionToast);
        }
        return;
      }

      const detailPayload = await fetchChangeDetail(tenantId, changeId);
      if (!isActiveOrchestration(flowVersion, tenantId, changeId)) {
        return;
      }
      applyDetailPayload(detailPayload, preferredRunId ?? null);
    } catch (reason) {
      if (!isActiveTenantOrchestration(flowVersion, tenantId)) {
        return;
      }
      if (isMissingSelectedChange(reason)) {
        const fallbackChangeId = queueSnapshot
          ? resolveVisibleChangeSelection(
              queueSnapshot,
              selectionContext(activeWorkspaceMode, activeViewId, activeFilterId, searchQuery),
              null,
              shouldAutoSelectChange,
            )
          : null;
        selectChange(fallbackChangeId);
        if (missingSelectionToast) {
          setToast(missingSelectionToast);
        }
        return;
      }
      if (onFailure === "throw") {
        throw reason instanceof Error ? reason : new Error(resolveOperatorError(reason));
      }
      setError(resolveOperatorError(reason));
    }
  }

  const selectChangeEvent = useEffectEvent(selectChange);
  const applyDetailPayloadEvent = useEffectEvent(applyDetailPayload);

  const applyNavigationState = useEffectEvent(async (routeState: OperatorRouteState) => {
    if (!bootstrap) {
      return;
    }
    const flowVersion = beginOrchestration();

    try {
      const nextTenantId = resolveTenantId(bootstrap, routeState.tenantId ?? activeTenantRef.current ?? bootstrap.activeTenantId);
      const nextWorkspaceMode = routeState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE;
      const nextViewId = resolveViewId(bootstrap, routeState.viewId ?? DEFAULT_OPERATOR_VIEW_ID, DEFAULT_OPERATOR_VIEW_ID);
      const nextFilterId = routeState.filterId ?? DEFAULT_OPERATOR_FILTER_ID;
      const nextSearchQuery = routeState.searchQuery ?? "";
      const queueSnapshot = (await fetchChanges(nextTenantId)).changes;
      if (orchestrationVersionRef.current !== flowVersion) {
        return;
      }
      const nextSelectedChangeId = resolveVisibleChangeSelection(
        queueSnapshot,
        selectionContext(nextWorkspaceMode, nextViewId, nextFilterId, nextSearchQuery),
        routeState.changeId,
        shouldAutoSelectChange,
      );

      setActiveWorkspaceMode(nextWorkspaceMode);
      setHasExplicitCatalogSelection(nextWorkspaceMode === "catalog" && Boolean(routeState.tenantId));
      setActiveTenantId(nextTenantId);
      activeTenantRef.current = nextTenantId;
      setChanges(queueSnapshot);
      setActiveViewId(nextViewId);
      setActiveFilterId(nextFilterId);
      setSearchQuery(nextSearchQuery);
      setActiveTabId(routeState.tabId ?? DEFAULT_OPERATOR_TAB_ID);
      selectChange(nextSelectedChangeId);

      if (!nextSelectedChangeId) {
        return;
      }

      const detailPayload = await fetchChangeDetail(nextTenantId, nextSelectedChangeId);
      if (!isActiveOrchestration(flowVersion, nextTenantId, nextSelectedChangeId)) {
        return;
      }
      applyDetailPayload(detailPayload, routeState.runId ?? null);
    } catch (reason) {
      if (orchestrationVersionRef.current !== flowVersion) {
        return;
      }
      if (routeState.changeId && isMissingSelectedChange(reason)) {
        selectChange(null);
        setToast(`Selected change ${routeState.changeId} is no longer available for this tenant.`);
        return;
      }
      setError(resolveOperatorError(reason));
    }
  });

  const activeTenant = useMemo(
    () => bootstrap?.tenants.find((tenant) => tenant.id === activeTenantId) ?? null,
    [bootstrap, activeTenantId],
  );

  const filteredChanges = useMemo(
    () =>
      filterChanges(changes, {
        activeViewId,
        activeFilterId,
        searchQuery,
      }),
    [activeFilterId, activeViewId, changes, searchQuery],
  );

  const activeSelectedChangeId = useMemo(() => {
    const visibleChanges = filterChanges(
      changes,
      selectionContext(activeWorkspaceMode, activeViewId, activeFilterId, searchQuery),
    );

    if (selectedChangeId && visibleChanges.some((change) => change.id === selectedChangeId)) {
      return selectedChangeId;
    }
    if (!shouldAutoSelectChange) {
      return null;
    }
    return visibleChanges[0]?.id ?? null;
  }, [activeFilterId, activeViewId, activeWorkspaceMode, changes, searchQuery, selectedChangeId, shouldAutoSelectChange]);

  const activeDetail = useMemo(() => {
    if (!activeSelectedChangeId) {
      return null;
    }
    return detail?.change.id === activeSelectedChangeId ? detail : null;
  }, [activeSelectedChangeId, detail]);

  const activeSelectedRunId = activeDetail ? selectedRunId : null;
  const selectedRunCacheKey = activeTenantId && activeSelectedRunId ? buildRunCacheKey(activeTenantId, activeSelectedRunId) : null;
  const selectedRunApprovals = selectedRunCacheKey ? runApprovals[selectedRunCacheKey] ?? [] : [];
  const selectedRunEvents = selectedRunCacheKey ? runEvents[selectedRunCacheKey] ?? [] : [];

  useEffect(() => {
    activeTenantRef.current = activeTenantId;
  }, [activeTenantId]);

  useEffect(() => {
    selectedChangeRef.current = activeSelectedChangeId;
  }, [activeSelectedChangeId]);

  useEffect(() => {
    selectedRunRef.current = activeSelectedRunId;
  }, [activeSelectedRunId]);

  useEffect(() => {
    const flowVersion = beginOrchestration();
    void fetchBootstrap()
      .then(async (payload) => {
        const initialTenantId = resolveTenantId(payload, initialRouteState.tenantId);
        const initialViewId = resolveViewId(
          payload,
          initialRouteState.viewId ?? DEFAULT_OPERATOR_VIEW_ID,
          DEFAULT_OPERATOR_VIEW_ID,
        );
        const initialFilterId = initialRouteState.filterId ?? DEFAULT_OPERATOR_FILTER_ID;
        const initialSearchQuery = initialRouteState.searchQuery ?? "";
        const initialChanges =
          initialTenantId === payload.activeTenantId ? payload.changes : (await fetchChanges(initialTenantId)).changes;
        if (orchestrationVersionRef.current !== flowVersion) {
          return;
        }

        setBootstrap(payload);
        setActiveWorkspaceMode(initialRouteState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE);
        setHasExplicitCatalogSelection(
          (initialRouteState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE) === "catalog" && Boolean(initialRouteState.tenantId),
        );
        setActiveTenantId(initialTenantId);
        activeTenantRef.current = initialTenantId;
        setChanges(initialChanges);
        selectChangeEvent(
          resolveVisibleChangeSelection(
            initialChanges,
            selectionContext(
              initialRouteState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE,
              initialViewId,
              initialFilterId,
              initialSearchQuery,
            ),
            initialRouteState.changeId,
            shouldAutoSelectChange,
          ),
        );
        setActiveViewId(initialViewId);
        setActiveFilterId(initialFilterId);
        setSearchQuery(initialSearchQuery);
        setActiveTabId(initialRouteState.tabId ?? DEFAULT_OPERATOR_TAB_ID);
        setRealtimeNotice(null);
      })
      .catch((reason: Error) => {
        if (orchestrationVersionRef.current === flowVersion) {
          setError(reason.message);
        }
      });
  }, [initialRouteState, shouldAutoSelectChange]);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    function handlePopState() {
      historyModeRef.current = "replace";
      void applyNavigationState(readOperatorRouteState(window.location.search)).catch((reason: Error) => setError(reason.message));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [bootstrap]);

  useEffect(() => {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }

    const flowVersion = beginOrchestration();
    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    const preferredRunId = readOperatorRouteState(window.location.search).runId ?? selectedRunRef.current;
    void fetchChangeDetail(activeTenantId, activeSelectedChangeId)
      .then((payload) => {
        if (!isActiveOrchestration(flowVersion, targetTenantId, targetChangeId)) {
          return;
        }
        applyDetailPayloadEvent(payload, preferredRunId);
      })
      .catch((reason: Error) => {
        if (!isActiveOrchestration(flowVersion, targetTenantId, targetChangeId)) {
          return;
        }
        if (isMissingSelectedChange(reason)) {
          selectChangeEvent(null);
          setToast(`Selected change ${targetChangeId} is no longer available for this tenant.`);
          return;
        }
        setError(reason.message);
      });
  }, [activeSelectedChangeId, activeTenantId]);

  useEffect(() => {
    if (!bootstrap || !activeTenantId) {
      return;
    }

    const nextHref = buildOperatorRouteHref(window.location.pathname, {
      workspaceMode: activeWorkspaceMode,
      tenantId:
        activeWorkspaceMode === "catalog" && isCompactViewport && !hasExplicitCatalogSelection ? undefined : activeTenantId,
      viewId: activeViewId,
      filterId: activeFilterId,
      searchQuery,
      changeId: activeSelectedChangeId ?? undefined,
      runId: activeSelectedRunId ?? undefined,
      tabId: activeTabId,
    });

    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (currentHref !== nextHref) {
      if (!historyInitializedRef.current || historyModeRef.current === "replace") {
        window.history.replaceState(window.history.state, "", nextHref);
      } else {
        window.history.pushState(window.history.state, "", nextHref);
      }
    }
    historyInitializedRef.current = true;
    historyModeRef.current = "replace";
  }, [
    activeFilterId,
    activeSelectedChangeId,
    activeSelectedRunId,
    activeTabId,
    activeTenantId,
    activeViewId,
    activeWorkspaceMode,
    bootstrap,
    hasExplicitCatalogSelection,
    isCompactViewport,
    searchQuery,
  ]);

  useTenantRealtimeBoundary({
    tenantId: activeTenantId,
    onTenantEvent: async (event) => {
      if (!activeTenantId) {
        return;
      }
      const targetTenantId = activeTenantId;
      const targetChangeId = activeSelectedChangeId;
      const targetRunId = activeSelectedRunId;

      const shouldRefreshQueue = shouldRefreshQueueForTenantEvent(event);
      const shouldRefreshSelectedChange = shouldRefreshSelectedChangeForTenantEvent(event, targetChangeId);
      const shouldRefreshSelectedRun = shouldRefreshSelectedRunForTenantEvent(event, targetRunId);

      if (!shouldRefreshQueue && !shouldRefreshSelectedChange && !shouldRefreshSelectedRun) {
        setRealtimeNotice(null);
        return;
      }

      try {
        if (shouldRefreshSelectedChange && targetChangeId) {
          await refreshCurrentChange(targetTenantId, targetChangeId, {
            preferredRunId: targetRunId ?? null,
            onFailure: "throw",
          });
          const nextRunId = selectedRunRef.current;
          if (shouldRefreshSelectedRun && nextRunId) {
            await refreshRunDetail(targetTenantId, nextRunId);
          }
        } else {
          if (shouldRefreshQueue) {
            const queuePayload = await fetchChanges(targetTenantId);
            if (activeTenantRef.current !== targetTenantId) {
              return;
            }
            setChanges(queuePayload.changes);
          }

          if (shouldRefreshSelectedRun && targetRunId) {
            await refreshRunDetail(targetTenantId, targetRunId);
          }
        }
        if (shouldRefreshQueue || shouldRefreshSelectedChange) {
          await refreshBootstrapSnapshot(targetTenantId);
        }
        setRealtimeNotice(null);
      } catch (reason) {
        if (activeTenantRef.current !== targetTenantId) {
          return;
        }
        throw reason;
      }
    },
    onRealtimeError: (message) => setRealtimeNotice(message),
  });

  useEffect(() => {
    if (!activeTenantId || !activeSelectedRunId) {
      return;
    }

    const targetTenantId = activeTenantId;
    const targetRunId = activeSelectedRunId;
    const requestVersion = beginRunRequest();
    const runCacheKey = buildRunCacheKey(targetTenantId, targetRunId);
    let cancelled = false;

    void fetchRunDetail(targetTenantId, targetRunId)
      .then((payload) => {
        if (
          cancelled ||
          runRequestVersionRef.current !== requestVersion ||
          activeTenantRef.current !== targetTenantId ||
          selectedRunRef.current !== targetRunId
        ) {
          return;
        }
        setRunApprovals((current) => ({
          ...current,
          [runCacheKey]: payload.approvals,
        }));
        setRunEvents((current) => ({
          ...current,
          [runCacheKey]: payload.events,
        }));
      })
      .catch((reason: Error) => {
        if (
          !cancelled &&
          runRequestVersionRef.current === requestVersion &&
          activeTenantRef.current === targetTenantId &&
          selectedRunRef.current === targetRunId
        ) {
          setError(reason.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeSelectedRunId, activeTenantId]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleRunNext(refreshFailureMode: RefreshCurrentChangeFailureMode) {
    if (!activeTenantId || !activeSelectedChangeId) {
      setToast("Select a change before running the next backend-owned step.");
      return;
    }
    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    const payload = await runNext(targetTenantId, targetChangeId);
    const runCacheKey = buildRunCacheKey(targetTenantId, payload.run.id);
    setRunApprovals((current) => ({
      ...current,
      [runCacheKey]: payload.approvals,
    }));
    setRunEvents((current) => ({
      ...current,
      [runCacheKey]: payload.events,
    }));
    setDetail((current) => {
      if (!current || current.change.id !== targetChangeId) {
        return current;
      }
      return {
        ...current,
        change: payload.change,
        runs: [payload.run, ...current.runs.filter((run) => run.id !== payload.run.id)],
      };
    });
    await refreshCurrentChange(targetTenantId, targetChangeId, {
      preferredRunId: payload.run.id,
      onFailure: refreshFailureMode,
    });
    await refreshBootstrapSnapshot(targetTenantId);
    historyModeRef.current = "replace";
    selectedRunRef.current = payload.run.id;
    setSelectedRunId(payload.run.id);
    setToast(`Run ${payload.run.id} started.`);
  }

  async function handleGlobalRunNext() {
    await handleRunNext("global");
  }

  async function handleDetailRunNext() {
    await handleRunNext("throw");
  }

  function handleOpenRunStudio() {
    if (activeDetail?.runs.length) {
      const preferredRunId =
        activeSelectedRunId && activeDetail.runs.some((run) => run.id === activeSelectedRunId)
          ? activeSelectedRunId
          : activeDetail.runs[0].id;
      beginRunRequest();
      historyModeRef.current = "replace";
      selectedRunRef.current = preferredRunId;
      setSelectedRunId(preferredRunId);
      window.requestAnimationFrame(() => {
        document.getElementById("run-studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      setToast("No backend-owned run is available yet. Start the next step before opening Run Studio.");
    }
  }

  async function handleCreateChange() {
    if (!activeTenantId) {
      return;
    }
    const targetTenantId = activeTenantId;
    const flowVersion = beginOrchestration();
    const payload = await createChange(targetTenantId);
    const [changesPayload, bootstrapPayload] = await Promise.all([
      fetchChanges(targetTenantId),
      fetchBootstrap(),
    ]);
    if (orchestrationVersionRef.current !== flowVersion || activeTenantRef.current !== targetTenantId) {
      return;
    }
    setBootstrap(bootstrapPayload);
    setChanges(changesPayload.changes);
    historyModeRef.current = "push";
    selectChange(payload.change.id);
    const detailPayload = await fetchChangeDetail(targetTenantId, payload.change.id);
    if (!isActiveOrchestration(flowVersion, targetTenantId, payload.change.id)) {
      return;
    }
    applyDetailPayload(detailPayload);
    setToast(`Created ${payload.change.id}.`);
  }

  async function handleCreateTenant(name: string, repoPath: string, description: string) {
    const flowVersion = beginOrchestration();
    historyModeRef.current = "push";
    setRealtimeNotice(null);
    setError(null);

    const payload = await createTenant(name, repoPath, description);
    const [bootstrapPayload, changesPayload] = await Promise.all([
      fetchBootstrap(),
      fetchChanges(payload.tenant.id),
    ]);
    if (orchestrationVersionRef.current !== flowVersion) {
      return;
    }

    setBootstrap(bootstrapPayload);
    setActiveWorkspaceMode("catalog");
    setHasExplicitCatalogSelection(true);
    setActiveTenantId(payload.tenant.id);
    activeTenantRef.current = payload.tenant.id;
    setChanges(changesPayload.changes);
    setActiveViewId(DEFAULT_OPERATOR_VIEW_ID);
    setActiveFilterId(DEFAULT_OPERATOR_FILTER_ID);
    setSearchQuery("");
    setActiveTabId(DEFAULT_OPERATOR_TAB_ID);
    selectChange(resolveVisibleChangeSelection(changesPayload.changes, {
      activeViewId: DEFAULT_OPERATOR_VIEW_ID,
      activeFilterId: DEFAULT_OPERATOR_FILTER_ID,
      searchQuery: "",
    }, null, shouldAutoSelectChange));
    setToast(`Created repository ${payload.tenant.name}.`);
  }

  async function handleEscalate() {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    await escalateChange(targetTenantId, targetChangeId);
    await refreshCurrentChange(targetTenantId, targetChangeId, { onFailure: "throw" });
    await refreshBootstrapSnapshot(targetTenantId);
    setToast(`Escalated ${targetChangeId}.`);
  }

  async function handleBlockBySpec() {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    await blockChangeBySpec(targetTenantId, targetChangeId);
    await refreshCurrentChange(targetTenantId, targetChangeId, { onFailure: "throw" });
    await refreshBootstrapSnapshot(targetTenantId);
    setToast(`Blocked ${targetChangeId} by spec.`);
  }

  async function handleDeleteChange() {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    await deleteChange(targetTenantId, targetChangeId);
    await refreshCurrentChange(targetTenantId, targetChangeId, {
      onFailure: "throw",
      missingSelectionToast: null,
    });
    await refreshBootstrapSnapshot(targetTenantId);
    setToast(`Deleted ${targetChangeId}.`);
  }

  async function handleCreateClarificationRound() {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    await createClarificationRound(targetTenantId, targetChangeId);
    await refreshCurrentChange(targetTenantId, targetChangeId, { onFailure: "throw" });
    await refreshBootstrapSnapshot(targetTenantId);
  }

  async function handleAnswerClarificationRound(roundId: string, answers: ClarificationAnswer[]) {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    await answerClarificationRound(targetTenantId, roundId, answers);
    await refreshCurrentChange(targetTenantId, targetChangeId, { onFailure: "throw" });
    await refreshBootstrapSnapshot(targetTenantId);
  }

  async function handlePromoteFact(title: string, body: string) {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    await promoteFact(targetTenantId, targetChangeId, title, body);
    await refreshCurrentChange(targetTenantId, targetChangeId, { onFailure: "throw" });
    await refreshBootstrapSnapshot(targetTenantId);
  }

  async function handleApprovalDecision(approvalId: string, decision: "accept" | "decline") {
    if (!activeTenantId || !activeSelectedRunId) {
      return;
    }
    const targetTenantId = activeTenantId;
    const targetRunId = activeSelectedRunId;
    const payload = await decideApproval(targetTenantId, approvalId, decision);
    const runCacheKey = buildRunCacheKey(targetTenantId, targetRunId);
    setRunApprovals((current) => ({
      ...current,
      [runCacheKey]: (current[runCacheKey] ?? []).map((approval) =>
        approval.id === approvalId ? payload.approval : approval,
      ),
    }));
    await refreshRunDetail(targetTenantId, targetRunId);
    setToast(`${decision === "accept" ? "Accepted" : "Declined"} ${approvalId}.`);
  }

  async function handleTenantChange(tenantId: string) {
    const flowVersion = beginOrchestration();
    historyModeRef.current = "push";
    setRealtimeNotice(null);
    setError(null);
    setChanges([]);
    setActiveViewId(DEFAULT_OPERATOR_VIEW_ID);
    setActiveFilterId(DEFAULT_OPERATOR_FILTER_ID);
    setSearchQuery("");
    setActiveTabId(DEFAULT_OPERATOR_TAB_ID);
    selectChange(null);
    setActiveTenantId(tenantId);
    activeTenantRef.current = tenantId;
    setHasExplicitCatalogSelection(activeWorkspaceMode === "catalog");
    const payload = await fetchChanges(tenantId);
    if (orchestrationVersionRef.current !== flowVersion || activeTenantRef.current !== tenantId) {
      return;
    }
    setChanges(payload.changes);
    selectChange(shouldAutoSelectChange ? payload.changes[0]?.id ?? null : null);
  }

  async function handleSelectCatalogTenant(tenantId: string) {
    const flowVersion = beginOrchestration();
    historyModeRef.current = "push";
    setRealtimeNotice(null);
    setError(null);
    const payload = await fetchChanges(tenantId);
    if (orchestrationVersionRef.current !== flowVersion) {
      return;
    }
    setActiveWorkspaceMode("catalog");
    setHasExplicitCatalogSelection(true);
    setActiveTenantId(tenantId);
    activeTenantRef.current = tenantId;
    setChanges(payload.changes);
    setActiveViewId(DEFAULT_OPERATOR_VIEW_ID);
    setActiveFilterId(DEFAULT_OPERATOR_FILTER_ID);
    setActiveTabId(DEFAULT_OPERATOR_TAB_ID);
    selectChange(shouldAutoSelectChange ? payload.changes[0]?.id ?? null : null);
  }

  function handleSearchQueryChange(value: string) {
    beginOrchestration();
    historyModeRef.current = "push";
    setSearchQuery(value);
  }

  function handleWorkspaceModeChange(workspaceMode: OperatorWorkspaceMode) {
    beginOrchestration();
    historyModeRef.current = "push";
    setActiveWorkspaceMode(workspaceMode);
    setHasExplicitCatalogSelection(false);
    setSearchQuery("");
  }

  function handleClearCatalogSelection() {
    beginOrchestration();
    historyModeRef.current = "push";
    setHasExplicitCatalogSelection(false);
  }

  function handleSelectView(viewId: string) {
    beginOrchestration();
    historyModeRef.current = "push";
    setActiveViewId(viewId);
  }

  function handleSelectFilter(filterId: string) {
    beginOrchestration();
    historyModeRef.current = "push";
    setActiveFilterId(filterId);
  }

  function handleSelectChange(changeId: string | null) {
    beginOrchestration();
    historyModeRef.current = "push";
    selectChange(changeId);
  }

  function handleClearSelection() {
    beginOrchestration();
    historyModeRef.current = "push";
    selectChange(null);
    setDetail(null);
  }

  function handleClearSelectedRun() {
    beginRunRequest();
    historyModeRef.current = "replace";
    selectedRunRef.current = null;
    setSelectedRunId(null);
  }

  function handleSelectRun(runId: string) {
    beginRunRequest();
    historyModeRef.current = "replace";
    selectedRunRef.current = runId;
    setSelectedRunId(runId);
  }

  function handleSelectTab(tabId: ChangeDetailTabId) {
    historyModeRef.current = "replace";
    setActiveTabId(tabId);
  }

  if (error) {
    return { state: "error", message: `Error: ${error}` };
  }

  if (!bootstrap || !activeTenant) {
    return { state: "loading", message: "Loading backend state..." };
  }

  return {
    state: "ready",
    workbenchProps: {
      bootstrap,
      activeWorkspaceMode,
      activeTenantId: activeTenant.id,
      hasExplicitCatalogSelection,
      activeViewId,
      activeFilterId,
      activeViewCount: filteredChanges.length,
      activeTenantRepoPath: activeTenant.repoPath,
      repositoryCatalog: bootstrap.repositoryCatalog,
      searchQuery,
      activeTabId,
      selectedChangeId: activeSelectedChangeId,
      selectedRunId: activeSelectedRunId,
      detail: activeDetail,
      changes,
      filteredChanges,
      selectedRunApprovals,
      selectedRunEvents,
      realtimeNotice,
      toast,
      onSearchQueryChange: handleSearchQueryChange,
      onWorkspaceModeChange: handleWorkspaceModeChange,
      onCreateTenant: handleCreateTenant,
      onCreateChange: handleCreateChange,
      onGlobalRunNext: handleGlobalRunNext,
      onRunNext: handleDetailRunNext,
      onTenantChange: handleTenantChange,
      onSelectCatalogTenant: handleSelectCatalogTenant,
      onClearCatalogSelection: handleClearCatalogSelection,
      onSelectView: handleSelectView,
      onSelectFilter: handleSelectFilter,
      onSelectChange: handleSelectChange,
      onClearSelection: handleClearSelection,
      onClearSelectedRun: handleClearSelectedRun,
      onOpenRunStudio: handleOpenRunStudio,
      onEscalate: handleEscalate,
      onBlockBySpec: handleBlockBySpec,
      onDeleteChange: handleDeleteChange,
      onCreateClarificationRound: handleCreateClarificationRound,
      onAnswerClarificationRound: handleAnswerClarificationRound,
      onSelectRun: handleSelectRun,
      onSelectTab: handleSelectTab,
      onPromoteFact: handlePromoteFact,
      onApprovalDecision: handleApprovalDecision,
    },
  };
}

function buildRunCacheKey(tenantId: string, runId: string) {
  return `${tenantId}:${runId}`;
}

function shouldRefreshQueueForTenantEvent(event: TenantRealtimeEvent) {
  return QUEUE_REFRESH_EVENT_TYPES.has(event.type);
}

function shouldRefreshSelectedChangeForTenantEvent(event: TenantRealtimeEvent, selectedChangeId: string | null) {
  return Boolean(selectedChangeId && CHANGE_REFRESH_EVENT_TYPES.has(event.type) && event.changeId === selectedChangeId);
}

function shouldRefreshSelectedRunForTenantEvent(event: TenantRealtimeEvent, selectedRunId: string | null) {
  return Boolean(selectedRunId && RUN_REFRESH_EVENT_TYPES.has(event.type) && event.runId === selectedRunId);
}
