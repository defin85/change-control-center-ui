import { expect, test } from "@playwright/test";

import { gotoApp } from "./support/navigation";

test("fails closed when selected change detail drifts from the shared contract boundary @platform", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });

  await page.route("**/api/tenants/tenant-demo/changes/ch-142", async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    payload.change.memory.unexpectedDrift = "silent";

    await route.fulfill({
      response,
      json: payload,
    });
  });

  await gotoApp(page);
  await page.locator('[data-change-id="ch-142"]').first().click();

  await expect(page.getByText(/Control API contract failure/i)).toBeVisible();
  await expect(page.getByText(/change\.memory: Invalid input/i)).toBeVisible();
});
