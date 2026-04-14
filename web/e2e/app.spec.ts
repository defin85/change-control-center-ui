import { expect, test, type Page } from "@playwright/test";

import { gotoShippedApp, reloadApp } from "./support/navigation";

async function expectTenantQueueWorkspace(page: Page, tenantLabel: string) {
  await expect(page.locator('[data-platform-surface="tenant-queue-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="tenant-queue-list"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Functional Workbench" })).toBeVisible();
  await expect(page.getByText("Served queue mode")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Workbench");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Repositories");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Runs");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Governance");
  await expect(page.getByText(`Tenant: ${tenantLabel}`)).toBeVisible();
  await expect(page.getByText("backend-owned queue", { exact: true })).toBeVisible();
  await expect(page.getByText("Backend-served default shell")).toHaveCount(0);
}

async function expectRunsWorkspace(page: Page, tenantLabel: string) {
  await expect(page.locator('[data-platform-surface="tenant-runs-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="tenant-runs-list"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Runs Workspace" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Workbench");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Repositories");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Runs");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Governance");
  await expect(page.getByText(`Tenant: ${tenantLabel}`)).toBeVisible();
  await expect(page.getByText("backend-owned runs", { exact: true })).toBeVisible();
}

test("renders the functional tenant queue from backend bootstrap on the default route @smoke @platform", async ({
  page,
}) => {
  let bootstrapRequests = 0;
  let queueRequests = 0;

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/bootstrap") {
      bootstrapRequests += 1;
    }
    if (url.pathname === "/api/tenants/tenant-demo/changes") {
      queueRequests += 1;
    }
  });

  await gotoShippedApp(page);

  await expectTenantQueueWorkspace(page, "change-control-center-ui");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-change-id="ch-142"]')).toBeVisible();
  await expect.poll(() => bootstrapRequests).toBe(1);
  await expect.poll(() => queueRequests).toBe(1);
});

test("restores supported queue route state and strips unsupported params @smoke @platform", async ({
  page,
}) => {
  await gotoShippedApp(
    page,
    "/?legacyWorkbench=1&workspace=queue&tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-142&run=run-30&tab=gaps",
  );

  await expectTenantQueueWorkspace(page, "sandbox-repo");
  await expect(page.locator('[data-change-id="ch-201"]')).toBeVisible();
  await expect(page.locator('[data-platform-governance="queue-selection-repaired"]')).toContainText(
    "Selected change repaired.",
  );
  await expect(page.locator('[data-platform-governance="queue-selection-repaired"]')).toContainText(
    "ch-142 moved to ch-201",
  );
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "gaps",
    { timeout: 15000 },
  );
  await expect(page.getByText("No gaps are currently attached to this change.")).toBeVisible();
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-201&tab=gaps$/);
  await expect(page).not.toHaveURL(/legacyWorkbench|change=ch-142|run=/);

  await reloadApp(page);

  await expectTenantQueueWorkspace(page, "sandbox-repo");
  await expect(page.locator('[data-change-id="ch-201"]')).toBeVisible();
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-201&tab=gaps$/);
});

test("queue workspace supports selected-change handoff, filtering, and tenant switching @platform", async ({
  page,
}) => {
  let detailRequests = 0;

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/tenants/tenant-demo/changes/ch-142") {
      detailRequests += 1;
    }
  });

  await gotoShippedApp(page);

  await page.locator('[data-change-id="ch-142"]').click();
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Land the canonical operator shell",
  );
  await expect(page).toHaveURL(/\?change=ch-142$/);
  await expect(page.getByText("The canonical operator shell is live")).toBeVisible();
  await expect.poll(() => detailRequests).toBe(1);

  await page.getByRole("tab", { name: "Gaps" }).click();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "gaps",
  );
  await expect(page.getByText("Launcher dev profile can report ready while managed processes are already stopped.")).toBeVisible();
  await expect(page).toHaveURL(/\?change=ch-142&tab=gaps$/);
  await expect.poll(() => detailRequests).toBe(1);

  await page.getByRole("tab", { name: "Chief" }).click();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "chief",
  );
  await expect(page.getByText("Operator IA is stable")).toBeVisible();
  await expect(page).toHaveURL(/\?change=ch-142&tab=chief$/);

  await page.getByLabel("Search").fill("Codex Chief");
  await expect(page.locator('[data-change-id="ch-142"]')).toBeVisible();
  await expect(page.locator('[data-change-id="ch-150"]')).toHaveCount(0);
  await expect(page).toHaveURL(/q=Codex(?:\+|%20)Chief&change=ch-142&tab=chief$/);
  await expect.poll(() => detailRequests).toBe(1);

  await page.getByLabel("Search").fill("sandbox");
  await expect(page.locator('[data-platform-governance="queue-selection-cleared"]')).toContainText(
    "Selected change cleared.",
  );
  await expect(page.locator('[data-platform-governance="queue-selection-cleared"]')).toContainText(
    "ch-142 is not available because this queue slice is empty.",
  );
  await expect(page).toHaveURL(/\?q=sandbox$/);
  await expect(page.locator('[data-change-id="ch-142"]')).toHaveCount(0);
  await expect(page.getByText("No changes match the current queue slice.")).toBeVisible();

  await page.getByLabel("Tenant", { exact: true }).selectOption("tenant-sandbox");
  await expect(page.locator('[data-change-id="ch-201"]')).toBeVisible();
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&q=sandbox$/);

  await page.locator('[data-change-id="ch-201"]').click();
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&q=sandbox&change=ch-201$/);

  await page.locator('[data-platform-view="ready"]').click();
  await expect(page.locator('[data-change-id="ch-201"]')).toBeVisible();
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-201$/);
});

