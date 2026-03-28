import { expect, test } from "@playwright/test";

test("creates a run and shows runtime lineage in run studio", async ({ page }) => {
  await page.goto("/");
  const detailStatus = page.locator(".detail-panel .status-bar");

  await page.getByRole("button", { name: /ch-146/i }).click();
  await page.getByRole("button", { name: "Run next step", exact: true }).click();
  await expect(detailStatus.getByText("Run review")).toBeVisible();
  await page.getByRole("button", { name: "Run next step", exact: true }).click();
  await expect(detailStatus.getByText("Create targeted fix run")).toBeVisible();

  await expect(page.getByText("thr_stdio_001")).toBeVisible();
  await expect(page.getByText("turn_stdio_001")).toBeVisible();
  await expect(page.getByText(/^stdio$/)).toBeVisible();
  await expect(page.getByText(/commandExecution\/requestApproval/i)).toBeVisible();

  await page.getByRole("button", { name: "evidence" }).click();
  await expect(page.getByText("ch-146: full review")).toBeVisible();
});

test("persists clarification answers across reload", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-150/i }).click();
  await page.getByRole("button", { name: "clarifications" }).click();
  await page.getByRole("button", { name: /generate round/i }).click();
  await page.getByLabel("Separate sidecar").first().check();
  await page.getByPlaceholder("Дополнительный комментарий").first().fill("Зафиксировать sidecar deployment.");
  await page.getByRole("button", { name: /submit answers/i }).click();

  await page.reload();
  await page.getByRole("button", { name: /ch-150/i }).click();
  await page.getByRole("button", { name: "clarifications" }).click();

  await expect(page.getByText("Зафиксировать sidecar deployment.")).toBeVisible();
});
