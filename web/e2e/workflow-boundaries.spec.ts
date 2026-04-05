import { expect, test, type Page, type Route } from "@playwright/test";

import { gotoApp } from "./support/navigation";

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function uniqueTitle(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function createIsolatedChange(page: Page, prefix: string) {
  const createResponse = await page.request.post("/api/tenants/tenant-demo/changes", {
    data: { title: uniqueTitle(prefix) },
  });
  expect(createResponse.ok()).toBeTruthy();
  const payload = (await createResponse.json()) as { change: { id: string; title: string } };
  return payload.change;
}

async function fulfillAfterDelay(route: Route, ms: number) {
  const response = await route.fetch();
  const body = await response.body();
  const headers = response.headers();
  await delay(ms);
  await route.fulfill({
    status: response.status(),
    headers,
    body,
  });
}

test("keeps workflow-heavy operator commands behind an explicit pending boundary @platform", async ({ page }) => {
  const change = await createIsolatedChange(page, "Workflow boundary");
  await gotoApp(page, `/?change=${change.id}`);

  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').first();
  const runStudio = page.locator('[data-platform-shell="run-inspection"]');

  await expect(page.getByRole("heading", { name: change.title })).toBeVisible();
  await expect(runStudio).toHaveCount(0);

  let runNextRequest: Promise<void> | null = null;
  await page.route(`**/api/tenants/tenant-demo/changes/${change.id}/actions/run-next`, async (route) => {
    runNextRequest = fulfillAfterDelay(route, 300);
    await runNextRequest;
  });

  await detailPanel.getByRole("button", { name: "Run next step" }).click();

  await expect(detailPanel.getByRole("button", { name: "Run next step" })).toBeDisabled();
  await expect(detailPanel.getByRole("button", { name: "Escalate" })).toBeDisabled();
  await expect(detailPanel.locator(".empty-state").filter({ hasText: "Run next step" })).toBeVisible();
  await expect(runStudio).toHaveCount(0);

  await expect.poll(() => runNextRequest !== null).toBe(true);
  await runNextRequest;
  await expect(runStudio.getByRole("button", { name: "Accept" })).toBeVisible();
  await expect(runStudio.getByRole("button", { name: "Accept" })).toBeEnabled();

  let approvalDecision: Promise<void> | null = null;
  await page.route("**/api/tenants/tenant-demo/approvals/*/decision", async (route) => {
    approvalDecision = fulfillAfterDelay(route, 1000);
    await approvalDecision;
  });

  const approvalActions = runStudio.locator(".approval-actions");
  await runStudio.getByRole("button", { name: "Accept" }).click();

  await expect(runStudio.getByText(/^Accept /)).toBeVisible();
  await expect(approvalActions).toHaveCount(1);
  await expect(approvalActions.getByRole("button", { name: "Accept" })).toBeDisabled();
  await expect(approvalActions.getByRole("button", { name: "Decline" })).toBeDisabled();

  await expect.poll(() => approvalDecision !== null).toBe(true);
  await approvalDecision;
  await expect(runStudio.getByText(/accepted/i)).toBeVisible();
  await expect(approvalActions).toHaveCount(0);
  await expect(runStudio.getByText("serverRequest/resolved")).toBeVisible();

  await page.getByRole("tab", { name: "Clarifications" }).click();

  let clarificationRequest: Promise<void> | null = null;
  await page.route(`**/api/tenants/tenant-demo/changes/${change.id}/clarifications/auto`, async (route) => {
    clarificationRequest = fulfillAfterDelay(route, 300);
    await clarificationRequest;
  });

  const generateRound = page.getByRole("button", { name: /generate round/i });
  await generateRound.click();

  await expect(generateRound).toBeDisabled();
  await expect(page.locator(".empty-state").filter({ hasText: "Generate clarification round" })).toBeVisible();
  await expect.poll(() => clarificationRequest !== null).toBe(true);
  await clarificationRequest;
  await expect(page.getByRole("button", { name: /submit answers/i })).toBeVisible();
});

test("surfaces rejected workflow commands as explicit workflow errors @platform", async ({ page }) => {
  await gotoApp(page);

  await page.getByRole("button", { name: /ch-150/i }).click();
  await page.getByRole("tab", { name: "Clarifications" }).click();

  await page.route("**/api/tenants/tenant-demo/changes/ch-150/clarifications/auto", async (route) => {
    await delay(300);
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ detail: "clarification command rejected" }),
    });
  });

  const generateRound = page.getByRole("button", { name: /generate round/i });
  await generateRound.click();

  await expect(page.locator(".empty-state").filter({ hasText: "Generate clarification round" })).toBeVisible();

  await expect(page.getByText("Clarification workflow failed.")).toBeVisible();
  await expect(page.getByText(/Control API request failed \(HTTP 500\)/i)).toBeVisible();
  await expect(page.getByText(/clarification command rejected/i)).toBeVisible();
});
