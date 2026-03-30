import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import {
  answerClarificationRound,
  blockChangeBySpec,
  createChange,
  createClarificationRound,
  decideApproval,
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
  readOperatorRouteState,
  type OperatorRouteState,
} from "../navigation";
import { useTenantRealtimeBoundary } from "../realtime";
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

export function useOperatorServerState(): OperatorServerStateResult {
  const [initialRouteState] = useState(() => readOperatorRouteState(window.location.search));
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [changes, setChanges] = useState<BootstrapResponse["changes"]>([]);
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
  const historyModeRef = useRef<"push" | "replace">("replace");
  const historyInitializedRef = useRef(false);
  const shouldAutoSelectChange = !window.matchMedia("(max-width: 1080px)").matches;

  function selectChange(changeId: string | null) {
    selectedChangeRef.current = changeId;
    setSelectedChangeId(changeId);
    if (!changeId) {
      setDetail(null);
      setSelectedRunId(null);
    }
  }

  function applyDetailPayload(payload: ChangeDetailResponse, preferredRunId?: string | null) {
    setDetail(payload);
    setSelectedRunId((current) => {
      const requestedRunId = preferredRunId ?? current;
      if (requestedRunId && payload.runs.some((run) => run.id === requestedRunId)) {
        return requestedRunId;
      }
      return payload.runs[0]?.id ?? null;
    });
  }

  async function refreshRunDetail(tenantId: string, runId: string) {
    const runCacheKey = buildRunCacheKey(tenantId, runId);
    const payload = await fetchRunDetail(tenantId, runId);
    setRunApprovals((current) => ({
      ...current,
      [runCacheKey]: payload.approvals,
    }));
    setRunEvents((current) => ({
      ...current,
      [runCacheKey]: payload.events,
    }));
  }

  async function refreshCurrentChange(changeId: string) {
    if (!activeTenantId) {
      return;
    }
    const [changesPayload, detailPayload] = await Promise.all([
      fetchChanges(activeTenantId),
      fetchChangeDetail(activeTenantId, changeId),
    ]);
    setChanges(changesPayload.changes);
    applyDetailPayload(detailPayload);
  }

  const applyNavigationState = useEffectEvent(async (routeState: OperatorRouteState) => {
    if (!bootstrap) {
      return;
    }

    const nextTenantId = resolveTenantId(bootstrap, routeState.tenantId ?? activeTenantRef.current ?? bootstrap.activeTenantId);
    const nextViewId = resolveViewId(bootstrap, routeState.viewId ?? DEFAULT_OPERATOR_VIEW_ID, DEFAULT_OPERATOR_VIEW_ID);
    const nextFilterId = routeState.filterId ?? DEFAULT_OPERATOR_FILTER_ID;
    const nextSearchQuery = routeState.searchQuery ?? "";
    const queueSnapshot = (await fetchChanges(nextTenantId)).changes;
    const nextSelectedChangeId = resolveVisibleChangeSelection(
      queueSnapshot,
      {
        activeViewId: nextViewId,
        activeFilterId: nextFilterId,
        searchQuery: nextSearchQuery,
      },
      routeState.changeId,
      shouldAutoSelectChange,
    );

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
    if (activeTenantRef.current !== nextTenantId || selectedChangeRef.current !== nextSelectedChangeId) {
      return;
    }
    applyDetailPayload(detailPayload, routeState.runId ?? null);
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
    if (selectedChangeId && filteredChanges.some((change) => change.id === selectedChangeId)) {
      return selectedChangeId;
    }
    if (!shouldAutoSelectChange) {
      return null;
    }
    return filteredChanges[0]?.id ?? null;
  }, [filteredChanges, selectedChangeId, shouldAutoSelectChange]);

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

        setBootstrap(payload);
        setActiveTenantId(initialTenantId);
        activeTenantRef.current = initialTenantId;
        setChanges(initialChanges);
        selectChange(
          resolveVisibleChangeSelection(
            initialChanges,
            {
              activeViewId: initialViewId,
              activeFilterId: initialFilterId,
              searchQuery: initialSearchQuery,
            },
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
      .catch((reason: Error) => setError(reason.message));
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

    const targetTenantId = activeTenantId;
    const targetChangeId = activeSelectedChangeId;
    void fetchChangeDetail(activeTenantId, activeSelectedChangeId)
      .then((payload) => {
        if (activeTenantRef.current !== targetTenantId || selectedChangeRef.current !== targetChangeId) {
          return;
        }
        applyDetailPayload(payload);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [activeSelectedChangeId, activeTenantId]);

  useEffect(() => {
    if (!bootstrap || !activeTenantId) {
      return;
    }

    const nextHref = buildOperatorRouteHref(window.location.pathname, {
      tenantId: activeTenantId,
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
  }, [activeFilterId, activeSelectedChangeId, activeSelectedRunId, activeTabId, activeTenantId, activeViewId, bootstrap, searchQuery]);

  useTenantRealtimeBoundary({
    tenantId: activeTenantId,
    onTenantEvent: async () => {
      if (!activeTenantId) {
        return;
      }

      const queuePayload = await fetchChanges(activeTenantId);
      setRealtimeNotice(null);
      setChanges(queuePayload.changes);

      if (!activeSelectedChangeId) {
        return;
      }

      const targetTenantId = activeTenantId;
      const targetChangeId = activeSelectedChangeId;
      const detailPayload = await fetchChangeDetail(activeTenantId, activeSelectedChangeId);
      if (activeTenantRef.current !== targetTenantId || selectedChangeRef.current !== targetChangeId) {
        return;
      }

      const preferredRunId = detailPayload.runs.some((run) => run.id === activeSelectedRunId)
        ? activeSelectedRunId
        : detailPayload.runs[0]?.id ?? null;
      applyDetailPayload(detailPayload, preferredRunId);
      if (preferredRunId) {
        await refreshRunDetail(activeTenantId, preferredRunId);
      }
    },
    onRealtimeError: (message) => setRealtimeNotice(message),
  });

  useEffect(() => {
    if (!activeTenantId || !activeSelectedRunId) {
      return;
    }

    let cancelled = false;
    void fetchRunDetail(activeTenantId, activeSelectedRunId)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        const runCacheKey = buildRunCacheKey(activeTenantId, activeSelectedRunId);
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
        if (!cancelled) {
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

  async function handleRunNext() {
    if (!activeTenantId || !activeSelectedChangeId) {
      setToast("Select a change before running the next backend-owned step.");
      return;
    }
    const payload = await runNext(activeTenantId, activeSelectedChangeId);
    const runCacheKey = buildRunCacheKey(activeTenantId, payload.run.id);
    setRunApprovals((current) => ({
      ...current,
      [runCacheKey]: payload.approvals,
    }));
    setRunEvents((current) => ({
      ...current,
      [runCacheKey]: payload.events,
    }));
    await refreshCurrentChange(activeSelectedChangeId);
    historyModeRef.current = "replace";
    setSelectedRunId(payload.run.id);
    setToast(`Run ${payload.run.id} started.`);
  }

  function handleOpenRunStudio() {
    if (activeDetail?.runs.length) {
      const preferredRunId =
        activeSelectedRunId && activeDetail.runs.some((run) => run.id === activeSelectedRunId)
          ? activeSelectedRunId
          : activeDetail.runs[0].id;
      historyModeRef.current = "replace";
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
    const payload = await createChange(activeTenantId);
    const changesPayload = await fetchChanges(activeTenantId);
    setChanges(changesPayload.changes);
    historyModeRef.current = "push";
    selectChange(payload.change.id);
    const detailPayload = await fetchChangeDetail(activeTenantId, payload.change.id);
    applyDetailPayload(detailPayload);
    setToast(`Created ${payload.change.id}.`);
  }

  async function handleEscalate() {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    await escalateChange(activeTenantId, activeSelectedChangeId);
    await refreshCurrentChange(activeSelectedChangeId);
    setToast(`Escalated ${activeSelectedChangeId}.`);
  }

  async function handleBlockBySpec() {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    await blockChangeBySpec(activeTenantId, activeSelectedChangeId);
    await refreshCurrentChange(activeSelectedChangeId);
    setToast(`Blocked ${activeSelectedChangeId} by spec.`);
  }

  async function handleCreateClarificationRound() {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    await createClarificationRound(activeTenantId, activeSelectedChangeId);
    await refreshCurrentChange(activeSelectedChangeId);
  }

  async function handleAnswerClarificationRound(roundId: string, answers: ClarificationAnswer[]) {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    await answerClarificationRound(activeTenantId, roundId, answers);
    await refreshCurrentChange(activeSelectedChangeId);
  }

  async function handlePromoteFact(title: string, body: string) {
    if (!activeTenantId || !activeSelectedChangeId) {
      return;
    }
    await promoteFact(activeTenantId, activeSelectedChangeId, title, body);
    await refreshCurrentChange(activeSelectedChangeId);
  }

  async function handleApprovalDecision(approvalId: string, decision: "accept" | "decline") {
    if (!activeTenantId || !activeSelectedRunId) {
      return;
    }
    const payload = await decideApproval(activeTenantId, approvalId, decision);
    const runCacheKey = buildRunCacheKey(activeTenantId, activeSelectedRunId);
    setRunApprovals((current) => ({
      ...current,
      [runCacheKey]: (current[runCacheKey] ?? []).map((approval) =>
        approval.id === approvalId ? payload.approval : approval,
      ),
    }));
    await refreshRunDetail(activeTenantId, activeSelectedRunId);
    setToast(`${decision === "accept" ? "Accepted" : "Declined"} ${approvalId}.`);
  }

  async function handleTenantChange(tenantId: string) {
    historyModeRef.current = "push";
    setRealtimeNotice(null);
    setActiveTenantId(tenantId);
    activeTenantRef.current = tenantId;
    setDetail(null);
    setSelectedRunId(null);
    const payload = await fetchChanges(tenantId);
    setChanges(payload.changes);
    selectChange(shouldAutoSelectChange ? payload.changes[0]?.id ?? null : null);
    setActiveViewId(DEFAULT_OPERATOR_VIEW_ID);
    setActiveFilterId(DEFAULT_OPERATOR_FILTER_ID);
    setSearchQuery("");
    setActiveTabId(DEFAULT_OPERATOR_TAB_ID);
  }

  function handleSearchQueryChange(value: string) {
    historyModeRef.current = "push";
    setSearchQuery(value);
  }

  function handleSelectView(viewId: string) {
    historyModeRef.current = "push";
    setActiveViewId(viewId);
  }

  function handleSelectFilter(filterId: string) {
    historyModeRef.current = "push";
    setActiveFilterId(filterId);
  }

  function handleSelectChange(changeId: string | null) {
    historyModeRef.current = "push";
    selectChange(changeId);
  }

  function handleClearSelection() {
    historyModeRef.current = "push";
    selectChange(null);
    setDetail(null);
  }

  function handleSelectRun(runId: string) {
    historyModeRef.current = "replace";
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
      activeTenantId: activeTenant.id,
      activeViewId,
      activeFilterId,
      activeViewCount: filteredChanges.length,
      activeTenantRepoPath: activeTenant.repoPath,
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
      onCreateChange: handleCreateChange,
      onRunNext: handleRunNext,
      onTenantChange: handleTenantChange,
      onSelectView: handleSelectView,
      onSelectFilter: handleSelectFilter,
      onSelectChange: handleSelectChange,
      onClearSelection: handleClearSelection,
      onOpenRunStudio: handleOpenRunStudio,
      onEscalate: handleEscalate,
      onBlockBySpec: handleBlockBySpec,
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
