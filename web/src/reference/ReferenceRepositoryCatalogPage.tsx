import { useEffect, useMemo, useState } from "react";

import {
  buildOperatorRouteHref,
  filterRepositoryCatalog,
  OperatorWorkbenchProps,
  PlatformPrimitives,
  REPOSITORY_CATALOG_FILTERS,
  RepositoryAuthoringDialog,
  RepositoryCatalogProfile,
  RepositoryCatalogWorkspaceShell,
  StatusBadge,
  type RepositoryCatalogFilterId,
  useAsyncWorkflowCommandMachine,
  WorkspacePageShell,
} from "../platform";
import type { RepositoryCatalogEntry } from "../types";

import "./OperatorStyleSamplePage.css";
import "./ReferenceRepositoryCatalogPage.css";

type CatalogMetric = {
  label: string;
  value: string;
  meta: string;
};

export function ReferenceRepositoryCatalogPage({
  activeTenantId,
  activeFilterId,
  hasExplicitCatalogSelection,
  repositoryCatalog,
  searchQuery,
  toast,
  onCreateTenant,
  onCreateChange,
  onSearchQueryChange,
  onSelectCatalogTenant,
  onClearCatalogSelection,
  onSelectFilter,
}: OperatorWorkbenchProps) {
  const [isCompactViewport, setIsCompactViewport] = useState(() => window.matchMedia("(max-width: 1080px)").matches);
  const [isCreateTenantDialogOpen, setIsCreateTenantDialogOpen] = useState(false);
  const catalogSelectionWorkflow = useAsyncWorkflowCommandMachine();

  const catalogFilterId = resolveCatalogFilterId(activeFilterId);
  const activeFilter = REPOSITORY_CATALOG_FILTERS.find((filter) => filter.id === catalogFilterId) ?? REPOSITORY_CATALOG_FILTERS[0];
  const activeEntry = repositoryCatalog.find((entry) => entry.tenantId === activeTenantId) ?? null;
  const filteredEntries = useMemo(
    () =>
      filterRepositoryCatalog(repositoryCatalog, {
        activeFilterId: catalogFilterId,
        searchQuery,
      }),
    [catalogFilterId, repositoryCatalog, searchQuery],
  );
  const metrics = buildCatalogMetrics(filteredEntries);
  const selectedTenantId = isCompactViewport && !hasExplicitCatalogSelection ? null : activeTenantId;
  const isRepositoryWorkspaceOpen = Boolean(activeEntry) && hasExplicitCatalogSelection;
  const catalogHref = buildOperatorRouteHref(window.location.pathname, {
    workspaceMode: "catalog",
    tenantId: hasExplicitCatalogSelection ? activeTenantId : undefined,
    filterId: catalogFilterId === "all" ? undefined : catalogFilterId,
    searchQuery: searchQuery || undefined,
  });
  const liveWorkbenchHref = buildOperatorRouteHref(window.location.pathname, {
    workspaceMode: "queue",
    tenantId: activeTenantId,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1080px)");
    const handleChange = (event: MediaQueryListEvent) => setIsCompactViewport(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  async function handleSelectRepository(tenantId: string) {
    if (tenantId === activeTenantId && hasExplicitCatalogSelection) {
      catalogSelectionWorkflow.clearError();
      return;
    }

    await catalogSelectionWorkflow.runCommand({
      label: `Open repository ${repositoryCatalog.find((entry) => entry.tenantId === tenantId)?.name ?? tenantId}`,
      execute: async () => {
        await onSelectCatalogTenant(tenantId);
      },
    });
  }

  function handleOpenQueue() {
    const nextHref = buildOperatorRouteHref(window.location.pathname, {
      workspaceMode: "queue",
      tenantId: activeTenantId,
    });
    window.location.assign(nextHref);
  }

  const repositoryWorkspace = (
    <RepositoryCatalogWorkspaceShell
      isCompactViewport={isCompactViewport}
      isOpen={isRepositoryWorkspaceOpen && Boolean(activeEntry)}
      selectedTenantId={activeTenantId}
      onClose={() => {
        catalogSelectionWorkflow.clearError();
        onClearCatalogSelection();
      }}
      detail={
        <RepositoryCatalogProfile
          entry={activeEntry}
          onOpenQueue={handleOpenQueue}
          onCreateChange={onCreateChange}
          onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
        />
      }
    />
  );

  return (
    <WorkspacePageShell
      header={null}
      workspace={
        <div className="operator-style-sample reference-catalog-shell" data-platform-surface="repository-catalog-workspace">
          <header className="operator-style-sample__masthead">
            <div className="operator-style-sample__masthead-inner">
              <div className="operator-style-sample__brand">
                <div className="operator-style-sample__brand-mark" aria-hidden="true">
                  CC
                </div>
                <div>
                  <strong>Change Control Center</strong>
                  <p>Repository portfolio</p>
                </div>
              </div>
              <nav className="operator-style-sample__nav" aria-label="Primary sections">
                <a className="operator-style-sample__nav-pill" data-platform-action="workspace-queue" href={window.location.pathname}>
                  Workbench
                </a>
                <a
                  className="operator-style-sample__nav-pill operator-style-sample__nav-pill--active"
                  data-platform-action="workspace-catalog"
                  aria-current="page"
                  href={catalogHref}
                >
                  Repositories
                </a>
                <span className="operator-style-sample__nav-pill">Runs</span>
                <span className="operator-style-sample__nav-pill">Governance</span>
              </nav>
              <div className="operator-style-sample__actions">
                <span className="operator-style-sample__ghost-chip">codex-lb style</span>
                <a className="operator-style-sample__ghost-chip operator-style-sample__ghost-chip--link" href={liveWorkbenchHref}>
                  Open live workbench
                </a>
              </div>
            </div>
          </header>

          <div className="operator-style-sample__page">
            <section className="operator-style-sample__page-header">
              <div>
                <h1>Repository Portfolio</h1>
                <p>Backend-owned catalog for choosing where operator attention should move next.</p>
              </div>
              <div className="operator-style-sample__header-note">
                <span className="operator-style-sample__live-dot" aria-hidden="true" />
                Served repository mode
              </div>
            </section>

            <section className="reference-catalog-utility reference-panel" data-platform-surface="repository-catalog-utility">
              <label className="reference-queue-search">
                <span>Search</span>
                <input
                  aria-label="Search"
                  className="reference-queue-search-input"
                  name="search"
                  placeholder="repository, path, attention"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
              </label>
              <div className="reference-queue-chip-stack">
                {REPOSITORY_CATALOG_FILTERS.map((filter) => (
                  <PlatformPrimitives.Button
                    key={filter.id}
                    type="button"
                    className={`reference-chip-button ${catalogFilterId === filter.id ? "active" : ""}`}
                    onClick={() => onSelectFilter(filter.id)}
                  >
                    <span>{filter.label}</span>
                  </PlatformPrimitives.Button>
                ))}
              </div>
              <div className="reference-panel-actions">
                <button
                  type="button"
                  className="primary-button"
                  data-platform-action="new-repository"
                  onClick={() => setIsCreateTenantDialogOpen(true)}
                >
                  New repository
                </button>
              </div>
              <div className="reference-catalog-utility-meta">
                <strong>{activeFilter.label}</strong>
                <span>{activeFilter.hint}</span>
              </div>
            </section>

            <section className="reference-catalog-metrics" aria-label="Repository metrics" data-platform-surface="repository-catalog-metrics">
              {metrics.map((metric) => (
                <article key={metric.label} className="reference-catalog-metric">
                  <span className="operator-style-sample__eyebrow">{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.meta}</p>
                </article>
              ))}
            </section>

            <section className="operator-style-sample__section">
              <div className="operator-style-sample__section-heading">
                <h2>Repositories</h2>
                <div className="operator-style-sample__section-rule" aria-hidden="true" />
              </div>
              <div className="reference-catalog-stage" data-platform-surface="repository-overview">
                <RepositoryWorklist
                  activeFilterLabel={activeFilter.label}
                  entries={filteredEntries}
                  isSelectionPending={catalogSelectionWorkflow.isPending}
                  selectedTenantId={selectedTenantId}
                  selectionError={catalogSelectionWorkflow.error}
                  selectionPendingLabel={catalogSelectionWorkflow.activeLabel}
                  onOpenCreateTenant={() => setIsCreateTenantDialogOpen(true)}
                  onSelectTenant={(tenantId) => {
                    void handleSelectRepository(tenantId);
                  }}
                />
                {!isCompactViewport ? repositoryWorkspace : null}
              </div>
            </section>
          </div>

          <footer className="operator-style-sample__status-bar">
            <div className="operator-style-sample__status-inner">
              <span>
                <span className="operator-style-sample__live-dot" aria-hidden="true" /> Workspace: catalog
              </span>
              <span>Repository: {activeEntry?.name ?? activeTenantId}</span>
              <span>Search: {searchQuery.trim() || "No active query"}</span>
            </div>
          </footer>
        </div>
      }
      detailWorkspace={isCompactViewport ? repositoryWorkspace : null}
      toast={
        <>
          <RepositoryAuthoringDialog
            open={isCreateTenantDialogOpen}
            onOpenChange={setIsCreateTenantDialogOpen}
            onCreateTenant={onCreateTenant}
          />
          {toast ? <div className="toast">{toast}</div> : null}
        </>
      }
    />
  );
}

type RepositoryWorklistProps = {
  activeFilterLabel: string;
  entries: RepositoryCatalogEntry[];
  selectedTenantId: string | null;
  isSelectionPending: boolean;
  selectionPendingLabel: string | null;
  selectionError: string | null;
  onSelectTenant: (tenantId: string) => void;
  onOpenCreateTenant: () => void;
};

function RepositoryWorklist({
  activeFilterLabel,
  entries,
  selectedTenantId,
  isSelectionPending,
  selectionPendingLabel,
  selectionError,
  onSelectTenant,
  onOpenCreateTenant,
}: RepositoryWorklistProps) {
  return (
    <section className="reference-panel reference-catalog-worklist" data-platform-surface="repository-catalog">
      <div className="reference-panel-heading reference-panel-heading--queue">
        <div>
          <p className="eyebrow">Repository worklist</p>
          <h2>{activeFilterLabel}</h2>
          <p className="subtitle">{entries.length} repositories match the current portfolio slice</p>
        </div>
      </div>

      <div className="reference-queue-table">
        {selectionError ? (
          <p className="governance-note" data-platform-governance="catalog-selection-error">
            <strong>Repository selection failed.</strong> {selectionError}
          </p>
        ) : null}
        {isSelectionPending ? (
          <p className="governance-note" data-platform-governance="catalog-selection-pending">
            {selectionPendingLabel ?? "Opening repository workspace..."}
          </p>
        ) : null}
        {entries.length === 0 ? (
          <div className="empty-state">
            No repositories match the current slice. Clear search or register a new repository.
            <div className="empty-state-actions">
              <button type="button" className="ghost-button" onClick={onOpenCreateTenant}>
                New repository
              </button>
            </div>
          </div>
        ) : (
          <div className="reference-queue-list reference-repository-list">
            {entries.map((entry) => (
              <PlatformPrimitives.Button
                key={entry.tenantId}
                type="button"
                className={`reference-queue-row reference-repository-row ${selectedTenantId === entry.tenantId ? "active" : ""}`}
                data-platform-foundation="base-ui-repository-row"
                data-tenant-id={entry.tenantId}
                aria-pressed={selectedTenantId === entry.tenantId}
                disabled={isSelectionPending}
                onClick={() => onSelectTenant(entry.tenantId)}
              >
                <div className="reference-queue-row-main" data-platform-compact-field="repository">
                  <span className="reference-compact-label" data-platform-compact-label>
                    Repository
                  </span>
                  <div className="reference-queue-row-heading">
                    <strong>{entry.name}</strong>
                    <StatusBadge status={entry.attentionState} label={formatAttentionLabel(entry.attentionState)} />
                  </div>
                  <p>{entry.description || "No repository description yet."}</p>
                  <div className="reference-queue-row-meta">
                    <span>{entry.repoPath}</span>
                  </div>
                </div>
                <div className="reference-queue-row-side">
                  <div data-platform-compact-field="recent">
                    <span className="reference-compact-label" data-platform-compact-label>
                      Recent
                    </span>
                    <strong>{entry.lastActivity}</strong>
                    <p>{entry.featuredChange ? `Latest activity around ${entry.featuredChange.id}.` : "No recent repository activity."}</p>
                  </div>
                  <div>
                    <span className="reference-queue-row-label reference-compact-label" data-platform-compact-label>
                      Next
                    </span>
                    <strong>{entry.nextRecommendedAction}</strong>
                  </div>
                  <div>
                    <span className="reference-queue-row-label">Load</span>
                    <p>
                      {entry.changeCount} changes · {entry.activeChangeCount} active · {entry.blockedChangeCount} blocked
                    </p>
                  </div>
                  <div className="reference-queue-row-summary">
                    <span>{entry.readyChangeCount} ready</span>
                    <span>{entry.featuredChange?.id ?? "No featured change"}</span>
                  </div>
                </div>
              </PlatformPrimitives.Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function buildCatalogMetrics(entries: RepositoryCatalogEntry[]): CatalogMetric[] {
  const activeLoad = entries.reduce((sum, entry) => sum + entry.activeChangeCount, 0);
  const blockedCount = entries.filter((entry) => entry.attentionState === "blocked").length;
  const coldStartCount = entries.filter((entry) => entry.changeCount === 0 || entry.attentionState === "needs_setup").length;
  const readyCount = entries.reduce((sum, entry) => sum + entry.readyChangeCount, 0);

  return [
    {
      label: "Repositories",
      value: String(entries.length),
      meta: blockedCount > 0 ? `${blockedCount} need operator attention` : "Portfolio slice is stable",
    },
    {
      label: "Active load",
      value: String(activeLoad),
      meta: readyCount > 0 ? `${readyCount} ready for queue handoff` : "No ready backlog in this slice",
    },
    {
      label: "Blocked repos",
      value: String(blockedCount),
      meta: blockedCount > 0 ? "At least one repository is currently blocked" : "No blocked repositories right now",
    },
    {
      label: "Cold starts",
      value: String(coldStartCount),
      meta: coldStartCount > 0 ? "Repositories still need their first change" : "Every repository has active history",
    },
  ];
}

function resolveCatalogFilterId(filterId: string): RepositoryCatalogFilterId {
  return REPOSITORY_CATALOG_FILTERS.some((filter) => filter.id === filterId)
    ? (filterId as RepositoryCatalogFilterId)
    : "all";
}

function formatAttentionLabel(attentionState: RepositoryCatalogEntry["attentionState"]) {
  switch (attentionState) {
    case "needs_setup":
      return "Needs setup";
    case "blocked":
      return "Blocked";
    case "quiet":
      return "Quiet";
    default:
      return "Active";
  }
}
