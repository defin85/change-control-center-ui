import { expect, test } from "@playwright/test";

const bootstrapResponse = {
  tenants: [
    {
      id: "tenant-demo",
      name: "Demo Tenant",
      repoPath: "/repo",
      description: "Demo tenant for platform table smoke coverage.",
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
      facts: [{ title: "Saved fact", body: "Fact body" }],
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
          facts: [{ title: "Tenant fact", body: "Tenant fact body" }],
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
  tenantMemory: [{ title: "Tenant fact", body: "Tenant fact body" }],
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

  await page.goto("/?change=ch-146");

  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').filter({ hasText: "Foundation proof change" }).first();

  await page.goto("/?change=ch-146&tab=traceability");
  await expect(detailPanel.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(detailPanel.getByText("Requirement")).toBeVisible();
  await expect(detailPanel.getByText("Status")).toBeVisible();

  await page.goto("/?change=ch-146&tab=runs");
  await expect(detailPanel.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(detailPanel.getByRole("button", { name: /run-30/i })).toHaveAttribute(
    "data-platform-foundation",
    "base-ui-run-row",
  );

  await page.goto("/?change=ch-146&tab=gaps");
  await expect(detailPanel.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(detailPanel.locator('[data-platform-foundation="base-ui-gap-row"]').first()).toBeVisible();
  await expect(detailPanel.locator('[data-platform-foundation="base-ui-gap-row"]').first()).toHaveAttribute(
    "data-platform-foundation",
    "base-ui-gap-row",
  );

  await page.goto("/?change=ch-146&tab=evidence");
  await expect(detailPanel.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(detailPanel.getByText("Compact review output")).toBeVisible();
});
