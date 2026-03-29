import { useEffect, useMemo, useRef, useState } from "react";

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
} from "../navigation";
import { useTenantRealtimeBoundary } from "../realtime";
import type { OperatorWorkbenchProps } from "../workbench/OperatorWorkbench";
import { filterChanges, resolveChangeSelection, resolveTenantId, resolveViewId } from "./filtering";

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
  const [toast, setToast] = useState<string | null>(null);
  const activeTenantRef = useRef<string | null>(null);
  const selectedChangeRef = useRef<string | null>(null);
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
    const payload = await fetchRunDetail(tenantId, runId);
    setRunApprovals((current) => ({
      ...current,
      [runId]: payload.approvals,
    }));
    setRunEvents((current) => ({
      ...current,
      [runId]: payload.events,
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
    if (!selectedChangeId) {
      return null;
    }
    if (filteredChanges.some((change) => change.id === selectedChangeId)) {
      return selectedChangeId;
    }
    return filteredChanges[0]?.id ?? null;
  }, [filteredChanges, selectedChangeId]);

  const activeDetail = useMemo(() => {
    if (!activeSelectedChangeId) {
      return null;
    }
    return detail?.change.id === activeSelectedChangeId ? detail : null;
  }, [activeSelectedChangeId, detail]);

  const activeSelectedRunId = activeDetail ? selectedRunId : null;
  const selectedRunApprovals = activeSelectedRunId ? runApprovals[activeSelectedRunId] ?? [] : [];
  const selectedRunEvents = activeSelectedRunId ? runEvents[activeSelectedRunId] ?? [] : [];

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
        const initialChanges =
          initialTenantId === payload.activeTenantId ? payload.changes : (await fetchChanges(initialTenantId)).changes;

        setBootstrap(payload);
        setActiveTenantId(initialTenantId);
        activeTenantRef.current = initialTenantId;
        setChanges(initialChanges);
        selectChange(
          initialRouteState.changeId || shouldAutoSelectChange
            ? resolveChangeSelection(initialChanges, initialRouteState.changeId)
            : null,
        );
        setActiveViewId(initialViewId);
        setActiveFilterId(initialRouteState.filterId ?? DEFAULT_OPERATOR_FILTER_ID);
        setSearchQuery(initialRouteState.searchQuery ?? "");
        setActiveTabId(initialRouteState.tabId ?? DEFAULT_OPERATOR_TAB_ID);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [initialRouteState, shouldAutoSelectChange]);

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
      window.history.replaceState(window.history.state, "", nextHref);
    }
  }, [activeFilterId, activeSelectedChangeId, activeSelectedRunId, activeTabId, activeTenantId, activeViewId, bootstrap, searchQuery]);

  useTenantRealtimeBoundary({
    tenantId: activeTenantId,
    onTenantEvent: async () => {
      if (!activeTenantId) {
        return;
      }

      const queuePayload = await fetchChanges(activeTenantId);
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
    onRealtimeError: (message) => setError(message),
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
        setRunApprovals((current) => ({
          ...current,
          [activeSelectedRunId]: payload.approvals,
        }));
        setRunEvents((current) => ({
          ...current,
          [activeSelectedRunId]: payload.events,
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
      return;
    }
    const payload = await runNext(activeTenantId, activeSelectedChangeId);
    setRunApprovals((current) => ({
      ...current,
      [payload.run.id]: payload.approvals,
    }));
    setRunEvents((current) => ({
      ...current,
      [payload.run.id]: payload.events,
    }));
    await refreshCurrentChange(activeSelectedChangeId);
    setSelectedRunId(payload.run.id);
    setToast(`Run ${payload.run.id} started.`);
  }

  function handleOpenRunStudio() {
    if (activeDetail?.runs.length) {
      setSelectedRunId(activeDetail.runs[0].id);
      window.requestAnimationFrame(() => {
        document.getElementById("run-studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  async function handleCreateChange() {
    if (!activeTenantId) {
      return;
    }
    const payload = await createChange(activeTenantId);
    const changesPayload = await fetchChanges(activeTenantId);
    setChanges(changesPayload.changes);
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
    setRunApprovals((current) => ({
      ...current,
      [activeSelectedRunId]: (current[activeSelectedRunId] ?? []).map((approval) =>
        approval.id === approvalId ? payload.approval : approval,
      ),
    }));
    await refreshRunDetail(activeTenantId, activeSelectedRunId);
    setToast(`${decision === "accept" ? "Accepted" : "Declined"} ${approvalId}.`);
  }

  async function handleTenantChange(tenantId: string) {
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
      toast,
      onSearchQueryChange: setSearchQuery,
      onCreateChange: handleCreateChange,
      onRunNext: handleRunNext,
      onTenantChange: handleTenantChange,
      onSelectView: setActiveViewId,
      onSelectFilter: setActiveFilterId,
      onSelectChange: selectChange,
      onClearSelection: () => {
        selectChange(null);
        setDetail(null);
      },
      onOpenRunStudio: handleOpenRunStudio,
      onEscalate: handleEscalate,
      onBlockBySpec: handleBlockBySpec,
      onCreateClarificationRound: handleCreateClarificationRound,
      onAnswerClarificationRound: handleAnswerClarificationRound,
      onSelectRun: setSelectedRunId,
      onSelectTab: setActiveTabId,
      onPromoteFact: handlePromoteFact,
      onApprovalDecision: handleApprovalDecision,
    },
  };
}
