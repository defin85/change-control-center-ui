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
  const initialRouteStateRef = useRef(readOperatorRouteState(window.location.search));
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [changes, setChanges] = useState<BootstrapResponse["changes"]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(initialRouteStateRef.current.tenantId ?? null);
  const [activeViewId, setActiveViewId] = useState(initialRouteStateRef.current.viewId ?? DEFAULT_OPERATOR_VIEW_ID);
  const [activeFilterId, setActiveFilterId] = useState(initialRouteStateRef.current.filterId ?? DEFAULT_OPERATOR_FILTER_ID);
  const [searchQuery, setSearchQuery] = useState(initialRouteStateRef.current.searchQuery ?? "");
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(initialRouteStateRef.current.changeId ?? null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRouteStateRef.current.runId ?? null);
  const [activeTabId, setActiveTabId] = useState<ChangeDetailTabId>(initialRouteStateRef.current.tabId ?? DEFAULT_OPERATOR_TAB_ID);
  const [detail, setDetail] = useState<ChangeDetailResponse | null>(null);
  const [runApprovals, setRunApprovals] = useState<Record<string, ApprovalRecord[]>>({});
  const [runEvents, setRunEvents] = useState<Record<string, RuntimeEvent[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const activeTenantRef = useRef<string | null>(null);
  const selectedChangeRef = useRef<string | null>(null);

  function selectChange(changeId: string | null) {
    selectedChangeRef.current = changeId;
    setSelectedChangeId(changeId);
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

  useEffect(() => {
    activeTenantRef.current = activeTenantId;
  }, [activeTenantId]);

  useEffect(() => {
    selectedChangeRef.current = selectedChangeId;
  }, [selectedChangeId]);

  useEffect(() => {
    void fetchBootstrap()
      .then(async (payload) => {
        const initialRoute = initialRouteStateRef.current;
        const initialTenantId = resolveTenantId(payload, initialRoute.tenantId);
        const initialViewId = resolveViewId(payload, initialRoute.viewId ?? DEFAULT_OPERATOR_VIEW_ID, DEFAULT_OPERATOR_VIEW_ID);
        const initialChanges =
          initialTenantId === payload.activeTenantId ? payload.changes : (await fetchChanges(initialTenantId)).changes;

        setBootstrap(payload);
        setActiveTenantId(initialTenantId);
        activeTenantRef.current = initialTenantId;
        setChanges(initialChanges);
        selectChange(resolveChangeSelection(initialChanges, initialRoute.changeId));
        setActiveViewId(initialViewId);
        setActiveFilterId(initialRoute.filterId ?? DEFAULT_OPERATOR_FILTER_ID);
        setSearchQuery(initialRoute.searchQuery ?? "");
        setActiveTabId(initialRoute.tabId ?? DEFAULT_OPERATOR_TAB_ID);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    if (!activeTenantId || !selectedChangeId) {
      return;
    }

    const targetTenantId = activeTenantId;
    const targetChangeId = selectedChangeId;
    void fetchChangeDetail(activeTenantId, selectedChangeId)
      .then((payload) => {
        if (activeTenantRef.current !== targetTenantId || selectedChangeRef.current !== targetChangeId) {
          return;
        }
        applyDetailPayload(payload);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [activeTenantId, selectedChangeId]);

  useEffect(() => {
    if (!selectedChangeId) {
      setDetail(null);
      setSelectedRunId(null);
    }
  }, [selectedChangeId]);

  useEffect(() => {
    if (!bootstrap || !activeTenantId) {
      return;
    }

    const nextHref = buildOperatorRouteHref(window.location.pathname, {
      tenantId: activeTenantId,
      viewId: activeViewId,
      filterId: activeFilterId,
      searchQuery,
      changeId: selectedChangeId ?? undefined,
      runId: selectedRunId ?? undefined,
      tabId: activeTabId,
    });

    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (currentHref !== nextHref) {
      window.history.replaceState(window.history.state, "", nextHref);
    }
  }, [bootstrap, activeFilterId, activeTabId, activeTenantId, activeViewId, searchQuery, selectedChangeId, selectedRunId]);

  useEffect(() => {
    if (!activeTenantId) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/tenants/${activeTenantId}/events`);

    socket.onopen = () => socket.send("subscribe");
    socket.onmessage = () => {
      void fetchChanges(activeTenantId).then((payload) => setChanges(payload.changes));
      if (selectedChangeId) {
        const targetTenantId = activeTenantId;
        const targetChangeId = selectedChangeId;
        void fetchChangeDetail(activeTenantId, selectedChangeId).then((payload) => {
          if (activeTenantRef.current !== targetTenantId || selectedChangeRef.current !== targetChangeId) {
            return;
          }
          const preferredRunId = payload.runs.some((run) => run.id === selectedRunId)
            ? selectedRunId
            : payload.runs[0]?.id ?? null;
          applyDetailPayload(payload, preferredRunId);
          if (preferredRunId) {
            void refreshRunDetail(activeTenantId, preferredRunId);
          }
        });
      }
    };

    return () => socket.close();
  }, [activeTenantId, selectedChangeId, selectedRunId]);

  useEffect(() => {
    if (!activeTenantId || !selectedRunId) {
      return;
    }

    void refreshRunDetail(activeTenantId, selectedRunId).catch((reason: Error) => setError(reason.message));
  }, [activeTenantId, selectedRunId]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

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

  useEffect(() => {
    if (!selectedChangeId) {
      return;
    }
    if (!filteredChanges.some((change) => change.id === selectedChangeId)) {
      selectChange(filteredChanges[0]?.id ?? null);
    }
  }, [filteredChanges, selectedChangeId]);

  const selectedRunApprovals = selectedRunId ? runApprovals[selectedRunId] ?? [] : [];
  const selectedRunEvents = selectedRunId ? runEvents[selectedRunId] ?? [] : [];

  async function handleRunNext() {
    if (!activeTenantId || !selectedChangeId) {
      return;
    }
    const payload = await runNext(activeTenantId, selectedChangeId);
    setRunApprovals((current) => ({
      ...current,
      [payload.run.id]: payload.approvals,
    }));
    setRunEvents((current) => ({
      ...current,
      [payload.run.id]: payload.events,
    }));
    await refreshCurrentChange(selectedChangeId);
    setSelectedRunId(payload.run.id);
    setToast(`Run ${payload.run.id} started.`);
  }

  function handleOpenRunStudio() {
    if (detail?.runs.length) {
      setSelectedRunId(detail.runs[0].id);
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
    if (!activeTenantId || !selectedChangeId) {
      return;
    }
    await escalateChange(activeTenantId, selectedChangeId);
    await refreshCurrentChange(selectedChangeId);
    setToast(`Escalated ${selectedChangeId}.`);
  }

  async function handleBlockBySpec() {
    if (!activeTenantId || !selectedChangeId) {
      return;
    }
    await blockChangeBySpec(activeTenantId, selectedChangeId);
    await refreshCurrentChange(selectedChangeId);
    setToast(`Blocked ${selectedChangeId} by spec.`);
  }

  async function handleCreateClarificationRound() {
    if (!activeTenantId || !selectedChangeId) {
      return;
    }
    await createClarificationRound(activeTenantId, selectedChangeId);
    await refreshCurrentChange(selectedChangeId);
  }

  async function handleAnswerClarificationRound(roundId: string, answers: ClarificationAnswer[]) {
    if (!activeTenantId || !selectedChangeId) {
      return;
    }
    await answerClarificationRound(activeTenantId, roundId, answers);
    await refreshCurrentChange(selectedChangeId);
  }

  async function handlePromoteFact(title: string, body: string) {
    if (!activeTenantId || !selectedChangeId) {
      return;
    }
    await promoteFact(activeTenantId, selectedChangeId, title, body);
    await refreshCurrentChange(selectedChangeId);
  }

  async function handleApprovalDecision(approvalId: string, decision: "accept" | "decline") {
    if (!activeTenantId || !selectedRunId) {
      return;
    }
    const payload = await decideApproval(activeTenantId, approvalId, decision);
    setRunApprovals((current) => ({
      ...current,
      [selectedRunId]: (current[selectedRunId] ?? []).map((approval) =>
        approval.id === approvalId ? payload.approval : approval,
      ),
    }));
    await refreshRunDetail(activeTenantId, selectedRunId);
    setToast(`${decision === "accept" ? "Accepted" : "Declined"} ${approvalId}.`);
  }

  async function handleTenantChange(tenantId: string) {
    setActiveTenantId(tenantId);
    activeTenantRef.current = tenantId;
    setDetail(null);
    setSelectedRunId(null);
    const payload = await fetchChanges(tenantId);
    setChanges(payload.changes);
    selectChange(payload.changes[0]?.id ?? null);
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
      selectedChangeId,
      selectedRunId,
      detail,
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
      onSavedFilters: () => setToast("Saved filters will be wired in a later delivery."),
      onExportReport: () => setToast("Export report is intentionally left as a shell action in this pass."),
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
