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
} from "./api";
import { ChangeDetail } from "./components/ChangeDetail";
import { InspectorPanel } from "./components/InspectorPanel";
import { OperatorRail } from "./components/OperatorRail";
import { QueuePanel } from "./components/QueuePanel";
import { RunStudio } from "./components/RunStudio";
import { formatStateLabel } from "./lib";
import { DetailWorkspaceShell } from "./platform/shells/DetailWorkspaceShell";
import { MasterDetailShell } from "./platform/shells/MasterDetailShell";
import { WorkspacePageShell } from "./platform/shells/WorkspacePageShell";
import type { ApprovalRecord, BootstrapResponse, ChangeDetailResponse, ChangeSummary, RuntimeEvent } from "./types";

import "./styles.css";

export default function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [changes, setChanges] = useState<ChangeSummary[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [activeViewId, setActiveViewId] = useState("inbox");
  const [activeFilterId, setActiveFilterId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
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

  useEffect(() => {
    activeTenantRef.current = activeTenantId;
  }, [activeTenantId]);

  useEffect(() => {
    selectedChangeRef.current = selectedChangeId;
  }, [selectedChangeId]);

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

  useEffect(() => {
    void fetchBootstrap()
      .then((payload) => {
        setBootstrap(payload);
        setActiveTenantId(payload.activeTenantId);
        activeTenantRef.current = payload.activeTenantId;
        setChanges(payload.changes);
        selectChange(payload.changes[0]?.id ?? null);
        setActiveViewId(payload.views[0]?.id ?? "inbox");
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

  const viewCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const view of bootstrap?.views ?? []) {
      counts[view.id] = changes.filter((change) => matchesView(change, view.id)).length;
    }
    return counts;
  }, [bootstrap?.views, changes]);

  const filteredChanges = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return changes.filter((change) => {
      if (!matchesView(change, activeViewId)) {
        return false;
      }

      if (activeFilterId === "needs-review" && change.mandatoryGapCount === 0) {
        return false;
      }
      if (activeFilterId === "blocked" && !["blocked_by_spec", "escalated"].includes(change.state)) {
        return false;
      }
      if (!query) {
        return true;
      }

      return [change.id, change.title, change.subtitle, change.state, change.nextAction, change.blocker]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [activeFilterId, activeViewId, changes, searchQuery]);

  useEffect(() => {
    if (!selectedChangeId) {
      return;
    }
    if (!filteredChanges.some((change) => change.id === selectedChangeId)) {
      selectChange(filteredChanges[0]?.id ?? null);
    }
  }, [filteredChanges, selectedChangeId]);

  const selectedRun = detail?.runs.find((run) => run.id === selectedRunId) ?? null;
  const selectedRunApprovals = selectedRunId ? runApprovals[selectedRunId] ?? [] : [];
  const selectedRunEvents = selectedRunId ? runEvents[selectedRunId] ?? [] : [];

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

  async function handleAnswerClarificationRound(roundId: string, answers: Parameters<typeof answerClarificationRound>[2]) {
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
    setActiveViewId("inbox");
    setActiveFilterId("all");
    setSearchQuery("");
  }

  if (error) {
    return (
      <WorkspacePageShell
        header={<header className="topbar" />}
        workspace={<div className="error-card">Error: {error}</div>}
      />
    );
  }

  if (!bootstrap || !activeTenant) {
    return (
      <WorkspacePageShell
        header={<header className="topbar" />}
        workspace={<div className="loading-card">Loading backend state...</div>}
      />
    );
  }

  return (
    <WorkspacePageShell
      header={
        <header className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">Application Foundation</p>
          <h1>Change Control Center</h1>
          <p className="subtitle">Backend-owned operator shell with tenant memory, run lineage and clarification rounds.</p>
        </div>
        <div className="topbar-actions">
          <label className="search-field">
            <span>Search</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="change, requirement, blocker"
              type="search"
            />
          </label>
          <button type="button" className="ghost-button" onClick={() => void handleCreateChange()}>
            New change
          </button>
          <button type="button" className="primary-button" onClick={() => void handleRunNext()}>
            Run next step
          </button>
          <label className="tenant-picker">
            <span>Tenant</span>
            <select value={activeTenantId ?? ""} onChange={(event) => void handleTenantChange(event.target.value)}>
              {bootstrap.tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        </header>
      }
      hero={
        <>
        <div className="hero-card">
          <span>Repository</span>
          <strong>{activeTenant.repoPath}</strong>
        </div>
        <div className="hero-card">
          <span>Changes</span>
          <strong>{filteredChanges.length}</strong>
        </div>
        <div className="hero-card">
          <span>Mandatory gaps</span>
          <strong>{detail?.change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed").length ?? 0}</strong>
        </div>
        <div className="hero-card">
          <span>Selected State</span>
          <strong>{detail ? formatStateLabel(detail.change.state) : "none"}</strong>
        </div>
        </>
      }
      workspace={
        <MasterDetailShell
          navigation={
            <OperatorRail
              views={bootstrap.views}
              changes={changes}
              detail={detail}
              viewCounts={viewCounts}
              activeViewId={activeViewId}
              activeFilterId={activeFilterId}
              onSelectView={setActiveViewId}
              onSelectFilter={setActiveFilterId}
            />
          }
          list={
            <QueuePanel
              changes={filteredChanges}
              selectedChangeId={selectedChangeId}
              activeViewLabel={bootstrap.views.find((view) => view.id === activeViewId)?.label ?? "Inbox"}
              activeViewCount={filteredChanges.length}
              onSelectChange={selectChange}
              onSavedFilters={() => setToast("Saved filters will be wired in a later delivery.")}
              onExportReport={() => setToast("Export report is intentionally left as a shell action in this pass.")}
            />
          }
          inspector={
            <InspectorPanel
              detail={detail}
              selectedChangeId={selectedChangeId}
              onClearSelection={() => {
                selectChange(null);
                setDetail(null);
              }}
            />
          }
        />
      }
      detailWorkspace={
        <DetailWorkspaceShell
          detail={
            <ChangeDetail
              detail={detail}
              onRunNext={handleRunNext}
              onOpenRunStudio={handleOpenRunStudio}
              onEscalate={handleEscalate}
              onBlockBySpec={handleBlockBySpec}
              onCreateClarificationRound={handleCreateClarificationRound}
              onAnswerClarificationRound={handleAnswerClarificationRound}
              onSelectRun={setSelectedRunId}
              onPromoteFact={handlePromoteFact}
            />
          }
          runInspection={
            <RunStudio
              run={selectedRun}
              events={selectedRunEvents}
              approvals={selectedRunApprovals}
              onApprovalDecision={handleApprovalDecision}
            />
          }
        />
      }
      toast={toast ? <div className="toast">{toast}</div> : null}
    />
  );
}

function matchesView(change: ChangeSummary, viewId: string) {
  switch (viewId) {
    case "ready":
      return ["approved", "ready_for_acceptance"].includes(change.state) || change.mandatoryGapCount <= 1;
    case "review":
      return ["review_pending", "gap_fixing"].includes(change.state);
    case "blocked":
      return ["blocked_by_spec", "escalated"].includes(change.state);
    case "done":
      return change.state === "done";
    default:
      return true;
  }
}
