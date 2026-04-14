import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ApprovalRecord,
  BootstrapResponse,
  ChangeDetailResponse,
  ChangeDetailTabId,
  ClarificationAnswer,
  ChangeSummary,
  RepositoryCatalogEntry,
  RunDetailResponse,
  RunListEntry,
  RunListSlice,
  RuntimeEvent,
  Tenant,
} from "../../types";
import {
  approvalDecisionResponseSchema,
  bootstrapResponseSchema,
  changeDetailResponseSchema,
  changesResponseSchema,
  clarificationRoundResponseSchema,
  createChangeResponseSchema,
  createTenantResponseSchema,
  deleteChangeResponseSchema,
  promotedFactResponseSchema,
  requestControlApi,
  runDetailResponseSchema,
  runMutationResponseSchema,
  runsResponseSchema,
} from "../contracts";
import {
  buildViewCounts,
  filterChanges,
  filterRuns,
  OPERATOR_FILTERS,
  REPOSITORY_CATALOG_FILTERS,
  resolveTenantId,
  resolveViewId,
  resolveVisibleChangeSelection,
  resolveVisibleRunSelection,
} from "../server-state";
import {
  useTenantRealtimeBoundary,
  type TenantRealtimeEvent,
} from "../realtime";

import {
  buildOperatorRouteHref,
  DEFAULT_OPERATOR_FILTER_ID,
  DEFAULT_OPERATOR_RUN_SLICE,
  DEFAULT_OPERATOR_TAB_ID,
  DEFAULT_OPERATOR_VIEW_ID,
  DEFAULT_OPERATOR_WORKSPACE_MODE,
  readOperatorRouteState,
  type OperatorRunSlice,
  type OperatorWorkspaceMode,
} from "./operatorRouteState";

const BOOTSTRAP_ENDPOINT = "/api/bootstrap";
const TENANTS_ENDPOINT = "/api/tenants";
const SUPPORTED_QUEUE_DETAIL_TABS: Array<{ id: ChangeDetailTabId }> = [
  { id: "overview" },
  { id: "traceability" },
  { id: "gaps" },
  { id: "evidence" },
  { id: "git" },
  { id: "chief" },
  { id: "clarifications" },
];

export type FunctionalShellRouteState = {
  workspaceMode: OperatorWorkspaceMode;
  runSlice: OperatorRunSlice;
  tenantId: string;
  viewId: string;
  filterId: string;
  searchQuery: string;
  changeId: string | null;
  runId: string | null;
  tabId: ChangeDetailTabId;
};

export type QueueSelectionNotice = {
  kind: "cleared" | "repaired";
  message: string;
};

