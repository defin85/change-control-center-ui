import { expect, test, type Page } from "@playwright/test";

import { gotoShippedApp, reloadApp } from "./support/navigation";

async function expectTenantQueueWorkspace(page: Page, tenantLabel: string) {
  await expect(page.locator('[data-platform-surface="tenant-queue-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="tenant-queue-list"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-selected-change-summary"]')).toBeVisible();
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
    "/?legacyWorkbench=1&workspace=queue&tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-142&run=run-30&tab=runs",
  );

  await expectTenantQueueWorkspace(page, "sandbox-repo");
  await expect(page.locator('[data-change-id="ch-201"]')).toBeVisible();
  await expect(page.locator('[data-platform-governance="queue-selection-repaired"]')).toContainText(
    "Selected change repaired.",
  );
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-201$/);
  await expect(page).not.toHaveURL(/legacyWorkbench|change=ch-142|run=|tab=/);

  await reloadApp(page);

  await expectTenantQueueWorkspace(page, "sandbox-repo");
  await expect(page.locator('[data-change-id="ch-201"]')).toBeVisible();
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-201$/);
});

test("queue workspace supports selected-change handoff, filtering, and tenant switching @platform", async ({
  page,
}) => {
  await gotoShippedApp(page);

  await page.locator('[data-change-id="ch-142"]').click();
  await expect(page.locator('[data-platform-surface="queue-selected-change-summary"]')).toContainText(
    "Land the canonical operator shell",
  );
  await expect(page).toHaveURL(/\?change=ch-142$/);

  await page.getByLabel("Search").fill("sandbox");
  await expect(page.locator('[data-platform-governance="queue-selection-repaired"]')).toContainText(
    "Selected change repaired.",
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
