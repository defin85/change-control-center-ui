import { expect, test } from "@playwright/test";

import { gotoApp } from "./support/navigation";

const bootstrapResponse = {
  tenants: [
    {
      id: "tenant-demo",
      name: "Demo Tenant",
      repoPath: "/repo",
      description: "Demo tenant for platform table smoke coverage.",
    },
  ],
  repositoryCatalog: [
    {
      tenantId: "tenant-demo",
      name: "Demo Tenant",
      repoPath: "/repo",
      description: "Demo tenant for platform table smoke coverage.",
      changeCount: 1,
      blockedChangeCount: 0,
      readyChangeCount: 1,
      activeChangeCount: 0,
      attentionState: "active",
      lastActivity: "1m",
      nextRecommendedAction: "Open ready queue",
      featuredChange: {
        id: "ch-146",
        title: "Foundation proof change",
        state: "ready",
        nextAction: "Review tabular surfaces",
      },
    },
  ],
  activeTenantId: "tenant-demo",
  views: [{ id: "inbox", label: "Inbox" }],
  changes: [
    {
      id: "ch-146",
      tenantId: "tenant-demo",
      title: "Foundation proof change",
      subtitle: "Ready for review",
      state: "ready",
      owner: {
        id: "codex-chief",
        label: "Codex Chief",
      },
      nextAction: "Review tabular surfaces",
      blocker: "None",
      loopCount: 2,
      lastRunAgo: "1m",
      verificationStatus: "good",
      mandatoryGapCount: 0,
    },
  ],
};

const detailResponse = {
  change: {
    id: "ch-146",
    tenantId: "tenant-demo",
    title: "Foundation proof change",
    subtitle: "Ready for review",
    state: "ready",
    summary: "Detail payload used to prove the approved table foundation.",
    createdAt: "2026-03-30T00:00:00Z",
    updatedAt: "2026-03-30T00:10:00Z",
    blocker: "None",
    nextAction: "Review tabular surfaces",
    verificationStatus: "good",
    loopCount: 2,
    lastRunAgo: "1m",
    requirementsLinked: 1,
    requirementsTotal: 1,
    specStatus: "ready",
    owner: {
      id: "codex-chief",
      label: "Codex Chief",
    },
    contract: {
      goal: "Prove the approved table foundation on detail surfaces.",
      scope: ["Traceability", "Runs", "Gaps", "Evidence"],
      acceptanceCriteria: ["Use PlatformTable", "Preserve UI markers"],
      constraints: ["No schema edits in this slice"],
    },
    memory: {
      summary: "Memory summary",
      openQuestions: [],
      decisions: [],
      facts: [{ id: "fact-saved", tenantId: "tenant-demo", title: "Saved fact", body: "Fact body", status: "approved" }],
      activeFocus: [],
      clarifications: [],
    },
    chiefHistory: [{ at: "2026-03-30T00:00:00Z", title: "Chief note", note: "Chief history item" }],
    traceability: [
      {
        req: "R-1",
        code: "ChangeDetail.tsx",
        tests: "detail-tables.spec.ts",
        evidence: "Traceability data",
        status: "done",
      },
    ],
    gaps: [
      {
        id: "gap-1",
        severity: "high",
        mandatory: true,
        status: "open",
        summary: "Resolve table foundation slice",
        recurrence: 1,
        reqRef: "R-1",
      },
    ],
    timeline: [{ title: "Created", note: "Change opened for smoke coverage." }],
    git: {
      worktree: "clean",
      branch: "master",
      changedFiles: 1,
      commitStatus: "clean",
      mergeReadiness: "ready",
    },
  },
  runs: [
    {
      id: "run-30",
      changeId: "ch-146",
      tenantId: "tenant-demo",
      kind: "analysis",
      status: "done",
      transport: "stdio",
      threadId: "thr_seed_142_30",
      turnId: "turn_seed_142_30",
      worktree: "/repo",
      result: "ok",
      duration: "1s",
      outcome: "approved",
      prompt: "Smoke prompt",
      checks: [],
      decision: "accepted",
      memoryPacket: {
        tenantMemory: {
          facts: [
            {
              id: "fact-tenant",
              tenantId: "tenant-demo",
              title: "Tenant fact",
              body: "Tenant fact body",
              status: "approved",
            },
          ],
        },
        changeContract: {},
        changeMemory: {
          summary: "Memory summary",
          openQuestions: [],
          decisions: [],
          facts: [],
          activeFocus: [],
          clarifications: [],
        },
        focusGraph: { items: [] },
      },
    },
  ],
  evidence: [
    {
      id: "evidence-1",
      changeId: "ch-146",
      kind: "compact-review",
      title: "Compact review output",
      body: "Traceability data",
    },
  ],
  clarificationRounds: [],
  focusGraph: { items: [] },
  tenantMemory: [{ id: "fact-tenant", tenantId: "tenant-demo", title: "Tenant fact", body: "Tenant fact body", status: "approved" }],
};