type QueueWorkspaceStateBase = {
  tenantId: string;
  activeViewId: string;
  activeFilterId: string;
  searchQuery: string;
  selectedChangeId: string | null;
  activeTabId: ChangeDetailTabId;
  selectionNotice: QueueSelectionNotice | null;
  detailStatus: "idle" | "loading" | "error" | "ready";
  detailError: string | null;
  detail: ChangeDetailResponse | null;
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

export type RunsSelectionNotice = {
  kind: "cleared";
  message: string;
};

type RunsWorkspaceStateBase = {
  tenantId: string;
  activeRunSlice: RunListSlice;
  searchQuery: string;
  selectedRunId: string | null;
  selectionNotice: RunsSelectionNotice | null;
  detailStatus: "idle" | "loading" | "error" | "ready";
  detailError: string | null;
  detail: RunDetailResponse | null;
};

export type RunsWorkspaceStateLoading = RunsWorkspaceStateBase & {
  status: "loading";
};

export type RunsWorkspaceStateError = RunsWorkspaceStateBase & {
  status: "error";
  error: string;
};

export type RunsWorkspaceStateReady = RunsWorkspaceStateBase & {
  status: "ready";
  runs: RunListEntry[];
  visibleRuns: RunListEntry[];
  selectedRun: RunListEntry | null;
  selectedRunApprovals: ApprovalRecord[];
  selectedRunEvents: RuntimeEvent[];
};

export type RunsWorkspaceState =
  | RunsWorkspaceStateLoading
  | RunsWorkspaceStateError
  | RunsWorkspaceStateReady;

export type ShellRealtimeBoundaryState = {
  status: "live" | "reconciling" | "degraded";
  notice: string | null;
  lastEventType: string | null;
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
  queueWorkspace: QueueWorkspaceState;
  runsWorkspace: RunsWorkspaceState;
  activeTenant: Tenant | null;
  activeRepositoryEntry: RepositoryCatalogEntry | null;
  hasExplicitCatalogSelection: boolean;
  realtimeBoundary: ShellRealtimeBoundaryState;
  toast: string | null;
  setWorkspaceMode: (workspaceMode: OperatorWorkspaceMode) => void;
  setTenantId: (tenantId: string) => void;
  setSearchQuery: (searchQuery: string) => void;
  setCatalogFilter: (filterId: string) => void;
  setRunSlice: (runSlice: OperatorRunSlice) => void;
  selectRun: (runId: string) => void;
  clearSelectedRun: () => void;
  openSelectedRunChange: () => void;
  retrySelectedRunDetail: () => void;
  decideSelectedRunApproval: (approvalId: string, decision: "accept" | "decline") => Promise<void>;
  deleteSelectedChange: () => Promise<void>;
  runSelectedChangeNextStep: () => Promise<void>;
  escalateSelectedChange: () => Promise<void>;
  blockSelectedChangeBySpec: () => Promise<void>;
  createSelectedChangeClarificationRound: () => Promise<void>;
  answerSelectedChangeClarificationRound: (
    roundId: string,
    answers: ClarificationAnswer[],
  ) => Promise<void>;
  promoteSelectedChangeFact: (title: string, body: string) => Promise<void>;
  setQueueView: (viewId: string) => void;
  setQueueFilter: (filterId: string) => void;
  setQueueTab: (tabId: ChangeDetailTabId) => void;
  selectQueueChange: (changeId: string) => void;
  clearQueueSelection: () => void;
  retrySelectedChangeDetail: () => void;
  selectCatalogTenant: (tenantId: string) => Promise<void>;
  clearCatalogSelection: () => void;
  createTenant: (name: string, repoPath: string, description: string) => Promise<void>;
  createChange: () => Promise<void>;
  retryRealtime: () => void;
  buildWorkspaceHref: (workspaceMode: OperatorWorkspaceMode) => string;
};

export type ShellBootstrapController =
  | ShellBootstrapControllerLoading
  | ShellBootstrapControllerError
  | ShellBootstrapControllerReady;

type QueueHydrationState =
  | { status: "idle" }
  | { status: "loading"; tenantId: string }
  | { status: "error"; tenantId: string; error: string; selectionNotice: QueueSelectionNotice | null }
  | { status: "ready"; tenantId: string; changes: ChangeSummary[]; selectionNotice: QueueSelectionNotice | null };

type ChangeDetailHydrationState =
  | { status: "idle" }
  | { status: "loading"; tenantId: string; changeId: string }
  | { status: "error"; tenantId: string; changeId: string; error: string }
  | { status: "ready"; tenantId: string; changeId: string; detail: ChangeDetailResponse };

type RunsHydrationState =
  | { status: "idle" }
  | { status: "loading"; tenantId: string; runSlice: RunListSlice }
  | {
      status: "error";
      tenantId: string;
      runSlice: RunListSlice;
      error: string;
      selectionNotice: RunsSelectionNotice | null;
    }
  | {
      status: "ready";
      tenantId: string;
      runSlice: RunListSlice;
      runs: RunListEntry[];
      selectionNotice: RunsSelectionNotice | null;
    };

type RunDetailHydrationState =
  | { status: "idle" }
  | { status: "loading"; tenantId: string; runId: string }
  | { status: "error"; tenantId: string; runId: string; error: string }
  | { status: "ready"; tenantId: string; runId: string; detail: RunDetailResponse };

const INITIAL_REALTIME_BOUNDARY_STATE: ShellRealtimeBoundaryState = {
  status: "live",
  notice: null,
  lastEventType: null,
};

export function useShellBootstrapController(): ShellBootstrapController {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [routeState, setRouteState] = useState<FunctionalShellRouteState | null>(null);
  const [queueHydration, setQueueHydration] = useState<QueueHydrationState>({ status: "idle" });
  const [changeDetailHydration, setChangeDetailHydration] = useState<ChangeDetailHydrationState>({ status: "idle" });
  const [runsHydration, setRunsHydration] = useState<RunsHydrationState>({ status: "idle" });
  const [runDetailHydration, setRunDetailHydration] = useState<RunDetailHydrationState>({ status: "idle" });
  const [changeDetailReloadCount, setChangeDetailReloadCount] = useState(0);
  const [runDetailReloadCount, setRunDetailReloadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [hasExplicitCatalogSelection, setHasExplicitCatalogSelection] = useState(false);
  const [realtimeBoundary, setRealtimeBoundary] = useState<ShellRealtimeBoundaryState>(
    INITIAL_REALTIME_BOUNDARY_STATE,
  );
  const [realtimeRetryCount, setRealtimeRetryCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const routeStateRef = useRef<FunctionalShellRouteState | null>(null);
  const changeDetailHydrationRef = useRef<ChangeDetailHydrationState>({ status: "idle" });
  const runDetailHydrationRef = useRef<RunDetailHydrationState>({ status: "idle" });
  const routeRevisionRef = useRef(0);
  const hasExplicitCatalogSelectionRef = useRef(false);
  const bootstrapRequestSequenceRef = useRef(0);
  const realtimeRefreshInFlightRef = useRef(false);
  const realtimeRefreshQueuedRef = useRef<TenantRealtimeEvent | null>(null);
  const toastRef = useRef<string | null>(null);
  const queueHydrationTenantId = routeState?.tenantId ?? null;
  const queueHydrationWorkspaceMode = routeState?.workspaceMode ?? null;
  const detailHydrationQueueChanges = queueHydration.status === "ready" ? queueHydration.changes : null;
  const detailHydrationQueueTenantId = queueHydration.status === "ready" ? queueHydration.tenantId : null;
  const detailHydrationTargetTenantId =
    routeState?.workspaceMode === "queue" && routeState.changeId ? routeState.tenantId : null;
  const detailHydrationTargetChangeId =
    routeState?.workspaceMode === "queue" ? routeState.changeId : null;
  const runsHydrationTenantId = routeState?.tenantId ?? null;
  const runsHydrationWorkspaceMode = routeState?.workspaceMode ?? null;
  const runsHydrationRunSlice = routeState?.runSlice ?? DEFAULT_OPERATOR_RUN_SLICE;
  const detailHydrationRuns = runsHydration.status === "ready" ? runsHydration.runs : null;
  const detailHydrationRunsTenantId = runsHydration.status === "ready" ? runsHydration.tenantId : null;
  const detailHydrationRunsRunSlice = runsHydration.status === "ready" ? runsHydration.runSlice : null;
  const runDetailTargetTenantId =
    routeState?.workspaceMode === "runs" && routeState.runId ? routeState.tenantId : null;
  const runDetailTargetRunId =
    routeState?.workspaceMode === "runs" ? routeState.runId : null;

  useEffect(() => {
    routeStateRef.current = routeState;
  }, [routeState]);

  useEffect(() => {
    hasExplicitCatalogSelectionRef.current = hasExplicitCatalogSelection;
  }, [hasExplicitCatalogSelection]);

  useEffect(() => {
    changeDetailHydrationRef.current = changeDetailHydration;
  }, [changeDetailHydration]);

  useEffect(() => {
    runDetailHydrationRef.current = runDetailHydration;
  }, [runDetailHydration]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const commitToast = useCallback((nextToast: string | null) => {
    toastRef.current = nextToast;
    setToast(nextToast);
  }, []);

  const commitRouteState = useCallback((nextRouteState: FunctionalShellRouteState | null) => {
    routeRevisionRef.current += 1;
    routeStateRef.current = nextRouteState;
    setRouteState(nextRouteState);
  }, []);

  const commitHydratedState = useCallback((
    payload: BootstrapResponse,
    normalized: NormalizedShellLocation,
    options?: {
      historyMode?: "push" | "replace";
      explicitCatalogSelection?: boolean;
      toast?: string | null;
      preserveToast?: boolean;
    },
  ) => {
    const historyMode = options?.historyMode ?? "replace";
    const explicitCatalogSelection =
      options?.explicitCatalogSelection ?? normalized.hasExplicitCatalogSelection;
    const nextToast = options?.preserveToast ? toastRef.current : (options?.toast ?? null);
    const currentHref = `${window.location.pathname}${window.location.search}`;

    if (currentHref !== normalized.href) {
      if (historyMode === "push") {
        window.history.pushState(window.history.state, "", normalized.href);
      } else {
        window.history.replaceState(window.history.state, "", normalized.href);
      }
    }

    setBootstrap(payload);
    commitRouteState(normalized.routeState);
    hasExplicitCatalogSelectionRef.current = explicitCatalogSelection;
    setHasExplicitCatalogSelection(explicitCatalogSelection);
    commitToast(nextToast);
    setError(null);
  }, [commitRouteState, commitToast]);

  const refreshBootstrap = async (options?: {
    historyMode?: "push" | "replace";
    nextRouteState?: Partial<FunctionalShellRouteState>;
    resolveNextRouteState?: () => Partial<FunctionalShellRouteState> | null;
    explicitCatalogSelection?: boolean;
    resolveExplicitCatalogSelection?: () => boolean;
    toast?: string | null;
    preserveToast?: boolean;
    allowOnRouteChange?: boolean;
  }) => {
    const requestSequence = bootstrapRequestSequenceRef.current + 1;
    bootstrapRequestSequenceRef.current = requestSequence;
    const startedRouteRevision = routeRevisionRef.current;
    const payload = await requestControlApi(BOOTSTRAP_ENDPOINT, bootstrapResponseSchema);

    if (requestSequence !== bootstrapRequestSequenceRef.current) {
      return false;
    }

    if (!options?.allowOnRouteChange && startedRouteRevision !== routeRevisionRef.current) {
      return false;
    }

    const nextRouteState = options?.resolveNextRouteState?.() ?? options?.nextRouteState;
    const normalized = nextRouteState
      ? normalizePreferredRoute(payload, window.location.pathname, nextRouteState)
      : normalizeLocation(payload, window.location.pathname, window.location.search);

    commitHydratedState(payload, normalized, {
      historyMode: options?.historyMode,
      explicitCatalogSelection:
        options?.resolveExplicitCatalogSelection?.() ?? options?.explicitCatalogSelection,
      toast: options?.toast,
      preserveToast: options?.preserveToast,
    });
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const requestSequence = bootstrapRequestSequenceRef.current + 1;
        bootstrapRequestSequenceRef.current = requestSequence;
        const payload = await requestControlApi(BOOTSTRAP_ENDPOINT, bootstrapResponseSchema);
        if (cancelled || requestSequence !== bootstrapRequestSequenceRef.current) {
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
  }, [commitHydratedState, reloadCount]);

  useEffect(() => {
    setRealtimeBoundary(INITIAL_REALTIME_BOUNDARY_STATE);
    setRealtimeRetryCount(0);
    realtimeRefreshInFlightRef.current = false;
    realtimeRefreshQueuedRef.current = null;
  }, [routeState?.tenantId]);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    const handlePopState = () => {
      const currentQueueChanges =
        queueHydration.status === "ready" && routeState?.tenantId === queueHydration.tenantId
          ? queueHydration.changes
          : undefined;
      const currentRuns =
        runsHydration.status === "ready" &&
        routeState?.tenantId === runsHydration.tenantId &&
        routeState?.runSlice === runsHydration.runSlice
          ? runsHydration.runs
          : undefined;
      const normalized = normalizeLocation(
        bootstrap,
        window.location.pathname,
        window.location.search,
        currentQueueChanges,
        currentRuns,
      );
      if (normalized.shouldReplace) {
        window.history.replaceState(window.history.state, "", normalized.href);
      }
      commitRouteState(normalized.routeState);
      hasExplicitCatalogSelectionRef.current = normalized.hasExplicitCatalogSelection;
      setHasExplicitCatalogSelection(normalized.hasExplicitCatalogSelection);
      commitToast(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [bootstrap, commitRouteState, commitToast, queueHydration, routeState?.tenantId, routeState?.runSlice, runsHydration]);

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
        const selectionNotice = resolveQueueSelectionNotice(
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
          commitRouteState(normalizedRouteState);
        }

        setQueueHydration({
          status: "ready",
          tenantId: queueTenantId,
          changes: response.changes,
          selectionNotice,
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
          selectionNotice: null,
        });
      }
    }

    void loadQueue();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, commitRouteState, queueHydrationTenantId, queueHydrationWorkspaceMode]);

  useEffect(() => {
    if (!bootstrap || !detailHydrationTargetTenantId || !detailHydrationTargetChangeId) {
      return;
    }

    if (queueHydration.status !== "ready" || detailHydrationQueueTenantId !== detailHydrationTargetTenantId) {
      return;
    }

    if (!detailHydrationQueueChanges?.some((change) => change.id === detailHydrationTargetChangeId)) {
      return;
    }

    const currentDetailHydration = changeDetailHydrationRef.current;
    const detailHydrationMatchesTarget =
      currentDetailHydration.status !== "idle" &&
      currentDetailHydration.status !== "loading" &&
      currentDetailHydration.tenantId === detailHydrationTargetTenantId &&
      currentDetailHydration.changeId === detailHydrationTargetChangeId;

    if (detailHydrationMatchesTarget) {
      return;
    }

    let cancelled = false;
    const tenantId = detailHydrationTargetTenantId;
    const activeChangeId = detailHydrationTargetChangeId;

    async function loadSelectedChangeDetail() {
      setChangeDetailHydration({ status: "loading", tenantId, changeId: activeChangeId });

      try {
        const response = await requestControlApi(
          `/api/tenants/${tenantId}/changes/${activeChangeId}`,
          changeDetailResponseSchema,
        );
        if (cancelled) {
          return;
        }

        setChangeDetailHydration({
          status: "ready",
          tenantId,
          changeId: activeChangeId,
          detail: response,
        });
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setChangeDetailHydration({
          status: "error",
          tenantId,
          changeId: activeChangeId,
          error:
            caughtError instanceof Error
              ? caughtError.message
              : `Unable to hydrate selected change detail for ${activeChangeId}.`,
        });
      }
    }

    void loadSelectedChangeDetail();

    return () => {
      cancelled = true;
    };
  }, [
    bootstrap,
    detailHydrationQueueChanges,
    detailHydrationQueueTenantId,
    detailHydrationTargetChangeId,
    detailHydrationTargetTenantId,
    changeDetailReloadCount,
    queueHydration.status,
  ]);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    const bootstrapPayload = bootstrap;
    const routeStateSnapshot = routeStateRef.current;

    if (!bootstrapPayload || !routeStateSnapshot || routeStateSnapshot.workspaceMode !== "runs") {
      return;
    }

    const runsRouteState: FunctionalShellRouteState = routeStateSnapshot;
    const runsTenantId = runsRouteState.tenantId;
    const runSlice = runsRouteState.runSlice;

    let cancelled = false;

    async function loadRuns() {
      setRunsHydration({ status: "loading", tenantId: runsTenantId, runSlice });

      try {
        const response = await requestControlApi(
          `/api/tenants/${runsTenantId}/runs?slice=${runSlice}`,
          runsResponseSchema,
        );
        if (cancelled) {
          return;
        }

        const normalizedRouteState = sanitizeRouteState(
          bootstrapPayload,
          runsRouteState,
          undefined,
          response.runs,
        );
        const selectionNotice = resolveRunsSelectionNotice(
          runsRouteState,
          normalizedRouteState,
          response.runs,
        );

        if (!areRouteStatesEqual(runsRouteState, normalizedRouteState)) {
          const href = buildFunctionalShellHref(
            window.location.pathname,
            bootstrapPayload,
            normalizedRouteState,
          );
          const currentHref = `${window.location.pathname}${window.location.search}`;
          if (currentHref !== href) {
            window.history.replaceState(window.history.state, "", href);
          }
          commitRouteState(normalizedRouteState);
        }

        setRunsHydration({
          status: "ready",
          tenantId: runsTenantId,
          runSlice,
          runs: response.runs,
          selectionNotice,
        });
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setRunsHydration({
          status: "error",
          tenantId: runsTenantId,
          runSlice,
          error:
            caughtError instanceof Error
              ? caughtError.message
              : `Unable to hydrate runs for ${runsTenantId}.`,
          selectionNotice: null,
        });
      }
    }

    void loadRuns();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, commitRouteState, runsHydrationRunSlice, runsHydrationTenantId, runsHydrationWorkspaceMode]);

  useEffect(() => {
    if (!bootstrap || !runDetailTargetTenantId || !runDetailTargetRunId) {
      return;
    }

    if (
      runsHydration.status !== "ready" ||
      detailHydrationRunsTenantId !== runDetailTargetTenantId ||
      detailHydrationRunsRunSlice !== (routeState?.runSlice ?? DEFAULT_OPERATOR_RUN_SLICE)
    ) {
      return;
    }

    if (!detailHydrationRuns?.some((run) => run.id === runDetailTargetRunId)) {
      return;
    }

    const currentRunDetailHydration = runDetailHydrationRef.current;
    const runDetailHydrationMatchesTarget =
      currentRunDetailHydration.status !== "idle" &&
      currentRunDetailHydration.status !== "loading" &&
      currentRunDetailHydration.tenantId === runDetailTargetTenantId &&
      currentRunDetailHydration.runId === runDetailTargetRunId;

    if (runDetailHydrationMatchesTarget) {
      return;
    }

    let cancelled = false;
    const tenantId = runDetailTargetTenantId;
    const selectedRunId = runDetailTargetRunId;

    async function loadSelectedRunDetail() {
      setRunDetailHydration({ status: "loading", tenantId, runId: selectedRunId });

      try {
        const response = await requestControlApi(
          `/api/tenants/${tenantId}/runs/${selectedRunId}`,
          runDetailResponseSchema,
        );
        if (cancelled) {
          return;
        }

        setRunDetailHydration({
          status: "ready",
          tenantId,
          runId: selectedRunId,
          detail: response,
        });
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setRunDetailHydration({
          status: "error",
          tenantId,
          runId: selectedRunId,
          error:
            caughtError instanceof Error
              ? caughtError.message
              : `Unable to hydrate selected run detail for ${selectedRunId}.`,
        });
      }
    }

    void loadSelectedRunDetail();

    return () => {
      cancelled = true;
    };
  }, [
    bootstrap,
    detailHydrationRuns,
    detailHydrationRunsRunSlice,
    detailHydrationRunsTenantId,
    routeState?.runSlice,
    runDetailReloadCount,
    runDetailTargetRunId,
    runDetailTargetTenantId,
    runsHydration.status,
  ]);

  const retry = () => {
    setBootstrap(null);
    commitRouteState(null);
    setQueueHydration({ status: "idle" });
    setChangeDetailHydration({ status: "idle" });
    setRunsHydration({ status: "idle" });
    setRunDetailHydration({ status: "idle" });
    setChangeDetailReloadCount(0);
    setRunDetailReloadCount(0);
    setError(null);
    setHasExplicitCatalogSelection(false);
    hasExplicitCatalogSelectionRef.current = false;
    setRealtimeBoundary(INITIAL_REALTIME_BOUNDARY_STATE);
    setRealtimeRetryCount(0);
    realtimeRefreshInFlightRef.current = false;
    realtimeRefreshQueuedRef.current = null;
    bootstrapRequestSequenceRef.current += 1;
    commitToast(null);
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

    return buildQueueWorkspaceState(bootstrap, routeState, queueHydration, changeDetailHydration);
  }, [bootstrap, changeDetailHydration, queueHydration, routeState]);

  const runsWorkspace = useMemo(() => {
    if (!bootstrap || !routeState) {
      return null;
    }

    return buildRunsWorkspaceState(routeState, runsHydration, runDetailHydration);
  }, [bootstrap, routeState, runDetailHydration, runsHydration]);

  const applyRouteState = (
    nextRouteState: Partial<FunctionalShellRouteState>,
    historyMode: "push" | "replace",
    options?: { explicitCatalogSelection?: boolean },
  ) => {
    if (!bootstrap || !routeState) {
      return;
    }

    const queueChanges = resolveCurrentQueueChanges(queueHydration, routeState, nextRouteState.tenantId);
    const currentRuns = resolveCurrentRuns(
      runsHydration,
      routeState,
      nextRouteState.tenantId,
      nextRouteState.runSlice,
    );
    const requestedRouteState = sanitizeRouteState(bootstrap, { ...routeState, ...nextRouteState });
    const normalized = sanitizeRouteState(
      bootstrap,
      { ...routeState, ...nextRouteState },
      queueChanges,
      currentRuns,
    );
    const href = buildFunctionalShellHref(window.location.pathname, bootstrap, normalized);
    const nextExplicitCatalogSelection =
      options?.explicitCatalogSelection ??
      (normalized.workspaceMode === "catalog" ? hasExplicitCatalogSelection : false);
    const queueSelectionNotice =
      queueChanges && normalized.workspaceMode === "queue"
        ? resolveQueueSelectionNotice(requestedRouteState, normalized, queueChanges)
        : null;
    const runsSelectionNotice =
      currentRuns && normalized.workspaceMode === "runs"
        ? resolveRunsSelectionNotice(requestedRouteState, normalized, currentRuns)
        : null;

    commitRouteState(normalized);
    hasExplicitCatalogSelectionRef.current = nextExplicitCatalogSelection;
    setHasExplicitCatalogSelection(nextExplicitCatalogSelection);
    commitToast(null);
    if (
      queueHydration.status === "ready" &&
      normalized.workspaceMode === "queue" &&
      queueHydration.tenantId === normalized.tenantId
    ) {
      setQueueHydration({
        ...queueHydration,
        selectionNotice: queueSelectionNotice,
      });
    }
    if (
      runsHydration.status === "ready" &&
      normalized.workspaceMode === "runs" &&
      runsHydration.tenantId === normalized.tenantId &&
      runsHydration.runSlice === normalized.runSlice
    ) {
      setRunsHydration({
        ...runsHydration,
        selectionNotice: runsSelectionNotice,
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

  const reconcileRealtimeEvent = async (tenantEvent: TenantRealtimeEvent) => {
    realtimeRefreshQueuedRef.current = tenantEvent;
    if (realtimeRefreshInFlightRef.current) {
      return;
    }

    while (realtimeRefreshQueuedRef.current) {
      const queuedEvent = realtimeRefreshQueuedRef.current;
      realtimeRefreshQueuedRef.current = null;
      realtimeRefreshInFlightRef.current = true;
      setChangeDetailHydration({ status: "idle" });
      setRunDetailHydration({ status: "idle" });
      setRealtimeBoundary({
        status: "reconciling",
        notice: buildRealtimeReconciliationNotice(queuedEvent),
        lastEventType: queuedEvent.type,
      });

      try {
        const didCommit = await refreshBootstrap({
          historyMode: "replace",
          allowOnRouteChange: true,
          preserveToast: true,
          resolveNextRouteState: () => routeStateRef.current,
          resolveExplicitCatalogSelection: () => hasExplicitCatalogSelectionRef.current,
        });

        if (didCommit || !realtimeRefreshQueuedRef.current) {
          setRealtimeBoundary({
            status: "live",
            notice: null,
            lastEventType: queuedEvent.type,
          });
        }
      } catch (caughtError) {
        setRealtimeBoundary({
          status: "degraded",
          notice: buildRealtimeDegradedNotice(
            caughtError instanceof Error
              ? caughtError.message
              : "Control API realtime reconciliation failed.",
          ),
          lastEventType: queuedEvent.type,
        });
        realtimeRefreshQueuedRef.current = null;
      } finally {
        realtimeRefreshInFlightRef.current = false;
      }
    }
  };

  useTenantRealtimeBoundary({
    tenantId: routeState?.tenantId ?? null,
    connectionKey: realtimeRetryCount,
    onRealtimeOpen: () => {
      setRealtimeBoundary((current) =>
        current.status === "reconciling" && current.lastEventType
          ? current
          : {
              status: "live",
              notice: null,
              lastEventType: current.lastEventType,
            },
      );
    },
    onTenantEvent: (tenantEvent) => reconcileRealtimeEvent(tenantEvent),
    onRealtimeError: (message) => {
      setRealtimeBoundary((current) => ({
        status: "degraded",
        notice: buildRealtimeDegradedNotice(message),
        lastEventType: current.lastEventType,
      }));
    },
  });

  const requireSelectedQueueChange = (actionLabel: string) => {
    if (!routeState || routeState.workspaceMode !== "queue" || !routeState.changeId) {
      throw new Error(`Select a backend-owned change before ${actionLabel.toLowerCase()}.`);
    }

    return {
      tenantId: routeState.tenantId,
      changeId: routeState.changeId,
    };
  };

  const requireSelectedRun = (actionLabel: string) => {
    if (!routeState || routeState.workspaceMode !== "runs" || !routeState.runId) {
      throw new Error(`Select a backend-owned run before ${actionLabel.toLowerCase()}.`);
    }

    return {
      tenantId: routeState.tenantId,
      runId: routeState.runId,
    };
  };

  if (error) {
    return {
      status: "error",
      error,
      retry,
    };
  }

  if (!bootstrap || !routeState || !queueWorkspace || !runsWorkspace) {
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
    runsWorkspace,
    activeTenant,
    activeRepositoryEntry,
    hasExplicitCatalogSelection,
    realtimeBoundary,
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
          runId: routeState.workspaceMode === "runs" ? null : routeState.runId,
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
    setRunSlice: (runSlice) => {
      applyRouteState({ workspaceMode: "runs", runSlice }, "push");
    },
    selectRun: (runId) => {
      applyRouteState({ workspaceMode: "runs", runId }, "push");
    },
    clearSelectedRun: () => {
      applyRouteState({ workspaceMode: "runs", runId: null }, "replace");
    },
    openSelectedRunChange: () => {
      const selectedRunChangeId =
        runsWorkspace.status === "ready" ? runsWorkspace.selectedRun?.change.id ?? null : null;
      if (!selectedRunChangeId) {
        return;
      }

      applyRouteState(
        {
          workspaceMode: "queue",
          viewId: DEFAULT_OPERATOR_VIEW_ID,
          filterId: DEFAULT_OPERATOR_FILTER_ID,
          searchQuery: "",
          changeId: selectedRunChangeId,
          tabId: DEFAULT_OPERATOR_TAB_ID,
        },
        "push",
      );
    },
    retrySelectedRunDetail: () => {
      if (!routeState.runId || routeState.workspaceMode !== "runs") {
        return;
      }

      setRunDetailHydration({ status: "idle" });
      setRunDetailReloadCount((count) => count + 1);
    },
    decideSelectedRunApproval: async (approvalId, decision) => {
      const { tenantId, runId } = requireSelectedRun("Decide approval");

      const response = await requestControlApi(
        `/api/tenants/${tenantId}/approvals/${approvalId}/decision`,
        approvalDecisionResponseSchema,
        {
          method: "POST",
          body: JSON.stringify({ decision }),
        },
      );
      const toastMessage = `Approval ${response.approval.id} ${response.approval.status}.`;

      setRunDetailHydration({ status: "idle" });
      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "runs",
          runId,
        },
      });
      commitToast(toastMessage);
    },
    deleteSelectedChange: async () => {
      const { tenantId, changeId } = requireSelectedQueueChange("Delete change");

      const response = await requestControlApi(
        `/api/tenants/${tenantId}/changes/${changeId}`,
        deleteChangeResponseSchema,
        {
          method: "DELETE",
        },
      );
      const toastMessage = `Change ${response.deletedChangeId} deleted.`;

      setChangeDetailHydration({ status: "idle" });
      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "queue",
          changeId: null,
          tabId: DEFAULT_OPERATOR_TAB_ID,
        },
      });
      commitToast(toastMessage);
    },
    runSelectedChangeNextStep: async () => {
      const { tenantId, changeId } = requireSelectedQueueChange("Run next step");

      const response = await requestControlApi(
        `/api/tenants/${tenantId}/changes/${changeId}/actions/run-next`,
        runMutationResponseSchema,
        {
          method: "POST",
        },
      );
      const toastMessage = `Run ${response.run.id} started for ${changeId}.`;

      setChangeDetailHydration({ status: "idle" });
      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "queue",
          changeId,
        },
      });
      commitToast(toastMessage);
    },
    escalateSelectedChange: async () => {
      const { tenantId, changeId } = requireSelectedQueueChange("Escalate");

      await requestControlApi(
        `/api/tenants/${tenantId}/changes/${changeId}/actions/escalate`,
        createChangeResponseSchema,
        {
          method: "POST",
        },
      );
      const toastMessage = `Change ${changeId} escalated.`;

      setChangeDetailHydration({ status: "idle" });
      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "queue",
          changeId,
        },
      });
      commitToast(toastMessage);
    },
    blockSelectedChangeBySpec: async () => {
      const { tenantId, changeId } = requireSelectedQueueChange("Mark blocked by spec");

      await requestControlApi(
        `/api/tenants/${tenantId}/changes/${changeId}/actions/block-by-spec`,
        createChangeResponseSchema,
        {
          method: "POST",
        },
      );
      const toastMessage = `Change ${changeId} marked blocked by spec.`;

      setChangeDetailHydration({ status: "idle" });
      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "queue",
          changeId,
        },
      });
      commitToast(toastMessage);
    },
    createSelectedChangeClarificationRound: async () => {
      const { tenantId, changeId } = requireSelectedQueueChange("Create clarification round");

      const response = await requestControlApi(
        `/api/tenants/${tenantId}/changes/${changeId}/clarifications/auto`,
        clarificationRoundResponseSchema,
        {
          method: "POST",
        },
      );
      const toastMessage = `Clarification round ${response.round.id} created for ${changeId}.`;

      setChangeDetailHydration({ status: "idle" });
      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "queue",
          changeId,
        },
      });
      commitToast(toastMessage);
    },
    answerSelectedChangeClarificationRound: async (roundId, answers) => {
      const { tenantId, changeId } = requireSelectedQueueChange("Submit clarification answers");

      await requestControlApi(
        `/api/tenants/${tenantId}/clarifications/${roundId}/answers`,
        clarificationRoundResponseSchema,
        {
          method: "POST",
          body: JSON.stringify({
            answers: answers.map((answer) => ({
              questionId: answer.questionId,
              selectedOptionId: answer.selectedOptionId,
              ...(answer.freeformNote ? { freeformNote: answer.freeformNote } : {}),
            })),
          }),
        },
      );
      const toastMessage = `Clarification round ${roundId} answered.`;

      setChangeDetailHydration({ status: "idle" });
      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "queue",
          changeId,
        },
      });
      commitToast(toastMessage);
    },
    promoteSelectedChangeFact: async (title, body) => {
      const { tenantId, changeId } = requireSelectedQueueChange("Promote fact");

      const response = await requestControlApi(
        `/api/tenants/${tenantId}/changes/${changeId}/promotions`,
        promotedFactResponseSchema,
        {
          method: "POST",
          body: JSON.stringify({ fact: { title, body } }),
        },
      );
      const toastMessage = `Fact ${response.fact.title} promoted to tenant memory.`;

      setChangeDetailHydration({ status: "idle" });
      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "queue",
          changeId,
        },
      });
      commitToast(toastMessage);
    },
    setQueueView: (viewId) => {
      applyRouteState({ workspaceMode: "queue", viewId }, "push");
    },
    setQueueFilter: (filterId) => {
      applyRouteState({ workspaceMode: "queue", filterId }, "push");
    },
    setQueueTab: (tabId) => {
      applyRouteState({ workspaceMode: "queue", tabId }, "push");
    },
    selectQueueChange: (changeId) => {
      applyRouteState({ workspaceMode: "queue", changeId }, "push");
    },
    clearQueueSelection: () => {
      applyRouteState({ workspaceMode: "queue", changeId: null }, "replace");
    },
    retrySelectedChangeDetail: () => {
      if (!routeState.changeId || routeState.workspaceMode !== "queue") {
        return;
      }

      setChangeDetailHydration({ status: "idle" });
      setChangeDetailReloadCount((count) => count + 1);
    },
    selectCatalogTenant: async (tenantId) => {
      applyRouteState({ workspaceMode: "catalog", tenantId }, "push", {
        explicitCatalogSelection: true,
      });
    },
    clearCatalogSelection: () => {
      hasExplicitCatalogSelectionRef.current = false;
      setHasExplicitCatalogSelection(false);
      commitToast(null);
    },
    createTenant: async (name, repoPath, description) => {
      const response = await requestControlApi(TENANTS_ENDPOINT, createTenantResponseSchema, {
        method: "POST",
        body: JSON.stringify({ name, repoPath, description }),
      });
      const toastMessage = `Repository ${response.tenant.name} registered.`;

      await refreshBootstrap({
        historyMode: "push",
        nextRouteState: {
          ...routeState,
          workspaceMode: "catalog",
          tenantId: response.tenant.id,
          filterId: DEFAULT_OPERATOR_FILTER_ID,
          searchQuery: "",
          changeId: null,
          runId: null,
        },
        explicitCatalogSelection: true,
      });
      commitToast(toastMessage);
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
      const toastMessage = `Change ${response.change.id} created for ${activeTenant?.name ?? routeState.tenantId}.`;

      await refreshBootstrap({
        historyMode: "replace",
        nextRouteState: {
          ...routeState,
          workspaceMode: "catalog",
          changeId: null,
          runId: null,
        },
        explicitCatalogSelection: hasExplicitCatalogSelection,
      });
      commitToast(toastMessage);
    },
    retryRealtime: () => {
      setRealtimeBoundary(() => ({
        status: "reconciling",
        notice: "Retrying realtime subscription for the current tenant.",
        lastEventType: null,
      }));
      setRealtimeRetryCount((count) => count + 1);
    },
    buildWorkspaceHref: (workspaceMode) => {
      const queueChanges = resolveCurrentQueueChanges(queueHydration, routeState);
      const currentRuns = resolveCurrentRuns(runsHydration, routeState);
      return buildFunctionalShellHref(
        window.location.pathname,
        bootstrap,
        sanitizeRouteState(bootstrap, { ...routeState, workspaceMode }, queueChanges, currentRuns),
      );
    },
  };
}

