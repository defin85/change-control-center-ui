import { expect, test, type Route } from "@playwright/test";

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fulfillAfterDelay(route: Route, ms: number) {
  const response = await route.fetch();
  await delay(ms);
  await route.fulfill({ response });
}

test("keeps workflow-heavy operator commands behind an explicit pending boundary @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  await page.getByRole("tab", { name: "Runs" }).click();
  await page.getByRole("button", { name: /run-30/i }).click();

  const detailPanel = page.locator(".detail-stage .detail-panel").first();
  const runStudio = page.locator("#run-studio");

  await expect(runStudio.getByRole("heading", { name: "run-30" })).toBeVisible();

  await page.route("**/api/tenants/tenant-demo/changes/ch-142/actions/run-next", async (route) => {
    await fulfillAfterDelay(route, 300);
  });

  await detailPanel.getByRole("button", { name: "Run next step" }).click();

  await expect(detailPanel.getByRole("button", { name: "Run next step" })).toBeDisabled();
  await expect(detailPanel.getByRole("button", { name: "Escalate" })).toBeDisabled();
  await expect(detailPanel.locator(".empty-state").filter({ hasText: "Run next step" })).toBeVisible();

  await expect(runStudio.getByRole("button", { name: "Accept" })).toBeVisible();
  await expect(runStudio.getByRole("button", { name: "Accept" })).toBeEnabled();

  await page.route("**/api/tenants/tenant-demo/approvals/*/decision", async (route) => {
    await fulfillAfterDelay(route, 1000);
  });

  const approvalActions = runStudio.locator(".approval-actions");
  await runStudio.getByRole("button", { name: "Accept" }).click();

  await expect(runStudio.getByText(/^Accept /)).toBeVisible();
  await expect(approvalActions).toHaveCount(1);
  await expect(approvalActions.getByRole("button", { name: "Accept" })).toBeDisabled();
  await expect(approvalActions.getByRole("button", { name: "Decline" })).toBeDisabled();

  await expect(runStudio.getByText(/accepted/i)).toBeVisible();
  await expect(approvalActions).toHaveCount(0);
  await expect(runStudio.getByText("serverRequest/resolved")).toBeVisible();

  await page.getByRole("tab", { name: "Clarifications" }).click();

  await page.route("**/api/tenants/tenant-demo/changes/ch-142/clarifications/auto", async (route) => {
    await fulfillAfterDelay(route, 300);
  });

  const generateRound = page.getByRole("button", { name: /generate round/i });
  await generateRound.click();

  await expect(generateRound).toBeDisabled();
  await expect(page.locator(".empty-state").filter({ hasText: "Generate clarification round" })).toBeVisible();
  await expect(page.getByRole("button", { name: /submit answers/i })).toBeVisible();
});

test("surfaces rejected workflow commands as explicit workflow errors @platform", async ({ page }) => {
  await page.goto("/");

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

  await expect(generateRound).toBeDisabled();
  await expect(page.locator(".empty-state").filter({ hasText: "Generate clarification round" })).toBeVisible();

  await expect(page.getByText("Clarification workflow failed.")).toBeVisible();
  await expect(page.getByText(/Control API request failed \(HTTP 500\)/i)).toBeVisible();
  await expect(page.getByText(/clarification command rejected/i)).toBeVisible();
});
