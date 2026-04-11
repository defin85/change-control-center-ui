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

test("restores supported functional route state and strips unsupported params @smoke @platform", async ({ page }) => {
  await gotoShippedApp(page, "/?legacyWorkbench=1&workspace=catalog&tenant=tenant-sandbox&q=sandbox&change=ch-142&run=run-30&tab=runs");

  await expectFunctionalShell(page, "Repository Route Scaffold", "sandbox-repo");
  await expect(page.getByLabel("Tenant")).toHaveValue("tenant-sandbox");
  await expect(page.getByLabel("Search")).toHaveValue("sandbox");
  await expect(page).toHaveURL(/\?workspace=catalog&tenant=tenant-sandbox&q=sandbox$/);
  await expect(page).not.toHaveURL(/legacyWorkbench|change=|run=|tab=/);

  await reloadApp(page);

  await expectFunctionalShell(page, "Repository Route Scaffold", "sandbox-repo");
  await expect(page.getByLabel("Tenant")).toHaveValue("tenant-sandbox");
  await expect(page.getByLabel("Search")).toHaveValue("sandbox");
  await expect(page).toHaveURL(/\?workspace=catalog&tenant=tenant-sandbox&q=sandbox$/);
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
