import "./OperatorStyleSamplePage.css";

type PreviewMetric = {
  label: string;
  value: string;
  meta: string;
  tone: "blue" | "violet" | "emerald" | "amber";
  trend: number[];
};

type PreviewRingItem = {
  label: string;
  value: string;
  color: string;
};

type PreviewRepository = {
  name: string;
  branch: string;
  status: "ready" | "attention" | "blocked";
  specCoverage: number;
  risk: number;
  pending: string;
};

type PreviewQueueItem = {
  id: string;
  title: string;
  repo: string;
  status: "review" | "running" | "blocked";
  owner: string;
  updated: string;
  summary: string;
};

const PREVIEW_METRICS: PreviewMetric[] = [
  {
    label: "Repositories",
    value: "12",
    meta: "4 need operator attention",
    tone: "blue",
    trend: [8, 8, 9, 9, 9, 10, 10, 12],
  },
  {
    label: "Open Changes",
    value: "37",
    meta: "9 in reviewed state",
    tone: "violet",
    trend: [21, 24, 22, 27, 29, 31, 34, 37],
  },
  {
    label: "Active Runs",
    value: "14",
    meta: "3 waiting on approvals",
    tone: "emerald",
    trend: [4, 6, 8, 8, 10, 12, 11, 14],
  },
  {
    label: "SLA Risk",
    value: "6",
    meta: "2 mandatory gaps overdue",
    tone: "amber",
    trend: [2, 2, 3, 4, 4, 5, 5, 6],
  },
];

const RING_ITEMS: PreviewRingItem[] = [
  { label: "Ready to merge", value: "11", color: "#4f8cff" },
  { label: "Waiting approval", value: "8", color: "#8c63ff" },
  { label: "Clarification round", value: "6", color: "#12b886" },
  { label: "Blocked by spec", value: "5", color: "#f59f00" },
  { label: "Escalated", value: "3", color: "#e8590c" },
];

const EXECUTION_LANES = [
  { label: "Run execution", detail: "7 active", width: "82%", tone: "blue" },
  { label: "Approval resolution", detail: "3 waiting", width: "44%", tone: "violet" },
  { label: "Clarification rounds", detail: "2 pending", width: "28%", tone: "emerald" },
  { label: "Spec blockers", detail: "6 surfaced", width: "36%", tone: "amber" },
] as const;

const PREVIEW_REPOSITORIES: PreviewRepository[] = [
  {
    name: "operator-shell",
    branch: "change/ui-platform-polish",
    status: "ready",
    specCoverage: 92,
    risk: 18,
    pending: "Ready for smoke gate",
  },
  {
    name: "runtime-sidecar",
    branch: "change/ws-drain-recovery",
    status: "attention",
    specCoverage: 78,
    risk: 46,
    pending: "Approval contract still open",
  },
  {
    name: "launcher-governance",
    branch: "change/readiness-hardening",
    status: "blocked",
    specCoverage: 63,
    risk: 74,
    pending: "Readiness drift unresolved",
  },
];

const PREVIEW_QUEUE: PreviewQueueItem[] = [
  {
    id: "ccc-142",
    title: "Add served-mode verification evidence pack",
    repo: "operator-shell",
    status: "review",
    owner: "Egor",
    updated: "6 min ago",
    summary: "Platform shell is ready; only evidence serialization and browser proof remain.",
  },
  {
    id: "ccc-139",
    title: "Stabilize websocket reconnect window",
    repo: "runtime-sidecar",
    status: "running",
    owner: "Codex",
    updated: "14 min ago",
    summary: "Retry loop is green in unit tests, but full served smoke still pending.",
  },
  {
    id: "ccc-131",
    title: "Archive stale OpenSpec change safely",
    repo: "launcher-governance",
    status: "blocked",
    owner: "Ops",
    updated: "39 min ago",
    summary: "Archive workflow lacks proof that readiness docs stay aligned after archive.",
  },
];

