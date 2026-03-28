import { useEffect, useMemo, useState } from "react";

import {
  answerClarificationRound,
  createClarificationRound,
  fetchBootstrap,
  fetchChangeDetail,
  fetchChanges,
  fetchRunDetail,
  promoteFact,
  runNext,
} from "./api";
import { ChangeDetail } from "./components/ChangeDetail";
import { QueuePanel } from "./components/QueuePanel";
import { RunStudio } from "./components/RunStudio";
import type { ApprovalRecord, BootstrapResponse, ChangeDetailResponse, ChangeSummary } from "./types";

import "./styles.css";

export default function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [changes, setChanges] = useState<ChangeSummary[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChangeDetailResponse | null>(null);
  const [runApprovals, setRunApprovals] = useState<Record<string, ApprovalRecord[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchBootstrap()
      .then((payload) => {
        setBootstrap(payload);
        setActiveTenantId(payload.activeTenantId);
        setChanges(payload.changes);
        setSelectedChangeId(payload.changes[0]?.id ?? null);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    if (!activeTenantId || !selectedChangeId) {
      return;
    }

    void fetchChangeDetail(activeTenantId, selectedChangeId)
      .then((payload) => {
        setDetail(payload);
        if (!selectedRunId) {
          setSelectedRunId(payload.runs[0]?.id ?? null);
        }
      })
      .catch((reason: Error) => setError(reason.message));
  }, [activeTenantId, selectedChangeId]);

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
        void fetchChangeDetail(activeTenantId, selectedChangeId).then(setDetail);
      }
    };

    return () => socket.close();
  }, [activeTenantId, selectedChangeId]);

  useEffect(() => {
    if (!activeTenantId || !selectedRunId) {
      return;
    }

    void fetchRunDetail(activeTenantId, selectedRunId)
      .then((payload) => {
        setRunApprovals((current) => ({
          ...current,
          [selectedRunId]: payload.approvals,
        }));
      })
      .catch((reason: Error) => setError(reason.message));
  }, [activeTenantId, selectedRunId]);

  const activeTenant = useMemo(
    () => bootstrap?.tenants.find((tenant) => tenant.id === activeTenantId) ?? null,
    [bootstrap, activeTenantId],
  );

  const selectedRun = detail?.runs.find((run) => run.id === selectedRunId) ?? null;
  const selectedRunApprovals = selectedRunId ? runApprovals[selectedRunId] ?? [] : [];

  async function refreshCurrentChange(changeId: string) {
    if (!activeTenantId) {
      return;
    }
    const [changesPayload, detailPayload] = await Promise.all([
      fetchChanges(activeTenantId),
      fetchChangeDetail(activeTenantId, changeId),
    ]);
    setChanges(changesPayload.changes);
    setDetail(detailPayload);
    setSelectedRunId(detailPayload.runs[0]?.id ?? null);
  }

  async function handleRunNext() {
    if (!activeTenantId || !selectedChangeId) {
      return;
    }
    await runNext(activeTenantId, selectedChangeId);
    await refreshCurrentChange(selectedChangeId);
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

  async function handleTenantChange(tenantId: string) {
    setActiveTenantId(tenantId);
    const payload = await fetchChanges(tenantId);
    setChanges(payload.changes);
    setSelectedChangeId(payload.changes[0]?.id ?? null);
    setSelectedRunId(null);
  }

  if (error) {
    return <main className="app-shell"><div className="error-card">Error: {error}</div></main>;
  }

  if (!bootstrap || !activeTenant) {
    return <main className="app-shell"><div className="loading-card">Loading backend state...</div></main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Application Foundation</p>
          <h1>Change Control Center</h1>
          <p className="subtitle">Backend-owned operator shell with tenant memory, run lineage and clarification rounds.</p>
        </div>
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
      </header>

      <section className="hero-grid">
        <div className="hero-card">
          <span>Repository</span>
          <strong>{activeTenant.repoPath}</strong>
        </div>
        <div className="hero-card">
          <span>Changes</span>
          <strong>{changes.length}</strong>
        </div>
        <div className="hero-card">
          <span>Selected State</span>
          <strong>{detail?.change.state ?? "none"}</strong>
        </div>
      </section>

      <section className="workspace">
        <QueuePanel changes={changes} selectedChangeId={selectedChangeId} onSelectChange={setSelectedChangeId} />
        <ChangeDetail
          detail={detail}
          onRunNext={handleRunNext}
          onCreateClarificationRound={handleCreateClarificationRound}
          onAnswerClarificationRound={handleAnswerClarificationRound}
          onSelectRun={setSelectedRunId}
          onPromoteFact={handlePromoteFact}
        />
        <RunStudio run={selectedRun} approvals={selectedRunApprovals} />
      </section>
    </main>
  );
}
