import type { ChangeEvent, ReactNode } from "react";

import "../../reference/OperatorStyleSamplePage.css";
import { ReferenceRepositoryCatalogPage } from "../../reference/ReferenceRepositoryCatalogPage";
import "./ShellBootstrapApp.css";

import { useShellBootstrapController, type OperatorWorkspaceMode } from "../navigation";

import { WorkspacePageShell } from "./WorkspacePageShell";

const WORKSPACE_META: Record<
  OperatorWorkspaceMode,
  {
    pageTitle: string;
    pageDescription: string;
    panelTitle: string;
    panelBody: string;
    rolloutChangeId: string;
  }
> = {
  queue: {
    pageTitle: "Functional Workbench",
    pageDescription: "The backend-owned shell bootstrap is live. Repositories now ship as the first functional workspace, while queue rows and selected-change hydration land in the next rollout steps.",
    panelTitle: "Queue scaffold",
    panelBody:
      "Tenant, workspace, query, and repository handoff state already hydrate from the backend bootstrap contract. The live queue worklist and selected-change workspace land in 04 and 05.",
    rolloutChangeId: "04-add-functional-tenant-queue-workspace",
  },
  catalog: {
    pageTitle: "Repository Portfolio",
    pageDescription: "Repositories now ship as the first backend-owned functional workspace inside the codex-lb shell.",
    panelTitle: "Functional catalog",
    panelBody:
      "Repository selection, authoring, and queue handoff now stay inside the shared shell controller and backend-owned bootstrap contract.",
    rolloutChangeId: "03-add-functional-repository-catalog-workspace",
  },
  runs: {
    pageTitle: "Runs Route Scaffold",
    pageDescription: "The shell can now hold canonical runs workspace intent while keeping bootstrap, tenant, and search hydration shared.",
    panelTitle: "Runs scaffold",
    panelBody:
      "Top-level run monitoring, run detail, and owning-change handoff still land later in 06. This change only establishes the shared shell route controller.",
    rolloutChangeId: "06-add-runs-workspace-and-run-detail-handoff",
  },
};

const ROLLOUT_STEPS = [
  {
    id: "03-add-functional-repository-catalog-workspace",
    title: "Repositories",
    detail: "Shipped: backend-owned repository workspace with selection, authoring, compact drawer behavior, and queue handoff.",
  },
  {
    id: "04-add-functional-tenant-queue-workspace",
    title: "Queue",
    detail: "Attach the default workbench to tenant-scoped backend change summaries and canonical queue selection.",
  },
  {
    id: "05-add-selected-change-detail-workspace",
    title: "Selected change",
    detail: "Hydrate the change-detail workspace from backend contracts instead of placeholder shell chrome.",
  },
  {
    id: "06-add-runs-workspace-and-run-detail-handoff",
    title: "Runs",
    detail: "Restore top-level runs monitoring and explicit handoff back to the owning change.",
  },
] as const;