test("selected-change workspace preserves compact drawer behavior and queue context @platform", async ({
  page,
}) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await gotoShippedApp(page, "/?q=Codex%20Chief&change=ch-142&tab=chief");

  await expect(page.locator('[data-platform-shell="detail-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "true",
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Land the canonical operator shell",
  );
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "chief",
  );
  await expect(page.getByText("Operator IA is stable")).toBeVisible();

  await page.getByRole("button", { name: "Back to queue" }).click();

  await expect(page.locator('[data-platform-shell="detail-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "false",
  );
  await expect(page).toHaveURL(/q=Codex(?:\+|%20)Chief$/);
});

test("surfaces selected-change detail failure without reviving a hidden fallback @platform", async ({
  page,
}) => {
  let detailRequests = 0;

  await page.route("**/api/tenants/tenant-demo/changes/ch-142", async (route) => {
    detailRequests += 1;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "selected change detail unavailable" }),
    });
  });

  await gotoShippedApp(page);
  await page.locator('[data-change-id="ch-142"]').click();

  await expect(page).toHaveURL(/\?change=ch-142$/);
  await expect.poll(() => detailRequests).toBe(1);
  await expect(page.locator('[data-platform-governance="selected-change-error"]')).toContainText(
    "Selected change detail failed.",
  );
  await expect(page.locator('[data-platform-governance="selected-change-error"]')).toContainText(
    "selected change detail unavailable",
  );
  await expect(page.getByRole("button", { name: "Retry detail" })).toBeVisible();
  await expect(page.getByText("The shell fails closed here instead of reviving a hidden legacy detail path.")).toBeVisible();
  await expect(page.locator('[data-platform-surface="tenant-queue-list"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveCount(0);
  await expect(page.getByText("Backend-served default shell")).toHaveCount(0);
});

test("catalog workspace supports selection, compact detail, and queue handoff @platform", async ({ page }) => {
  await gotoShippedApp(page, "/?workspace=catalog");

  await page.locator('[data-tenant-id="tenant-demo"]').click();
  await expect(page.locator('[data-platform-surface="selected-repository-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "true",
  );
  await expect(page.locator('[data-platform-surface="repository-profile"]')).toContainText(
    "change-control-center-ui",
  );
  await page.getByRole("button", { name: "Open queue" }).click();

  await expectTenantQueueWorkspace(page, "change-control-center-ui");
  await expect(page).toHaveURL(/\/$/);

  await page.setViewportSize({ width: 960, height: 900 });
  await gotoShippedApp(page, "/?workspace=catalog");

  await page.locator('[data-tenant-id="tenant-demo"]').click();
  await expect(page.getByRole("button", { name: "Back to repositories" })).toBeVisible();
  await page.getByRole("button", { name: "Back to repositories" }).click();
  await expect(page.getByRole("button", { name: "Back to repositories" })).toHaveCount(0);
  await expect(page.locator('[data-platform-shell="repository-catalog-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "false",
  );
});

test("runs workspace supports hydration, selection, slice restoration, and change handoff @platform", async ({
  page,
}) => {
  let runsRequests = 0;
  let detailRequests = 0;

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/tenants/tenant-demo/runs") {
      runsRequests += 1;
    }
    if (url.pathname === "/api/tenants/tenant-demo/runs/run-30") {
      detailRequests += 1;
    }
  });

  await gotoShippedApp(page, "/?workspace=runs");

  await expectRunsWorkspace(page, "change-control-center-ui");
  await expect(page).toHaveURL(/\?workspace=runs$/);
  await expect.poll(() => runsRequests).toBe(1);

  await page.locator('[data-platform-run-slice="all"]').click();
  await expect(page).toHaveURL(/\?workspace=runs&runSlice=all$/);
  await expect.poll(() => runsRequests).toBe(2);

  await page.locator('[data-run-id="run-30"]').click();
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText("run-30");
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(
    "Launcher lifecycle needs operator review before the next apply loop.",
  );
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(
    "serverRequest/resolved",
  );
  await expect(page).toHaveURL(/\?workspace=runs&runSlice=all&run=run-30$/);
  await expect.poll(() => detailRequests).toBe(1);

  await reloadApp(page);

  await expectRunsWorkspace(page, "change-control-center-ui");
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText("run-30");
  await expect(page).toHaveURL(/\?workspace=runs&runSlice=all&run=run-30$/);
  await expect.poll(() => detailRequests).toBe(2);

  await page.getByRole("button", { name: "Open owning change" }).click();
  await expectTenantQueueWorkspace(page, "change-control-center-ui");
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Land the canonical operator shell",
  );
  await expect(page).toHaveURL(/\?change=ch-142$/);
});

test("runs workspace preserves compact drawer behavior @platform", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await gotoShippedApp(page, "/?workspace=runs&run=run-30");

  await expect(page.locator('[data-platform-shell="run-detail-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "true",
  );
  await expect(page.getByRole("heading", { name: "run-30" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to runs" })).toBeVisible();

  await page.getByRole("button", { name: "Back to runs" }).click();

  await expect(page.locator('[data-platform-shell="run-detail-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "false",
  );
  await expect(page).toHaveURL(/\?workspace=runs$/);
});

test("surfaces bootstrap failure explicitly without falling back to client-only shell truth @platform", async ({
  page,
}) => {
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "bootstrap unavailable" }),
    });
  });

  await gotoShippedApp(page);

  await expect(page.locator('[data-platform-surface="shell-bootstrap-error"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Operator shell bootstrap failed" })).toBeVisible();
  await expect(page.getByText("bootstrap unavailable")).toBeVisible();
  await expect(page.locator('[data-platform-surface="tenant-queue-workspace"]')).toHaveCount(0);
  await expect(page.getByText("Backend-served default shell")).toHaveCount(0);
});
