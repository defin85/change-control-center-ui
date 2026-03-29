import { expect, test } from "@playwright/test";

test("shows a normalized contract failure when bootstrap payload is invalid", async ({ page }) => {
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ activeTenantId: "tenant-demo" }),
    });
  });

  await page.goto("/");

  await expect(page.getByText(/Control API contract failure/i)).toBeVisible();
});

test("shows a normalized HTTP failure when bootstrap request fails", async ({ page }) => {
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "bootstrap unavailable" }),
    });
  });

  await page.goto("/");

  await expect(page.getByText(/Control API request failed \(HTTP 503\)/i)).toBeVisible();
  await expect(page.getByText(/bootstrap unavailable/i)).toBeVisible();
});

test("renders the operator console surfaces and mandatory detail tabs", async ({ page }) => {
  await page.goto("/");
  const detailActions = page.locator(".detail-stage .detail-panel").first();

  await expect(page.locator('[data-platform-shell="workspace-page"]')).toBeVisible();
  await expect(page.locator('[data-platform-shell="master-detail"]')).toBeVisible();
  await expect(page.locator('[data-platform-shell="detail-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="operator-workbench"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="global-actions"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-context"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="control-queue"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-filter-context"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="inspector-surface"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="signal-summary-card"]')).toHaveCount(4);

  await page.getByRole("button", { name: /ch-146/i }).click();
  await expect(page.getByRole("button", { name: "New change" })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: "Run next step" })).toBeVisible();
  await expect(page.getByLabel("Search")).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Views", { exact: true })).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Filters", { exact: true })).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Chief policy", { exact: true })).toBeVisible();
  await expect(page.locator(".inspector-panel").getByText("Inspector", { exact: true })).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Saved slices", { exact: true })).toBeVisible();
  await expect(page.locator(".queue-panel").getByText("Control Queue", { exact: true })).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-filter-context"]').getByText("Active slice")).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-filter-context"]').getByText("Queue filter")).toBeVisible();
  await expect(page.locator('[data-platform-governance="queue-actions-closed"]')).toBeVisible();
  await expect(page.locator('[data-platform-action="saved-filters"]')).toBeDisabled();
  await expect(page.locator('[data-platform-action="export-report"]')).toBeDisabled();
  await expect(page.locator("header").getByRole("button", { name: "Run next step" })).toBeVisible();
  await expect(detailActions.getByRole("button", { name: "Open run studio" })).toHaveAttribute("aria-controls", "run-studio");
  await expect(detailActions.getByRole("button", { name: "Escalate" })).toBeVisible();
  await expect(detailActions.getByRole("button", { name: "Mark blocked by spec" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("button", { name: "Traceability" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("button", { name: "Gaps" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("button", { name: "Git" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("button", { name: "Chief" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("button", { name: "Clarifications" })).toBeVisible();

  const detailTabs = page.locator(".tab-list");

  await detailTabs.getByRole("button", { name: "Traceability" }).click();
  await expect(page.getByText("Requirement")).toBeVisible();
  await detailTabs.getByRole("button", { name: "Gaps" }).click();
  await expect(page.getByText("Severity")).toBeVisible();
  await detailTabs.getByRole("button", { name: "Git" }).click();
  await expect(page.getByText("Landing status")).toBeVisible();
  await detailTabs.getByRole("button", { name: "Chief" }).click();
  await expect(page.getByText("Chief History")).toBeVisible();
  await detailTabs.getByRole("button", { name: "Clarifications" }).click();
  await expect(page.getByRole("button", { name: /generate round/i })).toBeVisible();
});

test("creates a run and shows runtime lineage in run studio", async ({ page }) => {
  await page.goto("/");

  const detailActions = page.locator(".detail-stage .detail-panel").first();
  const runStudio = page.locator("#run-studio");

  await page.getByRole("button", { name: /ch-142/i }).click();
  await detailActions.getByRole("button", { name: "Runs" }).click();
  await page.getByRole("button", { name: /run-30/i }).click();

  await expect(runStudio.getByRole("heading", { name: "run-30" })).toBeVisible();
  await expect(runStudio.getByText("thr_seed_142_30", { exact: true })).toBeVisible();
  await expect(runStudio.getByText("turn_seed_142_30", { exact: true })).toBeVisible();
  await expect(runStudio.getByText(/^stdio$/)).toBeVisible();
  await expect(runStudio.getByText("Runtime Events", { exact: true })).toBeVisible();
  await expect(runStudio.getByText("No runtime events captured for this run.", { exact: true })).toBeVisible();
  await expect(runStudio.getByText("Approvals", { exact: true })).toBeVisible();
  await expect(runStudio.getByText("No approvals captured for this run.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Evidence" }).click();
  await expect(page.getByText("Compact review output")).toBeVisible();
});

test("persists clarification answers across reload", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-150/i }).click();
  await page.getByRole("button", { name: "Clarifications" }).click();
  await page.getByRole("button", { name: /generate round/i }).click();
  await page.getByLabel("Separate sidecar").first().check();
  await page.getByPlaceholder("Дополнительный комментарий").first().fill("Зафиксировать sidecar deployment.");
  await page.getByRole("button", { name: /submit answers/i }).click();

  await page.reload();
  await page.getByRole("button", { name: /ch-150/i }).click();
  await page.getByRole("button", { name: "Clarifications" }).click();

  await expect(page.getByText("Зафиксировать sidecar deployment.")).toBeVisible();
});

test("restores route-addressable operator context after reload", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  await page.getByLabel("Search").fill("ch-142");
  await page.getByRole("button", { name: "Runs" }).click();
  await page.getByRole("button", { name: /run-30/i }).click();

  await expect(page).toHaveURL(/change=ch-142/);
  await expect(page).toHaveURL(/run=run-30/);
  await expect(page).toHaveURL(/q=ch-142/);
  await expect(page).toHaveURL(/tab=runs/);

  await page.reload();

  await expect(page.getByLabel("Search")).toHaveValue("ch-142");
  await expect(page.locator(".tab-list button.active")).toHaveText("Runs");
  await expect(page.locator("#run-studio").getByRole("heading", { name: "run-30" })).toBeVisible();
});

test("uses a drawer-style detail workspace on narrow viewports", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });
  await page.goto("/");

  const detailWorkspace = page.locator('[data-platform-shell="detail-workspace"]');

  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "false");
  await page.getByRole("button", { name: /ch-142/i }).click();
  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "true");
  await expect(detailWorkspace.getByRole("button", { name: "Close workspace" })).toBeVisible();

  await detailWorkspace.getByRole("button", { name: "Close workspace" }).click();

  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "false");
  await expect(page).not.toHaveURL(/change=ch-142/);
});

test("operator actions create a change, mutate its state, and resolve runtime approvals", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "New change" }).click();
  await page.getByRole("button", { name: /^ch-.* New change/ }).click();
  await expect(page.getByRole("heading", { name: "New change" })).toBeVisible();
  await expect(page.locator(".status-bar")).toContainText("draft");

  const detailActions = page.locator(".detail-stage .detail-panel").first();
  await detailActions.getByRole("button", { name: "Escalate" }).click();
  await expect(page.locator(".status-bar")).toContainText("Escalated");
  await expect(page.locator(".status-bar")).toContainText("Operator intervention required");

  await detailActions.getByRole("button", { name: "Mark blocked by spec" }).click();
  await expect(page.locator(".status-bar")).toContainText("Blocked by spec");
  await expect(page.locator(".status-bar")).toContainText("Clarify specification");

  await detailActions.getByRole("button", { name: "Run next step" }).click();

  const runStudio = page.locator("#run-studio");
  await expect(runStudio.getByRole("button", { name: "Accept" })).toBeVisible();
  await runStudio.getByRole("button", { name: "Accept" }).click();

  await expect(runStudio.getByText(/accepted/i)).toBeVisible();
  await expect(runStudio.getByText("serverRequest/resolved")).toBeVisible();
});