export function ShellBootstrapApp() {
  const controller = useShellBootstrapController();

  if (controller.status === "loading") {
    return <BootstrapShellStatus heading="Hydrating operator shell" body="Requesting backend-owned bootstrap state before any functional shell route is declared ready." />;
  }

  if (controller.status === "error") {
    return (
      <BootstrapShellStatus
        heading="Operator shell bootstrap failed"
        body={controller.error}
        actions={
          <button type="button" className="primary-button" onClick={controller.retry}>
            Retry bootstrap
          </button>
        }
      />
    );
  }

  const {
    bootstrap,
    routeState,
    activeRepositoryEntry,
    activeTenant,
    hasExplicitCatalogSelection,
    toast,
  } = controller;

  if (routeState.workspaceMode === "catalog") {
    return (
      <ReferenceRepositoryCatalogPage
        activeTenantId={routeState.tenantId}
        activeFilterId={routeState.filterId}
        buildWorkspaceHref={controller.buildWorkspaceHref}
        hasExplicitCatalogSelection={hasExplicitCatalogSelection}
        repositoryCatalog={bootstrap.repositoryCatalog}
        searchQuery={routeState.searchQuery}
        toast={toast}
        onWorkspaceModeChange={controller.setWorkspaceMode}
        onCreateTenant={controller.createTenant}
        onCreateChange={controller.createChange}
        onOpenQueue={() => controller.setWorkspaceMode("queue")}
        onSearchQueryChange={controller.setSearchQuery}
        onSelectCatalogTenant={controller.selectCatalogTenant}
        onClearCatalogSelection={controller.clearCatalogSelection}
        onSelectFilter={controller.setCatalogFilter}
      />
    );
  }

  const workspaceMeta = WORKSPACE_META[routeState.workspaceMode];
  const visibleTenantLabel = activeTenant?.name ?? routeState.tenantId;
  const shellContextFacts = [
    { label: "Route workspace", value: routeState.workspaceMode },
    { label: "Tenant", value: visibleTenantLabel },
    { label: "Repo path", value: activeTenant?.repoPath ?? "Unknown tenant" },
    { label: "Search", value: routeState.searchQuery || "No active query" },
  ];
  const metrics = [
    { label: "Tenants", value: String(bootstrap.tenants.length), meta: "Backend-owned workspace roster" },
    { label: "Repositories", value: String(bootstrap.repositoryCatalog.length), meta: "Portfolio entries from bootstrap" },
    {
      label: "Active tenant changes",
      value: String(activeRepositoryEntry?.changeCount ?? 0),
      meta: activeRepositoryEntry?.nextRecommendedAction ?? "No repository context yet",
    },
    {
      label: "Attention state",
      value: formatAttentionState(activeRepositoryEntry?.attentionState ?? "quiet"),
      meta: activeRepositoryEntry?.lastActivity ?? "No recent activity recorded",
    },
  ];

  return (
    <WorkspacePageShell
      header={
        <header className="operator-style-sample__masthead">
          <div className="operator-style-sample__masthead-inner">
            <div className="operator-style-sample__brand">
              <div className="operator-style-sample__brand-mark" aria-hidden="true">
                CC
              </div>
              <div>
                <strong>Change Control Center</strong>
                <p>Functional shell bootstrap</p>
              </div>
            </div>
            <nav className="operator-style-sample__nav" aria-label="Primary sections">
              {(["queue", "catalog", "runs"] as OperatorWorkspaceMode[]).map((workspaceMode) => (
                <a
                  key={workspaceMode}
                  className={`operator-style-sample__nav-pill${routeState.workspaceMode === workspaceMode ? " operator-style-sample__nav-pill--active" : ""}`}
                  aria-current={routeState.workspaceMode === workspaceMode ? "page" : undefined}
                  href={controller.buildWorkspaceHref(workspaceMode)}
                  onClick={(event) => {
                    event.preventDefault();
                    controller.setWorkspaceMode(workspaceMode);
                  }}
                >
                  {formatWorkspaceLabel(workspaceMode)}
                </a>
              ))}
              <span className="operator-style-sample__nav-pill">Governance</span>
            </nav>
            <div className="operator-style-sample__actions">
              <span className="operator-style-sample__ghost-chip">functional shell</span>
              <span className="operator-style-sample__ghost-chip">{visibleTenantLabel}</span>
            </div>
          </div>
        </header>
      }
      workspace={
        <div className="workbench-page bootstrap-shell-page" data-platform-surface="functional-shell">
          <section className="reference-page-header">
            <div>
              <h1>{workspaceMeta.pageTitle}</h1>
              <p>{workspaceMeta.pageDescription}</p>
            </div>
            <div className="reference-header-note">
              <span className="reference-live-dot" aria-hidden="true" />
              Backend-owned bootstrap ready
            </div>
          </section>

          <section className="reference-panel bootstrap-shell-toolbar" data-platform-surface="functional-shell-toolbar">
            <label className="bootstrap-shell-toolbar__field">
              <span>Tenant</span>
              <select
                aria-label="Tenant"
                className="bootstrap-shell-toolbar__select"
                value={routeState.tenantId}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => controller.setTenantId(event.target.value)}
              >
                {bootstrap.tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="bootstrap-shell-toolbar__field">
              <span>Search</span>
              <input
                aria-label="Search"
                className="bootstrap-shell-toolbar__input"
                name="shell-search"
                placeholder="tenant, workspace, next step"
                type="search"
                value={routeState.searchQuery}
                onChange={(event) => controller.setSearchQuery(event.target.value)}
              />
            </label>

            <div className="bootstrap-shell-toolbar__summary">
              Canonical route: {routeState.workspaceMode}
              {routeState.searchQuery ? ` · q=${routeState.searchQuery}` : ""}
            </div>
          </section>

          <section className="reference-metrics-grid" aria-label="Shell metrics" data-platform-surface="functional-shell-metrics">
            {metrics.map((metric) => (
              <article key={metric.label} className="reference-metric-card">
                <span className="eyebrow">{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.meta}</p>
              </article>
            ))}
          </section>

          <section className="bootstrap-shell-context-grid">
            <section className="reference-panel" data-platform-surface="shell-context">
              <div className="reference-panel-heading">
                <div>
                  <p className="eyebrow">Shell context</p>
                  <h2>Hydration source</h2>
                  <p>The default route now renders backend-owned shell chrome from one shared bootstrap payload.</p>
                </div>
              </div>
              <dl className="reference-fact-list">
                {shellContextFacts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="bootstrap-shell-route-note">
                The shared controller strips unsupported live-workbench params instead of silently reviving removed fallback routes.
              </p>
            </section>

            <section className="reference-panel" data-platform-surface="shell-rollout">
              <div className="reference-panel-heading">
                <div>
                  <p className="eyebrow">Rollout</p>
                  <h2>Next shell slices</h2>
                  <p>The bootstrap controller lands first so later workspaces reuse one route and hydration boundary.</p>
                </div>
              </div>
              <ol className="bootstrap-shell-rollout">
                {ROLLOUT_STEPS.map((step) => (
                  <li key={step.id}>
                    <span className="bootstrap-shell-rollout__step-label">{step.id}</span>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </li>
                ))}
              </ol>
            </section>
          </section>

          <section className="reference-section">
            <div className="reference-section-heading">
              <h2>Workspace scaffold</h2>
              <div className="reference-section-rule" aria-hidden="true" />
            </div>
            <div className="bootstrap-shell-stage-grid">
              <section className="reference-panel bootstrap-shell-stage-card" data-platform-surface="workspace-scaffold">
                <div className="reference-panel-heading">
                  <div>
                    <p className="eyebrow">Current workspace</p>
                    <h2>{workspaceMeta.panelTitle}</h2>
                    <p>{workspaceMeta.panelBody}</p>
                  </div>
                </div>
                <div className="bootstrap-shell-chip-row">
                  <span className="bootstrap-shell-chip bootstrap-shell-chip--active">{formatWorkspaceLabel(routeState.workspaceMode)}</span>
                  <span className="bootstrap-shell-chip">Tenant: {visibleTenantLabel}</span>
                  <span className="bootstrap-shell-chip">Next change: {workspaceMeta.rolloutChangeId}</span>
                </div>
                <div className="empty-state">
                  This build establishes one shared hydration and route-state controller. Workspace-specific data surfaces arrive in later ordered changes.
                </div>
              </section>

              <section className="reference-panel bootstrap-shell-stage-card" data-platform-surface="workspace-guardrails">
                <div className="reference-panel-heading">
                  <div>
                    <p className="eyebrow">Guardrails</p>
                    <h2>Fail-closed shell behavior</h2>
                    <p>The shell no longer invents client-only truth when bootstrap or route hydration cannot prove valid backend context.</p>
                  </div>
                </div>
                <dl className="reference-fact-list">
                  <div>
                    <dt>Bootstrap contract</dt>
                    <dd>/api/bootstrap</dd>
                  </div>
                  <div>
                    <dt>Supported route params</dt>
                    <dd>workspace, tenant, filter, q</dd>
                  </div>
                  <div>
                    <dt>Unsupported params</dt>
                    <dd>legacy/workbench-only state is normalized away</dd>
                  </div>
                </dl>
                <div className="bootstrap-shell-chip-row">
                  {bootstrap.views.map((view) => (
                    <span key={view.id} className="bootstrap-shell-chip">
                      {view.label}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <footer className="operator-style-sample__status-bar">
            <div className="operator-style-sample__status-inner">
              <span>
                <span className="operator-style-sample__live-dot" aria-hidden="true" /> Mode: Functional shell
              </span>
              <span>Workspace: {formatWorkspaceLabel(routeState.workspaceMode)}</span>
              <span>Hydration: backend bootstrap</span>
            </div>
          </footer>
        </div>
      }
    />
  );
}

type BootstrapShellStatusProps = {
  heading: string;
  body: string;
  actions?: ReactNode;
};

function BootstrapShellStatus({ heading, body, actions }: BootstrapShellStatusProps) {
  return (
    <WorkspacePageShell
      header={
        <header className="operator-style-sample__masthead">
          <div className="operator-style-sample__masthead-inner">
            <div className="operator-style-sample__brand">
              <div className="operator-style-sample__brand-mark" aria-hidden="true">
                CC
              </div>
              <div>
                <strong>Change Control Center</strong>
                <p>Functional shell bootstrap</p>
              </div>
            </div>
            <div className="operator-style-sample__actions">
              <span className="operator-style-sample__ghost-chip">bootstrap controller</span>
            </div>
          </div>
        </header>
      }
      workspace={
        <div className="bootstrap-shell-status" data-platform-surface="shell-bootstrap-status">
          <section className="reference-panel" data-platform-surface={actions ? "shell-bootstrap-error" : "shell-bootstrap-loading"}>
            <div className="reference-panel-heading">
              <div>
                <p className="eyebrow">Operator shell</p>
                <h2>{heading}</h2>
                <p>{body}</p>
              </div>
            </div>
            <div className="empty-state">
              The backend-served route stays explicit about hydration state instead of silently falling back to client-only sample UI.
              {actions ? <div className="empty-state-actions">{actions}</div> : null}
            </div>
          </section>
        </div>
      }
    />
  );
}

function formatAttentionState(attentionState: string) {
  switch (attentionState) {
    case "needs_setup":
      return "Needs setup";
    case "blocked":
      return "Blocked";
    case "active":
      return "Active";
    default:
      return "Quiet";
  }
}

function formatWorkspaceLabel(workspaceMode: OperatorWorkspaceMode) {
  switch (workspaceMode) {
    case "catalog":
      return "Repositories";
    case "runs":
      return "Runs";
    default:
      return "Workbench";
  }
}
