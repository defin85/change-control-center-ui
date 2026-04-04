import type { RepositoryCatalogEntry } from "../../types";
import { PlatformPrimitives } from "../foundation";
import {
  buildRepositoryCatalogCounts,
  describeRepositoryCatalogFilter,
  REPOSITORY_CATALOG_FILTERS,
  type RepositoryCatalogFilterId,
} from "../server-state";

type RepositoryCatalogRailProps = {
  entries: RepositoryCatalogEntry[];
  activeFilterId: RepositoryCatalogFilterId;
  onSelectFilter: (filterId: RepositoryCatalogFilterId) => void;
};

export function RepositoryCatalogRail({
  entries,
  activeFilterId,
  onSelectFilter,
}: RepositoryCatalogRailProps) {
  const counts = buildRepositoryCatalogCounts(entries);

  return (
    <aside className="operator-rail" data-platform-surface="repository-catalog-context">
      <section className="panel rail-block" data-platform-surface="repository-catalog-filters">
        <div className="panel-head compact">
          <div>
            <p className="block-label">Repositories</p>
            <h2>Portfolio slices</h2>
          </div>
        </div>
        <div className="chip-grid">
          {REPOSITORY_CATALOG_FILTERS.map((filter) => (
            <PlatformPrimitives.Button
              key={filter.id}
              type="button"
              className={`filter-chip ${activeFilterId === filter.id ? "active" : ""}`}
              data-platform-foundation="base-ui-repository-filter-action"
              onClick={() => onSelectFilter(filter.id)}
            >
              <strong>{filter.label}</strong>
              <small>{filter.hint}</small>
              <span className="filter-chip-count">{counts[filter.id]}</span>
            </PlatformPrimitives.Button>
          ))}
        </div>
      </section>

      <section className="panel rail-block" data-platform-surface="repository-catalog-policy">
        <div className="panel-head compact">
          <div>
            <p className="block-label">Catalog policy</p>
            <h2>Backend-owned signals</h2>
          </div>
        </div>
        <div className="policy-card">
          <dl>
            <div>
              <dt>Selection</dt>
              <dd>Repository selection updates the active tenant through shared orchestration.</dd>
            </div>
            <div>
              <dt>Signals</dt>
              <dd>{describeRepositoryCatalogFilter(activeFilterId).hint}</dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd>Browse, compare, and create repositories without leaving the operator shell.</dd>
            </div>
          </dl>
        </div>
      </section>
    </aside>
  );
}