const PREVIEW_TIMELINE = [
  {
    title: "Backend contract frozen",
    detail: "The queue payload and run lineage shape match the current operator workbench.",
  },
  {
    title: "UI shell pass complete",
    detail: "Static shell reuses workbench language but shifts into codex-lb style density and tone.",
  },
  {
    title: "Smoke proof pending",
    detail: "Need backend-served Playwright proof before merging into the active workbench path.",
  },
];

function buildSparklinePath(values: number[]) {
  if (values.length === 0) {
    return "";
  }

  const width = 160;
  const height = 42;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function toneClassName(tone: PreviewMetric["tone"]) {
  switch (tone) {
    case "blue":
      return "operator-style-sample__metric-icon operator-style-sample__metric-icon--blue";
    case "violet":
      return "operator-style-sample__metric-icon operator-style-sample__metric-icon--violet";
    case "emerald":
      return "operator-style-sample__metric-icon operator-style-sample__metric-icon--emerald";
    case "amber":
      return "operator-style-sample__metric-icon operator-style-sample__metric-icon--amber";
    default:
      return "operator-style-sample__metric-icon";
  }
}

function repositoryStatusClassName(status: PreviewRepository["status"]) {
  switch (status) {
    case "ready":
      return "operator-style-sample__status operator-style-sample__status--ready";
    case "attention":
      return "operator-style-sample__status operator-style-sample__status--attention";
    case "blocked":
      return "operator-style-sample__status operator-style-sample__status--blocked";
    default:
      return "operator-style-sample__status";
  }
}

function queueStatusClassName(status: PreviewQueueItem["status"]) {
  switch (status) {
    case "review":
      return "operator-style-sample__queue-status operator-style-sample__queue-status--review";
    case "running":
      return "operator-style-sample__queue-status operator-style-sample__queue-status--running";
    case "blocked":
      return "operator-style-sample__queue-status operator-style-sample__queue-status--blocked";
    default:
      return "operator-style-sample__queue-status";
  }
}

function executionLaneClassName(tone: (typeof EXECUTION_LANES)[number]["tone"]) {
  return `operator-style-sample__lane-fill operator-style-sample__lane-fill--${tone}`;
}

function PreviewSparkline({ metric }: { metric: PreviewMetric }) {
  const path = buildSparklinePath(metric.trend);

  return (
    <svg
      className="operator-style-sample__sparkline"
      viewBox="0 0 160 42"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="operator-style-sample__sparkline-area"
        d={`${path} L 160 42 L 0 42 Z`}
      />
      <path className="operator-style-sample__sparkline-line" d={path} />
    </svg>
  );
}

function PreviewDonut() {
  const gradientStops = RING_ITEMS.map((item, index) => {
    const step = 100 / RING_ITEMS.length;
    const start = index * step;
    const end = start + step;
    return `${item.color} ${start}% ${end}%`;
  }).join(", ");

  return (
    <div
      className="operator-style-sample__donut"
      aria-hidden="true"
      style={{ backgroundImage: `conic-gradient(${gradientStops})` }}
    >
      <div className="operator-style-sample__donut-core">
        <span>Focus</span>
        <strong>37</strong>
      </div>
    </div>
  );
}

function PreviewMetricCard({ metric }: { metric: PreviewMetric }) {
  return (
    <article className="operator-style-sample__metric-card">
      <div className="operator-style-sample__metric-header">
        <span className="operator-style-sample__eyebrow">{metric.label}</span>
        <span className={toneClassName(metric.tone)} aria-hidden="true" />
      </div>
      <div className="operator-style-sample__metric-body">
        <strong>{metric.value}</strong>
        <p>{metric.meta}</p>
      </div>
      <PreviewSparkline metric={metric} />
    </article>
  );
}

export function OperatorStyleSamplePage() {
  const liveHref =
    (window as typeof window & { __CCC_LIVE_WORKBENCH_URL__?: string }).__CCC_LIVE_WORKBENCH_URL__ ??
    window.location.pathname;

  return (
    <div className="operator-style-sample" data-platform-surface="operator-style-sample">
      <header className="operator-style-sample__masthead">
        <div className="operator-style-sample__masthead-inner">
          <div className="operator-style-sample__brand">
            <div className="operator-style-sample__brand-mark" aria-hidden="true">
              CC
            </div>
            <div>
              <strong>Change Control Center</strong>
              <p>Static operator preview</p>
            </div>
          </div>
          <nav className="operator-style-sample__nav" aria-label="Preview sections">
            <span className="operator-style-sample__nav-pill operator-style-sample__nav-pill--active">
              Workbench
            </span>
            <span className="operator-style-sample__nav-pill">Repositories</span>
            <span className="operator-style-sample__nav-pill">Runs</span>
            <span className="operator-style-sample__nav-pill">Governance</span>
          </nav>
          <div className="operator-style-sample__actions">
            <span className="operator-style-sample__ghost-chip">codex-lb style</span>
            <a className="operator-style-sample__ghost-chip operator-style-sample__ghost-chip--link" href={liveHref}>
              Open live workbench
            </a>
          </div>
        </div>
      </header>

      <main className="operator-style-sample__page">
        <section className="operator-style-sample__page-header">
          <div>
            <h1>Operator Shell Preview</h1>
            <p>
              Static composition of the Change Control Center workbench reinterpreted with the calmer,
              denser codex-lb visual language.
            </p>
          </div>
          <div className="operator-style-sample__header-note">
            <span className="operator-style-sample__live-dot" aria-hidden="true" />
            Served-mode reference only
          </div>
        </section>

        <section className="operator-style-sample__metrics-grid" aria-label="Preview metrics">
          {PREVIEW_METRICS.map((metric) => (
            <PreviewMetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="operator-style-sample__overview-grid">
          <article className="operator-style-sample__panel operator-style-sample__panel--wide">
            <div className="operator-style-sample__panel-heading">
              <div>
                <h2>Repository pressure</h2>
                <p>Portfolio distribution across queue states.</p>
              </div>
            </div>
            <div className="operator-style-sample__donut-layout">
              <PreviewDonut />
              <div className="operator-style-sample__legend">
                {RING_ITEMS.map((item) => (
                  <div key={item.label} className="operator-style-sample__legend-row">
                    <span
                      className="operator-style-sample__legend-dot"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="operator-style-sample__legend-label">{item.label}</span>
                    <span className="operator-style-sample__legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="operator-style-sample__panel">
            <div className="operator-style-sample__panel-heading">
              <div>
                <h2>Execution health</h2>
                <p>Where operator attention is being consumed right now.</p>
              </div>
            </div>
            <div className="operator-style-sample__execution-lanes">
              {EXECUTION_LANES.map((lane) => (
                <div key={lane.label} className="operator-style-sample__lane">
                  <div className="operator-style-sample__lane-header">
                    <span>{lane.label}</span>
                    <strong>{lane.detail}</strong>
                  </div>
                  <div className="operator-style-sample__lane-track">
                    <span
                      className={executionLaneClassName(lane.tone)}
                      style={{ width: lane.width }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="operator-style-sample__section">
          <div className="operator-style-sample__section-heading">
            <h2>Repositories</h2>
            <div className="operator-style-sample__section-rule" aria-hidden="true" />
          </div>
          <div className="operator-style-sample__repository-grid">
            {PREVIEW_REPOSITORIES.map((repository) => (
              <article key={repository.name} className="operator-style-sample__repository-card">
                <div className="operator-style-sample__repository-head">
                  <div>
                    <h3>{repository.name}</h3>
                    <p>{repository.branch}</p>
                  </div>
                  <span className={repositoryStatusClassName(repository.status)}>
                    {repository.status}
                  </span>
                </div>
                <div className="operator-style-sample__repository-metrics">
                  <div>
                    <span>Spec coverage</span>
                    <strong>{repository.specCoverage}%</strong>
                  </div>
                  <div>
                    <span>Risk</span>
                    <strong>{repository.risk}%</strong>
                  </div>
                </div>
                <div className="operator-style-sample__repository-bars">
                  <div className="operator-style-sample__repository-bar">
                    <span>Spec</span>
                    <div className="operator-style-sample__bar-track">
                      <span
                        className="operator-style-sample__bar-fill operator-style-sample__bar-fill--blue"
                        style={{ width: `${repository.specCoverage}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="operator-style-sample__repository-bar">
                    <span>Risk</span>
                    <div className="operator-style-sample__bar-track">
                      <span
                        className="operator-style-sample__bar-fill operator-style-sample__bar-fill--amber"
                        style={{ width: `${repository.risk}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
                <p className="operator-style-sample__repository-foot">{repository.pending}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="operator-style-sample__section">
          <div className="operator-style-sample__section-heading">
            <h2>Live queue</h2>
            <div className="operator-style-sample__section-rule" aria-hidden="true" />
          </div>
          <div className="operator-style-sample__queue-layout">
            <article className="operator-style-sample__panel operator-style-sample__queue-panel">
              <div className="operator-style-sample__queue-toolbar">
                <div className="operator-style-sample__queue-search">
                  <span>Search queue</span>
                  <div className="operator-style-sample__queue-input">gap, approval, websocket</div>
                </div>
                <div className="operator-style-sample__queue-filters">
                  <span>Inbox</span>
                  <span>Mandatory</span>
                  <span>Today</span>
                </div>
              </div>
              <div className="operator-style-sample__queue-table">
                {PREVIEW_QUEUE.map((item, index) => (
                  <button
                    key={item.id}
                    className={`operator-style-sample__queue-row${index === 0 ? " is-active" : ""}`}
                    type="button"
                  >
                    <div className="operator-style-sample__queue-row-main">
                      <strong>{item.title}</strong>
                      <p>{item.summary}</p>
                    </div>
                    <div className="operator-style-sample__queue-row-meta">
                      <span>{item.id}</span>
                      <span>{item.repo}</span>
                      <span>{item.owner}</span>
                      <span>{item.updated}</span>
                    </div>
                    <span className={queueStatusClassName(item.status)}>{item.status}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="operator-style-sample__panel operator-style-sample__detail-panel">
              <div className="operator-style-sample__detail-head">
                <div>
                  <span className="operator-style-sample__eyebrow">Selected change</span>
                  <h2>Add served-mode verification evidence pack</h2>
                  <p>operator-shell / ccc-142</p>
                </div>
                <span className="operator-style-sample__status operator-style-sample__status--ready">
                  reviewed
                </span>
              </div>

              <div className="operator-style-sample__detail-card">
                <div className="operator-style-sample__detail-stats">
                  <div>
                    <span>Run lineage</span>
                    <strong>run-2026-04-05-17</strong>
                  </div>
                  <div>
                    <span>Mandatory gaps</span>
                    <strong>2 open</strong>
                  </div>
                </div>
                <div className="operator-style-sample__detail-actions">
                  <span>Run next</span>
                  <span>Request approval</span>
                  <span>Promote fact</span>
                </div>
              </div>

              <div className="operator-style-sample__detail-block">
                <div className="operator-style-sample__detail-block-head">
                  <h3>Operator note</h3>
                  <span>Gate-aware summary</span>
                </div>
                <p>
                  The shell is ready for a backend-served smoke pass. Remaining work is evidence packaging:
                  browser screenshots, readiness drift proof, and one approval transcript attached to the run.
                </p>
              </div>

              <div className="operator-style-sample__detail-block">
                <div className="operator-style-sample__detail-block-head">
                  <h3>Timeline</h3>
                  <span>Latest milestones</span>
                </div>
                <div className="operator-style-sample__timeline">
                  {PREVIEW_TIMELINE.map((item) => (
                    <div key={item.title} className="operator-style-sample__timeline-row">
                      <span className="operator-style-sample__timeline-dot" aria-hidden="true" />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="operator-style-sample__status-bar">
        <div className="operator-style-sample__status-inner">
          <span>
            <span className="operator-style-sample__live-dot" aria-hidden="true" /> Last sync: 21:18 MSK
          </span>
          <span>Mode: Served preview</span>
          <span>Artifact: static style reference</span>
        </div>
      </footer>
    </div>
  );
}
