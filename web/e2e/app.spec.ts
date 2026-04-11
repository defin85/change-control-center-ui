import { expect, test, type Page } from "@playwright/test";

import { gotoShippedApp, reloadApp } from "./support/navigation";

async function expectStaticShell(page: Page) {
  await expect(page.locator('[data-platform-surface="operator-style-sample"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Operator Shell" })).toBeVisible();
  await expect(page.getByText("Backend-served default shell")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Workbench");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Repositories");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Runs");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Governance");
  await expect(page.getByRole("heading", { name: "Repository pressure" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Execution health" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live queue" })).toBeVisible();
  await expect(page.getByText("Mode: Default shell")).toBeVisible();
  await expect(page.getByText("Artifact: shipped static reference")).toBeVisible();
  await expect(page.getByText("Open live workbench")).toHaveCount(0);
}

test("renders the shipped static reference shell from the default route @smoke @platform", async ({ page }) => {
  await gotoShippedApp(page);

  await expectStaticShell(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL(/\/$/);
});

test("normalizes stale live-shell query params back to the canonical static route @smoke @platform", async ({ page }) => {
  await gotoShippedApp(page, "/?legacyWorkbench=1&workspace=runs&runSlice=all&change=ch-142&run=run-30&tab=runs");

  await expectStaticShell(page);
  await expect(page).not.toHaveURL(/\?/);
  await expect(page).not.toHaveURL(/legacyWorkbench|workspace|runSlice|change=|run=|tab=/);
});

test("does not depend on Control API bootstrap to render the shipped static shell @platform", async ({ page }) => {
  let bootstrapRequests = 0;
  let apiRequests = 0;

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/api/")) {
      return;
    }

    apiRequests += 1;
    if (url.pathname === "/api/bootstrap") {
      bootstrapRequests += 1;
    }
  });

  await page.route("**/api/**", async (route) => {
    await route.abort();
  });

  await gotoShippedApp(page);

  await expectStaticShell(page);
  await expect.poll(() => bootstrapRequests).toBe(0);
  await expect.poll(() => apiRequests).toBe(0);
});

test("keeps the canonical static shell stable across reloads @platform", async ({ page }) => {
  await gotoShippedApp(page, "/?workspace=catalog");

  await expect(page).not.toHaveURL(/\?/);
  await expectStaticShell(page);

  await reloadApp(page);

  await expectStaticShell(page);
  await expect(page).toHaveURL(/\/$/);
});