function buildQueueWorkspaceState(
  bootstrap: BootstrapResponse,
  routeState: FunctionalShellRouteState,
  queueHydration: QueueHydrationState,
  detailHydration: ChangeDetailHydrationState,
): QueueWorkspaceState {
  const detailState = resolveChangeDetailWorkspaceState(routeState, detailHydration);
  const baseState = {
    tenantId: routeState.tenantId,
    activeViewId: routeState.viewId,
    activeFilterId: routeState.filterId,
    searchQuery: routeState.searchQuery,
    selectedChangeId: routeState.changeId,
    activeTabId: routeState.tabId,
    selectionNotice: queueHydration.status === "ready" ? queueHydration.selectionNotice : null,
    detailStatus: detailState.status,
    detailError: detailState.error,
    detail: detailState.detail,
  };

  if (queueHydration.status === "error" && queueHydration.tenantId === routeState.tenantId) {
    return {
      ...baseState,
      status: "error",
      error: queueHydration.error,
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
  };
}

function resolveChangeDetailWorkspaceState(
  routeState: FunctionalShellRouteState,
  detailHydration: ChangeDetailHydrationState,
) {
  if (routeState.workspaceMode !== "queue" || !routeState.changeId) {
    return {
      status: "idle" as const,
      error: null,
      detail: null,
    };
  }

  if (
    detailHydration.status === "loading" &&
    detailHydration.tenantId === routeState.tenantId &&
    detailHydration.changeId === routeState.changeId
  ) {
    return {
      status: "loading" as const,
      error: null,
      detail: null,
    };
  }

  if (
    detailHydration.status === "error" &&
    detailHydration.tenantId === routeState.tenantId &&
    detailHydration.changeId === routeState.changeId
  ) {
    return {
      status: "error" as const,
      error: detailHydration.error,
      detail: null,
    };
  }

  if (
    detailHydration.status === "ready" &&
    detailHydration.tenantId === routeState.tenantId &&
    detailHydration.changeId === routeState.changeId
  ) {
    return {
      status: "ready" as const,
      error: null,
      detail: detailHydration.detail,
    };
  }

  return {
    status: "idle" as const,
    error: null,
    detail: null,
  };
}

function buildRunsWorkspaceState(
  routeState: FunctionalShellRouteState,
  runsHydration: RunsHydrationState,
  runDetailHydration: RunDetailHydrationState,
): RunsWorkspaceState {
  const detailState = resolveSelectedRunWorkspaceState(routeState, runDetailHydration);
  const baseState = {
    tenantId: routeState.tenantId,
    activeRunSlice: routeState.runSlice,
    searchQuery: routeState.searchQuery,
    selectedRunId: routeState.runId,
    selectionNotice: runsHydration.status === "ready" ? runsHydration.selectionNotice : null,
    detailStatus: detailState.status,
    detailError: detailState.error,
    detail: detailState.detail,
  };

  if (
    runsHydration.status === "error" &&
    runsHydration.tenantId === routeState.tenantId &&
    runsHydration.runSlice === routeState.runSlice
  ) {
    return {
      ...baseState,
      status: "error",
      error: runsHydration.error,
    };
  }

  if (
    runsHydration.status === "ready" &&
    runsHydration.tenantId === routeState.tenantId &&
    runsHydration.runSlice === routeState.runSlice
  ) {
    const visibleRuns = filterRuns(runsHydration.runs, {
      searchQuery: routeState.searchQuery,
    });
    const selectedRun = visibleRuns.find((run) => run.id === routeState.runId) ?? null;

    return {
      ...baseState,
      status: "ready",
      runs: runsHydration.runs,
      visibleRuns,
      selectedRun,
      selectedRunApprovals: detailState.detail?.approvals ?? [],
      selectedRunEvents: detailState.detail?.events ?? [],
    };
  }

  return {
    ...baseState,
    status: "loading",
  };
}

function resolveSelectedRunWorkspaceState(
  routeState: FunctionalShellRouteState,
  runDetailHydration: RunDetailHydrationState,
) {
  if (routeState.workspaceMode !== "runs" || !routeState.runId) {
    return {
      status: "idle" as const,
      error: null,
      detail: null,
    };
  }

  if (
    runDetailHydration.status === "loading" &&
    runDetailHydration.tenantId === routeState.tenantId &&
    runDetailHydration.runId === routeState.runId
  ) {
    return {
      status: "loading" as const,
      error: null,
      detail: null,
    };
  }

  if (
    runDetailHydration.status === "error" &&
    runDetailHydration.tenantId === routeState.tenantId &&
    runDetailHydration.runId === routeState.runId
  ) {
    return {
      status: "error" as const,
      error: runDetailHydration.error,
      detail: null,
    };
  }

  if (
    runDetailHydration.status === "ready" &&
    runDetailHydration.tenantId === routeState.tenantId &&
    runDetailHydration.runId === routeState.runId
  ) {
    return {
      status: "ready" as const,
      error: null,
      detail: runDetailHydration.detail,
    };
  }

  return {
    status: "idle" as const,
    error: null,
    detail: null,
  };
}

function normalizeLocation(
  bootstrap: BootstrapResponse,
  pathname: string,
  search: string,
  queueChanges?: ChangeSummary[],
  runs?: RunListEntry[],
) {
  const parsed = readOperatorRouteState(search);
  const routeState = sanitizeRouteState(
    bootstrap,
    {
      workspaceMode: parsed.workspaceMode,
      runSlice: parsed.runSlice,
      tenantId: parsed.tenantId,
      viewId: parsed.viewId,
      filterId: parsed.filterId,
      searchQuery: parsed.searchQuery,
      changeId: parsed.changeId ?? null,
      runId: parsed.runId ?? null,
      tabId: parsed.tabId,
    },
    queueChanges,
    runs,
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
  runs?: RunListEntry[],
): FunctionalShellRouteState {
  const workspaceMode = routeState.workspaceMode ?? DEFAULT_OPERATOR_WORKSPACE_MODE;
  const tenantId = resolveTenantId(bootstrap, routeState.tenantId);
  const searchQuery = routeState.searchQuery?.trim() ?? "";
  const runSlice = resolveRunSlice(routeState.runSlice);

  if (workspaceMode === "catalog") {
    return {
      workspaceMode,
      runSlice: DEFAULT_OPERATOR_RUN_SLICE,
      tenantId,
      viewId: DEFAULT_OPERATOR_VIEW_ID,
      filterId: resolveCatalogFilterId(routeState.filterId),
      searchQuery,
      changeId: null,
      runId: null,
      tabId: DEFAULT_OPERATOR_TAB_ID,
    };
  }

  if (workspaceMode === "queue") {
    const viewId = resolveViewId(
      bootstrap,
      routeState.viewId ?? DEFAULT_OPERATOR_VIEW_ID,
      DEFAULT_OPERATOR_VIEW_ID,
    );
    const filterId = resolveQueueFilterId(routeState.filterId);
    const changeId = queueChanges
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
      : routeState.changeId ?? null;

    return {
      workspaceMode,
      runSlice: DEFAULT_OPERATOR_RUN_SLICE,
      tenantId,
      viewId,
      filterId,
      searchQuery,
      changeId,
      runId: null,
      tabId: resolveQueueTabId(routeState.tabId, changeId),
    };
  }

  return {
    workspaceMode,
    runSlice,
    tenantId,
    viewId: DEFAULT_OPERATOR_VIEW_ID,
    filterId: DEFAULT_OPERATOR_FILTER_ID,
    searchQuery,
    changeId: null,
    runId: runs
      ? resolveVisibleRunSelection(
          runs,
          {
            searchQuery,
          },
          routeState.runId ?? null,
        )
      : routeState.runId ?? null,
    tabId: DEFAULT_OPERATOR_TAB_ID,
  };
}

function buildFunctionalShellHref(
  pathname: string,
  bootstrap: BootstrapResponse,
  routeState: FunctionalShellRouteState,
) {
  return buildOperatorRouteHref(pathname, {
    workspaceMode: routeState.workspaceMode,
    runSlice: routeState.workspaceMode === "runs" ? routeState.runSlice : undefined,
    tenantId: routeState.tenantId === bootstrap.activeTenantId ? undefined : routeState.tenantId,
    viewId: routeState.workspaceMode === "queue" ? routeState.viewId : undefined,
    filterId:
      routeState.workspaceMode === "catalog" || routeState.workspaceMode === "queue"
        ? routeState.filterId
        : undefined,
    searchQuery: routeState.searchQuery || undefined,
    changeId: routeState.workspaceMode === "queue" ? routeState.changeId ?? undefined : undefined,
    runId: routeState.workspaceMode === "runs" ? routeState.runId ?? undefined : undefined,
    tabId:
      routeState.workspaceMode === "queue" && routeState.changeId ? routeState.tabId : undefined,
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

function resolveCurrentRuns(
  runsHydration: RunsHydrationState,
  routeState: FunctionalShellRouteState,
  preferredTenantId?: string,
  preferredRunSlice?: OperatorRunSlice,
) {
  const tenantId = preferredTenantId ?? routeState.tenantId;
  const runSlice = preferredRunSlice ?? routeState.runSlice;
  return runsHydration.status === "ready" &&
    runsHydration.tenantId === tenantId &&
    runsHydration.runSlice === runSlice
    ? runsHydration.runs
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

function resolveRunSlice(runSlice?: OperatorRunSlice) {
  return runSlice === "all" ? "all" : DEFAULT_OPERATOR_RUN_SLICE;
}

function resolveQueueTabId(tabId?: ChangeDetailTabId, changeId?: string | null) {
  if (!changeId) {
    return DEFAULT_OPERATOR_TAB_ID;
  }

  return tabId && SUPPORTED_QUEUE_DETAIL_TABS.some((tab) => tab.id === tabId)
    ? tabId
    : DEFAULT_OPERATOR_TAB_ID;
}

function resolveQueueSelectionNotice(
  originalRouteState: FunctionalShellRouteState,
  normalizedRouteState: FunctionalShellRouteState,
  queueChanges: ChangeSummary[],
): QueueSelectionNotice | null {
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
    return {
      kind: "cleared",
      message: `${originalRouteState.changeId} is not available because this queue slice is empty.`,
    };
  }

  if (normalizedRouteState.changeId) {
    return {
      kind: "repaired",
      message: `${originalRouteState.changeId} moved to ${normalizedRouteState.changeId} because the original selection is not available in the current queue slice.`,
    };
  }

  return {
    kind: "cleared",
    message: `${originalRouteState.changeId} is not available in the current queue slice.`,
  };
}

function resolveRunsSelectionNotice(
  originalRouteState: FunctionalShellRouteState,
  normalizedRouteState: FunctionalShellRouteState,
  runs: RunListEntry[],
): RunsSelectionNotice | null {
  if (
    originalRouteState.workspaceMode !== "runs" ||
    !originalRouteState.runId ||
    originalRouteState.runId === normalizedRouteState.runId
  ) {
    return null;
  }

  const visibleRuns = filterRuns(runs, {
    searchQuery: normalizedRouteState.searchQuery,
  });

  if (visibleRuns.length === 0) {
    return {
      kind: "cleared",
      message: `${originalRouteState.runId} is not available because this runs slice is empty.`,
    };
  }

  return {
    kind: "cleared",
    message: `${originalRouteState.runId} is not available in the current runs slice.`,
  };
}

function areRouteStatesEqual(
  currentRouteState: FunctionalShellRouteState,
  nextRouteState: FunctionalShellRouteState,
) {
  return (
    currentRouteState.workspaceMode === nextRouteState.workspaceMode &&
    currentRouteState.runSlice === nextRouteState.runSlice &&
    currentRouteState.tenantId === nextRouteState.tenantId &&
    currentRouteState.viewId === nextRouteState.viewId &&
    currentRouteState.filterId === nextRouteState.filterId &&
    currentRouteState.searchQuery === nextRouteState.searchQuery &&
    currentRouteState.changeId === nextRouteState.changeId &&
    currentRouteState.runId === nextRouteState.runId &&
    currentRouteState.tabId === nextRouteState.tabId
  );
}

function buildRealtimeReconciliationNotice(event: TenantRealtimeEvent) {
  if (event.type === "clarification-created" || event.type === "clarification-answered") {
    return `Clarification activity for ${event.changeId ?? "the selected change"} is being reconciled.`;
  }

  if (event.type === "approval-decided") {
    return `Approval reconciliation is in progress for ${event.runId ?? "the selected run"}.`;
  }

  if (event.type === "fact-promoted") {
    return `Tenant memory for ${event.changeId ?? "the selected change"} is being refreshed.`;
  }

  if (event.type.startsWith("run-")) {
    return `Run reconciliation is in progress for ${event.runId ?? "the active run"}.`;
  }

  return `Tenant event ${event.type} is reconciling queue, detail, and run state.`;
}

function buildRealtimeDegradedNotice(message: string) {
  const normalizedMessage = message.trim() || "Control API realtime subscription failed.";
  return `${normalizedMessage} Retry realtime to resume shared tenant reconciliation without leaving the current workspace.`;
}

type NormalizedShellLocation = {
  routeState: FunctionalShellRouteState;
  href: string;
  shouldReplace: boolean;
  hasExplicitCatalogSelection: boolean;
};
