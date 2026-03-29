import { expect, test } from "@playwright/test";

test("renders the operator console surfaces and mandatory detail tabs", async ({ page }) => {
  await page.goto("/");
  const detailActions = page.locator(".detail-stage .detail-panel").first();

  await expect(page.locator('[data-platform-shell="workspace-page"]')).toBeVisible();
  await expect(page.locator('[data-platform-shell="master-detail"]')).toBeVisible();
  await expect(page.locator('[data-platform-shell="detail-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="operator-workbench"]')).toBeVisible();

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
  await expect(page.locator("header").getByRole("button", { name: "Run next step" })).toBeVisible();
  await expect(detailActions.getByRole("button", { name: "Open run studio" })).toBeVisible();
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
