import { expect, test, type Page } from "@playwright/test";

import { gotoShippedApp, reloadApp } from "./support/navigation";

async function expectFunctionalShell(page: Page, heading: string, tenantLabel: string) {
  await expect(page.locator('[data-platform-surface="functional-shell"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await expect(page.getByText("Backend-owned bootstrap ready")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Workbench");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Repositories");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Runs");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Governance");
  await expect(page.getByText("Mode: Functional shell")).toBeVisible();
  await expect(page.getByText("Hydration: backend bootstrap")).toBeVisible();
  await expect(page.getByLabel("Tenant")).toHaveValue(/tenant-/);
  await expect(page.getByText(`Tenant: ${tenantLabel}`)).toBeVisible();
  await expect(page.getByText("Backend-served default shell")).toHaveCount(0);
}

async function expectRepositoryCatalogWorkspace(page: Page, selectedRepository: string, searchQuery: string) {
  await expect(page.locator('[data-platform-surface="repository-catalog-workspace"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Repository Portfolio" })).toBeVisible();
  await expect(page.getByText("Served repository mode")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Workbench");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Repositories");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Runs");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Governance");
  await expect(page.getByLabel("Search")).toHaveValue(searchQuery);
  await expect(page.getByText(`Repository: ${selectedRepository}`)).toBeVisible();
  await expect(page.getByText("backend-owned catalog", { exact: true })).toBeVisible();
}

test("renders the first functional shell from backend bootstrap on the default route @smoke @platform", async ({ page }) => {
  let bootstrapRequests = 0;

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/bootstrap") {
      bootstrapRequests += 1;
    }
  });

  await gotoShippedApp(page);

  await expectFunctionalShell(page, "Functional Workbench", "change-control-center-ui");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => bootstrapRequests).toBe(1);
});

test("restores supported catalog route state and strips unsupported params @smoke @platform", async ({ page }) => {
  await gotoShippedApp(
    page,
    "/?legacyWorkbench=1&workspace=catalog&tenant=tenant-sandbox&filter=active&q=sandbox&change=ch-142&run=run-30&tab=runs",
  );

  await expectRepositoryCatalogWorkspace(page, "sandbox-repo", "sandbox");
  await expect(page.locator('[data-tenant-id="tenant-sandbox"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\?workspace=catalog&tenant=tenant-sandbox&filter=active&q=sandbox$/);
  await expect(page).not.toHaveURL(/legacyWorkbench|change=|run=|tab=/);

  await reloadApp(page);

  await expectRepositoryCatalogWorkspace(page, "sandbox-repo", "sandbox");
  await expect(page.locator('[data-tenant-id="tenant-sandbox"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\?workspace=catalog&tenant=tenant-sandbox&filter=active&q=sandbox$/);
});

test("catalog workspace supports selection, compact detail, and queue handoff @platform", async ({ page }) => {
  await gotoShippedApp(page, "/?workspace=catalog");

  await page.locator('[data-tenant-id="tenant-demo"]').click();
  await expect(page.locator('[data-platform-surface="selected-repository-workspace"]')).toHaveAttribute("data-platform-open", "true");
  await expect(page.locator('[data-platform-surface="repository-profile"]')).toContainText("change-control-center-ui");
  await page.getByRole("button", { name: "Open queue" }).click();

  await expectFunctionalShell(page, "Functional Workbench", "change-control-center-ui");
  await expect(page).toHaveURL(/\/$/);

  await page.setViewportSize({ width: 960, height: 900 });
  await gotoShippedApp(page, "/?workspace=catalog");

  await page.locator('[data-tenant-id="tenant-demo"]').click();
  await expect(page.getByRole("button", { name: "Back to repositories" })).toBeVisible();
  await page.getByRole("button", { name: "Back to repositories" }).click();
  await expect(page.getByRole("button", { name: "Back to repositories" })).toHaveCount(0);
  await expect(page.locator('[data-platform-shell="repository-catalog-workspace"]')).toHaveAttribute("data-platform-open", "false");
});

test("surfaces bootstrap failure explicitly without falling back to client-only shell truth @platform", async ({ page }) => {
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
  await expect(page.locator('[data-platform-surface="functional-shell"]')).toHaveCount(0);
  await expect(page.getByText("Backend-served default shell")).toHaveCount(0);
});