test("renders detail tabs through the approved table foundation @platform", async ({ page }) => {
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bootstrapResponse) });
  });
  await page.route("**/api/tenants/tenant-demo/changes", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ changes: bootstrapResponse.changes }),
    });
  });
  await page.route("**/api/tenants/tenant-demo/changes/ch-146", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detailResponse) });
  });
  await page.route("**/api/tenants/tenant-demo/runs?slice=attention", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ slice: "attention", runs: [] }),
    });
  });
  await page.route("**/api/tenants/tenant-demo/runs/run-30", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        run: detailResponse.runs[0],
        events: [],
        approvals: [],
      }),
    });
  });

  await gotoApp(page);

  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').filter({ hasText: "Foundation proof change" }).first();
  const queueRow = page.locator('[data-change-id="ch-146"]').first();
  const detailTabs = detailPanel.locator(".tab-list");

  await queueRow.click();
  await expect(page.getByRole("heading", { name: "Foundation proof change" })).toBeVisible();

  await detailTabs.getByRole("tab", { name: "Traceability" }).click();
  await expect(detailPanel.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(detailPanel.locator(".traceability-head").getByText("Requirement", { exact: true })).toBeVisible();
  await expect(detailPanel.locator(".traceability-head").getByText("Status", { exact: true })).toBeVisible();

  await detailTabs.getByRole("tab", { name: "Runs" }).click();
  await expect(detailPanel.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(detailPanel.getByRole("button", { name: /run-30/i })).toHaveAttribute(
    "data-platform-foundation",
    "base-ui-run-row",
  );

  await detailTabs.getByRole("tab", { name: "Gaps" }).click();
  await expect(detailPanel.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(detailPanel.locator('[data-platform-foundation="base-ui-gap-row"]').first()).toBeVisible();
  await expect(detailPanel.locator('[data-platform-foundation="base-ui-gap-row"]').first()).toHaveAttribute(
    "data-platform-foundation",
    "base-ui-gap-row",
  );

  await detailTabs.getByRole("tab", { name: "Evidence" }).click();
  await expect(detailPanel.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(detailPanel.getByText("Compact review output")).toBeVisible();
});

test("renders labeled compact queue and detail rows on narrow viewports @platform", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bootstrapResponse) });
  });
  await page.route("**/api/tenants/tenant-demo/changes", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ changes: bootstrapResponse.changes }),
    });
  });
  await page.route("**/api/tenants/tenant-demo/changes/ch-146", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detailResponse) });
  });
  await page.route("**/api/tenants/tenant-demo/runs?slice=attention", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ slice: "attention", runs: [] }),
    });
  });
  await page.route("**/api/tenants/tenant-demo/runs/run-30", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        run: detailResponse.runs[0],
        events: [],
        approvals: [],
      }),
    });
  });

  await gotoApp(page);

  const queueRow = page.locator('[data-change-id="ch-146"]');
  await queueRow.click();

  await expect(queueRow.locator('[data-platform-compact-label]').filter({ hasText: "Change" })).toBeVisible();
  await expect(queueRow.locator('[data-platform-compact-label]').filter({ hasText: "Owner" })).toBeVisible();
  await expect(queueRow.locator('[data-platform-compact-label]').filter({ hasText: "Next step" })).toBeVisible();

  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').filter({ hasText: "Foundation proof change" }).first();
  await expect(page.getByRole("heading", { name: "Foundation proof change" })).toBeVisible();

  await detailPanel.getByRole("tab", { name: "Traceability" }).click();
  const traceabilityRow = detailPanel.locator(".traceability-row").first();
  await expect(traceabilityRow.locator('[data-platform-compact-label]').filter({ hasText: "Requirement" })).toBeVisible();
  await expect(traceabilityRow.locator('[data-platform-compact-label]').filter({ hasText: "Evidence" })).toBeVisible();

  await detailPanel.getByRole("tab", { name: "Runs" }).click();
  const runRow = detailPanel.locator(".run-row").first();
  await expect(runRow.locator('[data-platform-compact-label]').filter({ hasText: "Run" })).toBeVisible();
  await expect(runRow.locator('[data-platform-compact-label]').filter({ hasText: "Thread / Turn" })).toBeVisible();
});
