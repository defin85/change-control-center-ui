import type { BootstrapResponse } from "../../types";

type WorkbenchHeaderProps = {
  activeTenantId: string;
  searchQuery: string;
  tenants: BootstrapResponse["tenants"];
  onSearchQueryChange: (value: string) => void;
  onCreateChange: () => Promise<void>;
  onRunNext: () => Promise<void>;
  onTenantChange: (tenantId: string) => Promise<void>;
};

export function WorkbenchHeader({
  activeTenantId,
  searchQuery,
  tenants,
  onSearchQueryChange,
  onCreateChange,
  onRunNext,
  onTenantChange,
}: WorkbenchHeaderProps) {
  return (
    <header className="topbar" data-platform-surface="workbench-header">
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
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="change, requirement, blocker"
            type="search"
          />
        </label>
        <button type="button" className="ghost-button" onClick={() => void onCreateChange()}>
          New change
        </button>
        <button type="button" className="primary-button" onClick={() => void onRunNext()}>
          Run next step
        </button>
        <label className="tenant-picker">
          <span>Tenant</span>
          <select value={activeTenantId} onChange={(event) => void onTenantChange(event.target.value)}>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
