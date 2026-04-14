import { expect, test, type Page } from "@playwright/test";

import { gotoShippedApp, reloadApp } from "./support/navigation";

async function expectTenantQueueWorkspace(page: Page, tenantLabel: string) {
  await expect(page.locator('[data-platform-surface="tenant-queue-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="tenant-queue-list"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toBeVisible();
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

async function expectRunsWorkspace(page: Page, tenantLabel: string) {
  await expect(page.locator('[data-platform-surface="tenant-runs-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="tenant-runs-list"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Runs Workspace" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Workbench");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Repositories");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Runs");
  await expect(page.getByRole("navigation", { name: "Primary sections" })).toContainText("Governance");
  await expect(page.getByText(`Tenant: ${tenantLabel}`)).toBeVisible();
  await expect(page.getByText("backend-owned runs", { exact: true })).toBeVisible();
}

function buildUniqueSuffix() {
  return `${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

async function delayMutationOnce(page: Page, url: string | RegExp, method: string, delayMs = 300) {
  let delayed = false;

  await page.route(url, async (route, request) => {
    if (request.method() !== method || delayed) {
      await route.continue();
      return;
    }

    delayed = true;
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ response });
  });
}

async function failMutationOnce(page: Page, url: string | RegExp, method: string, detail: string) {
  let failed = false;

  await page.route(url, async (route, request) => {
    if (request.method() !== method || failed) {
      await route.continue();
      return;
    }

    failed = true;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail }),
    });
  });
}

async function startRepositoryCreation(page: Page, repositoryName: string, repositoryPath: string) {
  await page.locator('[data-platform-action="new-repository"]').first().click();
  await page.getByLabel("Repository name").fill(repositoryName);
  await page.getByLabel("Repository path").fill(repositoryPath);
  await page.getByLabel("Repository description").fill("Workflow proof repository created from Playwright.");
  await page.getByRole("button", { name: "Create repository" }).click();
}

async function createRepositoryChangeAndOpenQueue(
  page: Page,
  repositoryName: string,
  repositoryPath: string,
) {
  await gotoShippedApp(page, "/?workspace=catalog");
  await startRepositoryCreation(page, repositoryName, repositoryPath);
  await expect(page.locator('[data-platform-surface="repository-profile"]')).toContainText(repositoryName);

  await page.locator('[data-platform-action="create-first-change"]').click();
  const changeId = await extractToastIdentifier(
    page,
    /Change (ch-[a-z0-9]+) created for /,
    "change id",
  );

  await page.locator('[data-platform-action="open-queue"]').click();
  await expectTenantQueueWorkspace(page, repositoryName);
  await page.locator(`[data-change-id="${changeId}"]`).click();
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(changeId);

  return changeId;
}

async function extractToastIdentifier(page: Page, pattern: RegExp, label: string) {
  const toast = page.locator(".toast");
  await expect(toast).toContainText(pattern);
  const message = await toast.innerText();
  const match = message.match(pattern);

  if (!match?.[1]) {
    throw new Error(`Unable to parse ${label} from toast: ${message}`);
  }

  return match[1];
}

async function trackRealtimeSubscriptions(page: Page) {
  const subscribedTenants = new Set<string>();
  await page.routeWebSocket(/\/api\/tenants\/[^/]+\/events$/, (ws) => {
    const server = ws.connectToServer();

    ws.onMessage((message) => {
      server.send(message);
      const tenantMatch = ws.url().match(/\/api\/tenants\/([^/]+)\/events$/);
      if (String(message) === "subscribe" && tenantMatch?.[1]) {
        subscribedTenants.add(tenantMatch[1]);
      }
    });
  });

  return subscribedTenants;
}

function getRequiredTenantId(page: Page) {
  const tenantId = new URL(page.url()).searchParams.get("tenant");
  if (!tenantId) {
    throw new Error(`Tenant id missing from URL: ${page.url()}`);
  }

  return tenantId;
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
    "/?legacyWorkbench=1&workspace=queue&tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-142&run=run-30&tab=gaps",
  );

  await expectTenantQueueWorkspace(page, "sandbox-repo");
  await expect(page.locator('[data-change-id="ch-201"]')).toBeVisible();
  await expect(page.locator('[data-platform-governance="queue-selection-repaired"]')).toContainText(
    "Selected change repaired.",
  );
  await expect(page.locator('[data-platform-governance="queue-selection-repaired"]')).toContainText(
    "ch-142 moved to ch-201",
  );
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "gaps",
    { timeout: 15000 },
  );
  await expect(page.getByText("No gaps are currently attached to this change.")).toBeVisible();
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-201&tab=gaps$/);
  await expect(page).not.toHaveURL(/legacyWorkbench|change=ch-142|run=/);

  await reloadApp(page);

  await expectTenantQueueWorkspace(page, "sandbox-repo");
  await expect(page.locator('[data-change-id="ch-201"]')).toBeVisible();
  await expect(page).toHaveURL(/\?tenant=tenant-sandbox&view=ready&q=sandbox&change=ch-201&tab=gaps$/);
});

test("queue workspace supports selected-change handoff, filtering, and tenant switching @platform", async ({
  page,
}) => {
  let detailRequests = 0;

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/tenants/tenant-demo/changes/ch-142") {
      detailRequests += 1;
    }
  });

  await gotoShippedApp(page);

  await page.locator('[data-change-id="ch-142"]').click();
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Land the canonical operator shell",
  );
  await expect(page).toHaveURL(/\?change=ch-142$/);
  await expect(page.getByText("The canonical operator shell is live")).toBeVisible();
  await expect.poll(() => detailRequests).toBe(1);

  await page.getByRole("tab", { name: "Gaps" }).click();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "gaps",
  );
  await expect(page.getByText("Launcher dev profile can report ready while managed processes are already stopped.")).toBeVisible();
  await expect(page).toHaveURL(/\?change=ch-142&tab=gaps$/);
  await expect.poll(() => detailRequests).toBe(1);

  await page.getByRole("tab", { name: "Chief" }).click();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "chief",
  );
  await expect(page.getByText("Operator IA is stable")).toBeVisible();
  await expect(page).toHaveURL(/\?change=ch-142&tab=chief$/);

  await page.getByLabel("Search").fill("Codex Chief");
  await expect(page.locator('[data-change-id="ch-142"]')).toBeVisible();
  await expect(page.locator('[data-change-id="ch-150"]')).toHaveCount(0);
  await expect(page).toHaveURL(/q=Codex(?:\+|%20)Chief&change=ch-142&tab=chief$/);
  await expect.poll(() => detailRequests).toBe(1);

  await page.getByLabel("Search").fill("sandbox");
  await expect(page.locator('[data-platform-governance="queue-selection-cleared"]')).toContainText(
    "Selected change cleared.",
  );
  await expect(page.locator('[data-platform-governance="queue-selection-cleared"]')).toContainText(
    "ch-142 is not available because this queue slice is empty.",
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

test("selected-change workspace preserves compact drawer behavior and queue context @platform", async ({
  page,
}) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await gotoShippedApp(page, "/?q=Codex%20Chief&change=ch-142&tab=chief");

  await expect(page.locator('[data-platform-shell="detail-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "true",
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Land the canonical operator shell",
  );
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "chief",
  );
  await expect(page.getByText("Operator IA is stable")).toBeVisible();

  await page.getByRole("button", { name: "Back to queue" }).click();

  await expect(page.locator('[data-platform-shell="detail-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "false",
  );
  await expect(page).toHaveURL(/q=Codex(?:\+|%20)Chief$/);
});

test("surfaces selected-change detail failure without reviving a hidden fallback @platform", async ({
  page,
}) => {
  let detailRequests = 0;

  await page.route("**/api/tenants/tenant-demo/changes/ch-142", async (route) => {
    detailRequests += 1;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "selected change detail unavailable" }),
    });
  });

  await gotoShippedApp(page);
  await page.locator('[data-change-id="ch-142"]').click();

  await expect(page).toHaveURL(/\?change=ch-142$/);
  await expect.poll(() => detailRequests).toBe(1);
  await expect(page.locator('[data-platform-governance="selected-change-error"]')).toContainText(
    "Selected change detail failed.",
  );
  await expect(page.locator('[data-platform-governance="selected-change-error"]')).toContainText(
    "selected change detail unavailable",
  );
  await expect(page.getByRole("button", { name: "Retry detail" })).toBeVisible();
  await expect(page.getByText("The shell fails closed here instead of reviving a hidden legacy detail path.")).toBeVisible();
  await expect(page.locator('[data-platform-surface="tenant-queue-list"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveCount(0);
  await expect(page.getByText("Backend-served default shell")).toHaveCount(0);
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

test("catalog workspace ships repository and change creation workflows with explicit reconciliation @platform", async ({
  page,
}) => {
  const suffix = buildUniqueSuffix();
  const repositoryName = `command-workflow-${suffix}`;
  const repositoryPath = `/tmp/command-workflow-${suffix}`;

  await delayMutationOnce(page, "**/api/tenants", "POST");
  await delayMutationOnce(page, "**/api/tenants/*/changes", "POST");
  await gotoShippedApp(page, "/?workspace=catalog");

  await startRepositoryCreation(page, repositoryName, repositoryPath);
  await expect(page.locator('[data-platform-governance="create-repository-pending"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="repository-profile"]')).toContainText(repositoryName);
  await expect(page.locator(".toast")).toContainText(`Repository ${repositoryName} registered.`);

  await page.locator('[data-platform-action="create-first-change"]').click();
  await expect(page.locator('[data-platform-governance="create-change-pending"]')).toBeVisible();
  const changeId = await extractToastIdentifier(
    page,
    /Change (ch-[a-z0-9]+) created for /,
    "change id",
  );

  await expect(page.locator('[data-platform-action="open-queue"]')).toBeVisible();
  await page.locator('[data-platform-action="open-queue"]').click();

  await expectTenantQueueWorkspace(page, repositoryName);
  await expect(page.locator(`[data-change-id="${changeId}"]`)).toBeVisible();
});

test("catalog workspace surfaces explicit repository creation failure without silent fallback @platform", async ({
  page,
}) => {
  const suffix = buildUniqueSuffix();
  const repositoryName = `command-workflow-failure-${suffix}`;
  const repositoryPath = `/tmp/command-workflow-failure-${suffix}`;

  await failMutationOnce(page, "**/api/tenants", "POST", "forced repository creation failure");
  await gotoShippedApp(page, "/?workspace=catalog");

  await startRepositoryCreation(page, repositoryName, repositoryPath);
  await expect(page.locator('[data-platform-governance="create-repository-error"]')).toContainText(
    "forced repository creation failure",
  );
  await expect(page.getByRole("dialog")).toContainText("New repository");
  await expect(page.locator(".toast")).toHaveCount(0);
  await expect(page).toHaveURL(/\?workspace=catalog$/);
  await expect(page.getByRole("button", { name: "Create repository" })).toBeEnabled();
});

test("realtime degradation is surfaced explicitly and retry restores shared reconciliation @platform", async ({
  page,
}) => {
  let connectionAttempts = 0;

  await page.routeWebSocket(/\/api\/tenants\/[^/]+\/events$/, (ws) => {
    connectionAttempts += 1;
    if (connectionAttempts === 1) {
      void ws.close({ code: 1011, reason: "forced realtime outage" });
      return;
    }

    ws.connectToServer();
  });

  await gotoShippedApp(page);

  await expect(page.locator('[data-platform-governance="realtime-degraded"]')).toContainText(
    "Control API realtime subscription failed.",
  );
  await expect(page.getByRole("button", { name: "Retry realtime" })).toBeVisible();

  await page.getByRole("button", { name: "Retry realtime" }).click();
  await expect(page.locator('[data-platform-governance="realtime-reconciling"]')).toContainText(
    "Retrying realtime subscription for the current tenant.",
  );
  await expect(page.locator('[data-platform-surface="realtime-status"]')).toHaveCount(0);
  await expect.poll(() => connectionAttempts).toBe(2);
  await expect(page.locator('[data-change-id="ch-142"]')).toBeVisible();
});

test("realtime reconciliation ignores stale bootstrap responses and preserves the latest catalog truth @platform", async ({
  page,
  request,
}) => {
  const subscribedTenants = await trackRealtimeSubscriptions(page);
  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-realtime-stale-${suffix}`;
  const repositoryPath = `/tmp/operator-realtime-stale-${suffix}`;

  await gotoShippedApp(page, "/?workspace=catalog");
  await startRepositoryCreation(page, repositoryName, repositoryPath);
  await expect(page.locator('[data-platform-surface="repository-profile"]')).toContainText(repositoryName);

  let delayedBootstrap = false;
  await page.route("**/api/bootstrap", async (route, requestInfo) => {
    if (requestInfo.method() !== "GET" || delayedBootstrap) {
      await route.continue();
      return;
    }

    delayedBootstrap = true;
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ response });
  });

  const tenantId = getRequiredTenantId(page);
  await expect.poll(() => subscribedTenants.has(tenantId)).toBeTruthy();
  const createResponse = await request.post(`/api/tenants/${tenantId}/changes`, {
    data: { title: "Realtime stale snapshot proof" },
  });
  expect(createResponse.ok()).toBeTruthy();
  const changeId = (await createResponse.json()).change.id as string;

  await expect(page.locator('[data-platform-governance="realtime-reconciling"]')).toBeVisible();

  const deleteResponse = await request.delete(`/api/tenants/${tenantId}/changes/${changeId}`);
  expect(deleteResponse.ok()).toBeTruthy();

  await expect(page.locator('[data-platform-action="create-first-change"]')).toBeVisible();
  await expect(page.locator('[data-platform-action="open-queue"]')).toHaveCount(0);
  await expect(page.locator('[data-tenant-id]').filter({ hasText: repositoryName })).toContainText(
    "0 changes · 0 active · 0 blocked",
  );
  await expect(page.locator('[data-platform-surface="realtime-status"]')).toHaveCount(0);
});

test("runs workspace supports hydration, selection, slice restoration, and change handoff @platform", async ({
  page,
}) => {
  let runsRequests = 0;
  let detailRequests = 0;

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/tenants/tenant-demo/runs") {
      runsRequests += 1;
    }
    if (url.pathname === "/api/tenants/tenant-demo/runs/run-30") {
      detailRequests += 1;
    }
  });

  await gotoShippedApp(page, "/?workspace=runs");

  await expectRunsWorkspace(page, "change-control-center-ui");
  await expect(page).toHaveURL(/\?workspace=runs$/);
  await expect.poll(() => runsRequests).toBe(1);

  await page.locator('[data-platform-run-slice="all"]').click();
  await expect(page).toHaveURL(/\?workspace=runs&runSlice=all$/);
  await expect.poll(() => runsRequests).toBe(2);

  await page.locator('[data-run-id="run-30"]').click();
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText("run-30");
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(
    "Launcher lifecycle needs operator review before the next apply loop.",
  );
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(
    "serverRequest/resolved",
  );
  await expect(page).toHaveURL(/\?workspace=runs&runSlice=all&run=run-30$/);
  await expect.poll(() => detailRequests).toBe(1);

  await reloadApp(page);

  await expectRunsWorkspace(page, "change-control-center-ui");
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText("run-30");
  await expect(page).toHaveURL(/\?workspace=runs&runSlice=all&run=run-30$/);
  await expect.poll(() => detailRequests).toBe(2);

  await page.getByRole("button", { name: "Open owning change" }).click();
  await expectTenantQueueWorkspace(page, "change-control-center-ui");
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Land the canonical operator shell",
  );
  await expect(page).toHaveURL(/\?change=ch-142$/);
});

test("runs workspace preserves compact drawer behavior @platform", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await gotoShippedApp(page, "/?workspace=runs&run=run-30");

  await expect(page.locator('[data-platform-shell="run-detail-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "true",
  );
  await expect(page.getByRole("heading", { name: "run-30" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to runs" })).toBeVisible();

  await page.getByRole("button", { name: "Back to runs" }).click();

  await expect(page.locator('[data-platform-shell="run-detail-workspace"]')).toHaveAttribute(
    "data-platform-open",
    "false",
  );
  await expect(page).toHaveURL(/\?workspace=runs$/);
});

test("selected-change clarification and memory workflows reconcile through shipped detail surfaces @platform", async ({
  page,
}) => {
  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-clarifications-${suffix}`;
  const repositoryPath = `/tmp/operator-clarifications-${suffix}`;
  const factTitle = `Runtime memory ${suffix}`;
  const factBody = "Clarification-backed topology choice should persist into tenant memory.";
  const changeId = await createRepositoryChangeAndOpenQueue(page, repositoryName, repositoryPath);

  await page.getByRole("tab", { name: "Clarifications" }).click();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "clarifications",
  );

  await delayMutationOnce(
    page,
    new RegExp(`/api/tenants/[^/]+/changes/${changeId}/clarifications/auto$`),
    "POST",
  );
  await page.locator('[data-platform-action="generate-clarification-round"]').click();
  await expect(page.locator('[data-platform-governance="clarification-command-pending"]').first()).toBeVisible();
  const roundId = await extractToastIdentifier(
    page,
    /Clarification round (clar-[a-z0-9]+) created for /,
    "clarification round id",
  );

  await expect(page.locator('[data-platform-action="generate-clarification-round"]')).toBeDisabled();
  await expect(page.locator('[data-platform-governance="clarification-command-unavailable"]').first()).toContainText(
    "Clarification generation stays disabled while an open round already exists.",
  );
  await expect(page.locator('[data-platform-surface="open-clarification-round"]')).toHaveAttribute(
    "data-clarification-round-id",
    roundId,
  );
  await expect(page.locator('[data-platform-action="submit-clarification-answers"]')).toBeDisabled();
  await expect(page.locator('[data-platform-governance="clarification-command-unavailable"]').last()).toContainText(
    "Answer submission stays disabled until every open question has an option.",
  );

  await page.getByLabel("What problem should this change solve?", { exact: true }).selectOption("yes");
  await page
    .getByLabel("What problem should this change solve? note")
    .fill("Clarified from the shipped operator shell.");

  await delayMutationOnce(
    page,
    new RegExp(`/api/tenants/[^/]+/clarifications/${roundId}/answers$`),
    "POST",
  );
  await page.locator('[data-platform-action="submit-clarification-answers"]').click();
  await expect(page.locator('[data-platform-governance="clarification-command-pending"]').last()).toBeVisible();
  await expect(page.locator(".toast")).toContainText(`Clarification round ${roundId} answered.`);
  await expect(page.locator('[data-platform-surface="open-clarification-round"]')).toHaveCount(0);
  await expect(page.locator(`[data-clarification-round-id="${roundId}"]`)).toHaveAttribute(
    "data-clarification-round-status",
    "answered",
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Clarifications are resolved and the change is ready for proposal.",
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "What problem should this change solve? -> yes",
  );

  await page.getByRole("tab", { name: "Chief" }).click();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "chief",
  );

  await delayMutationOnce(
    page,
    new RegExp(`/api/tenants/[^/]+/changes/${changeId}/promotions$`),
    "POST",
  );
  await page.getByLabel("Fact title").fill(factTitle);
  await page.getByLabel("Fact body").fill(factBody);
  await page.locator('[data-platform-action="promote-tenant-fact"]').click();
  await expect(page.locator('[data-platform-governance="promote-fact-pending"]')).toBeVisible();
  await expect(page.locator(".toast")).toContainText(`Fact ${factTitle} promoted to tenant memory.`);
  await expect(page.locator('[data-platform-surface="tenant-memory-list"]')).toContainText(factTitle);
  await expect(page.locator('[data-platform-surface="tenant-memory-list"]')).toContainText(factBody);
  await expect(page.locator('[data-platform-surface="change-memory-facts"]')).toContainText(factTitle);
  await expect(page.locator('[data-platform-surface="change-memory-facts"]')).toContainText(factBody);
});

test("tenant realtime events reconcile clarification detail without manual refresh @platform", async ({
  page,
  request,
}) => {
  const subscribedTenants = await trackRealtimeSubscriptions(page);
  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-realtime-clarification-${suffix}`;
  const repositoryPath = `/tmp/operator-realtime-clarification-${suffix}`;
  const changeId = await createRepositoryChangeAndOpenQueue(page, repositoryName, repositoryPath);
  const tenantId = getRequiredTenantId(page);
  await expect.poll(() => subscribedTenants.has(tenantId)).toBeTruthy();

  await page.getByRole("tab", { name: "Clarifications" }).click();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "clarifications",
  );

  let delayedBootstrap = false;
  await page.route("**/api/bootstrap", async (route, requestInfo) => {
    if (requestInfo.method() !== "GET" || delayedBootstrap) {
      await route.continue();
      return;
    }

    delayedBootstrap = true;
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({ response });
  });

  const createResponse = await request.post(`/api/tenants/${tenantId}/changes/${changeId}/clarifications/auto`);
  expect(createResponse.ok()).toBeTruthy();
  const roundId = (await createResponse.json()).round.id as string;

  await expect(page.locator('[data-platform-governance="realtime-reconciling"]')).toContainText(
    `Clarification activity for ${changeId} is being reconciled.`,
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toHaveAttribute(
    "data-platform-detail-status",
    "ready",
    { timeout: 15000 },
  );
  await expect(page.locator('[data-platform-surface="open-clarification-round"]')).toHaveAttribute(
    "data-clarification-round-id",
    roundId,
  );
  await expect(page).toHaveURL(new RegExp(`change=${changeId}&tab=clarifications$`));
  await expect(page.locator('[data-platform-surface="realtime-status"]')).toHaveCount(0);
});

test("selected-change clarification workflow surfaces stale round 409 explicitly @platform", async ({
  page,
  request,
}) => {
  await page.routeWebSocket(/\/api\/tenants\/[^/]+\/events$/, (ws) => {
    void ws.close({ code: 1011, reason: "forced stale clarification isolation" });
  });

  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-clarifications-stale-${suffix}`;
  const repositoryPath = `/tmp/operator-clarifications-stale-${suffix}`;
  const changeId = await createRepositoryChangeAndOpenQueue(page, repositoryName, repositoryPath);

  await page.getByRole("tab", { name: "Clarifications" }).click();
  await expect(page.locator('[data-platform-surface="selected-change-tab-panel"]')).toHaveAttribute(
    "data-platform-tab",
    "clarifications",
  );

  await page.locator('[data-platform-action="generate-clarification-round"]').click();
  const roundId = await extractToastIdentifier(
    page,
    /Clarification round (clar-[a-z0-9]+) created for /,
    "clarification round id",
  );

  await page.getByLabel("What problem should this change solve?", { exact: true }).selectOption("yes");
  await page
    .getByLabel("What problem should this change solve? note")
    .fill("Answered elsewhere before this stale UI submits.");

  const tenantId = new URL(page.url()).searchParams.get("tenant");
  if (!tenantId) {
    throw new Error(`Tenant id missing from stale clarification URL: ${page.url()}`);
  }

  const externalAnswerResponse = await request.post(
    `/api/tenants/${tenantId}/clarifications/${roundId}/answers`,
    {
      data: {
        answers: [
          {
            questionId: "q-1",
            selectedOptionId: "yes",
            freeformNote: "Answered by another actor.",
          },
        ],
      },
    },
  );
  expect(externalAnswerResponse.ok()).toBeTruthy();

  await page.locator('[data-platform-action="submit-clarification-answers"]').click();
  await expect(page.locator('[data-platform-governance="clarification-command-error"]').last()).toContainText(
    "Clarification round is already historical",
  );
  await expect(page.locator('[data-platform-surface="open-clarification-round"]')).toBeVisible();
  await expect(page.locator(".toast")).not.toContainText(`Clarification round ${roundId} answered.`);

  await reloadApp(page);

  await expectTenantQueueWorkspace(page, repositoryName);
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(changeId);
  await page.getByRole("tab", { name: "Clarifications" }).click();
  await expect(page.locator('[data-platform-surface="open-clarification-round"]')).toHaveCount(0);
  await expect(page.locator(`[data-clarification-round-id="${roundId}"]`)).toHaveAttribute(
    "data-clarification-round-status",
    "answered",
  );
});

test("run approval decisions surface explicit errors and reconcile to accepted state @platform", async ({
  page,
}) => {
  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-approval-${suffix}`;
  const repositoryPath = `/tmp/operator-approval-${suffix}`;
  const changeId = await createRepositoryChangeAndOpenQueue(page, repositoryName, repositoryPath);

  await page.locator('[data-platform-action="run-next-step"]').click();
  const runId = await extractToastIdentifier(
    page,
    new RegExp(`Run (run-[a-z0-9]+) started for ${changeId}\\.`),
    "run id",
  );

  await page.locator('[data-platform-action="workspace-runs"]').click();
  await expectRunsWorkspace(page, repositoryName);
  await page.locator(`[data-run-id="${runId}"]`).click();
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(runId);
  await expect(page.locator('[data-platform-surface="run-approvals"] [data-approval-id]')).toHaveCount(1);

  await failMutationOnce(
    page,
    /\/api\/tenants\/[^/]+\/approvals\/[^/]+\/decision$/,
    "POST",
    "forced approval decision failure",
  );
  await page.locator('[data-platform-action="accept-approval"]').click();
  await expect(page.locator('[data-platform-governance="run-approval-error"]')).toContainText(
    "forced approval decision failure",
  );
  await expect(page.locator('[data-platform-action="accept-approval"]')).toBeEnabled();

  await delayMutationOnce(
    page,
    /\/api\/tenants\/[^/]+\/approvals\/[^/]+\/decision$/,
    "POST",
  );
  await page.locator('[data-platform-action="accept-approval"]').click();
  await expect(page.locator('[data-platform-governance="run-approval-pending"]')).toBeVisible();
  const approvalId = await extractToastIdentifier(
    page,
    /Approval ([a-z0-9-]+) accepted\./,
    "approval id",
  );
  await expect(page.locator(`[data-approval-id="${approvalId}"]`)).toContainText("Accepted");
  await expect(page.locator(`[data-approval-id="${approvalId}"]`)).toContainText("Decision: accept");
  await expect(page.locator(`[data-approval-id="${approvalId}"] [data-platform-action="accept-approval"]`)).toHaveCount(0);
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(
    "serverRequest/resolved",
  );
});

test("run approval decisions reconcile to declined state and close the action surface @platform", async ({
  page,
}) => {
  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-approval-decline-${suffix}`;
  const repositoryPath = `/tmp/operator-approval-decline-${suffix}`;
  const changeId = await createRepositoryChangeAndOpenQueue(page, repositoryName, repositoryPath);

  await page.locator('[data-platform-action="run-next-step"]').click();
  const runId = await extractToastIdentifier(
    page,
    new RegExp(`Run (run-[a-z0-9]+) started for ${changeId}\\.`),
    "run id",
  );

  await page.locator('[data-platform-action="workspace-runs"]').click();
  await expectRunsWorkspace(page, repositoryName);
  await page.locator(`[data-run-id="${runId}"]`).click();
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(runId);

  await delayMutationOnce(
    page,
    /\/api\/tenants\/[^/]+\/approvals\/[^/]+\/decision$/,
    "POST",
  );
  await page
    .locator('[data-platform-action="decline-approval"]')
    .evaluate((button: HTMLButtonElement) => button.click());
  const approvalId = await extractToastIdentifier(
    page,
    /Approval ([a-z0-9-]+) declined\./,
    "approval id",
  );
  await expect(page.locator(`[data-approval-id="${approvalId}"]`)).toContainText("Declined");
  await expect(page.locator(`[data-approval-id="${approvalId}"]`)).toContainText("Decision: decline");
  await expect(page.locator(`[data-approval-id="${approvalId}"] [data-platform-action="decline-approval"]`)).toHaveCount(0);
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(
    "Resolved approvals remain read-only after reconciliation.",
  );
});

test("selected-change commands escalate successfully and reconcile shipped queue detail @platform", async ({
  page,
}) => {
  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-command-escalate-${suffix}`;
  const repositoryPath = `/tmp/operator-command-escalate-${suffix}`;

  await gotoShippedApp(page, "/?workspace=catalog");
  await startRepositoryCreation(page, repositoryName, repositoryPath);
  await expect(page.locator('[data-platform-surface="repository-profile"]')).toContainText(repositoryName);

  await page.locator('[data-platform-action="create-first-change"]').click();
  const changeId = await extractToastIdentifier(
    page,
    /Change (ch-[a-z0-9]+) created for /,
    "change id",
  );

  await page.locator('[data-platform-action="open-queue"]').click();
  await expectTenantQueueWorkspace(page, repositoryName);
  await page.locator(`[data-change-id="${changeId}"]`).click();
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(changeId);

  await delayMutationOnce(
    page,
    new RegExp(`/api/tenants/[^/]+/changes/${changeId}/actions/escalate$`),
    "POST",
  );
  await page.locator('[data-platform-action="escalate-change"]').click();
  await expect(page.locator('[data-platform-governance="selected-change-command-pending"]')).toBeVisible();
  await expect(page.locator(".toast")).toContainText(`Change ${changeId} escalated.`);
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toHaveAttribute(
    "data-platform-detail-status",
    "ready",
    { timeout: 15000 },
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Operator intervention required",
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Escalated by chief",
  );
  await expect(page.locator('[data-platform-governance="selected-change-command-unavailable"]')).toContainText(
    "Escalate stays disabled once the change is already escalated or done.",
  );
  await expect(page.locator('[data-platform-action="escalate-change"]')).toBeDisabled();
});

test("selected-change commands run next, fail closed, and hand off into the runs workspace @platform", async ({
  page,
}) => {
  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-command-run-${suffix}`;
  const repositoryPath = `/tmp/operator-command-run-${suffix}`;

  await gotoShippedApp(page, "/?workspace=catalog");
  await startRepositoryCreation(page, repositoryName, repositoryPath);
  await expect(page.locator('[data-platform-surface="repository-profile"]')).toContainText(repositoryName);

  await page.locator('[data-platform-action="create-first-change"]').click();
  const changeId = await extractToastIdentifier(
    page,
    /Change (ch-[a-z0-9]+) created for /,
    "change id",
  );

  await page.locator('[data-platform-action="open-queue"]').click();
  await expectTenantQueueWorkspace(page, repositoryName);
  await page.locator(`[data-change-id="${changeId}"]`).click();
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(changeId);

  await delayMutationOnce(
    page,
    new RegExp(`/api/tenants/[^/]+/changes/${changeId}/actions/run-next$`),
    "POST",
  );
  await page.locator('[data-platform-action="run-next-step"]').click();
  await expect(page.locator('[data-platform-governance="selected-change-command-pending"]')).toBeVisible();
  const runId = await extractToastIdentifier(
    page,
    new RegExp(`Run (run-[a-z0-9]+) started for ${changeId}\\.`),
    "run id",
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toHaveAttribute(
    "data-platform-detail-status",
    "ready",
    { timeout: 15000 },
  );

  await expect(page.locator('[data-platform-governance="selected-change-command-unavailable"]')).toContainText(
    "Run next step stays disabled while a backend-owned run is already active.",
  );
  await expect(page.locator('[data-platform-governance="selected-change-command-unavailable"]')).toContainText(
    "Delete change stays disabled while a backend-owned run is still active.",
  );
  await expect(page.locator('[data-platform-action="run-next-step"]')).toBeDisabled();
  await expect(page.locator('[data-platform-action="delete-change"]')).toBeDisabled();

  await page.locator('[data-platform-action="workspace-runs"]').click();
  await expectRunsWorkspace(page, repositoryName);
  await expect(page.locator(`[data-run-id="${runId}"]`)).toBeVisible();
  await page.locator(`[data-run-id="${runId}"]`).click();
  await expect(page.locator('[data-platform-surface="selected-run-workspace"]')).toContainText(runId);

  await page.getByRole("button", { name: "Open owning change" }).click();
  await expectTenantQueueWorkspace(page, repositoryName);
  await expect(page).toHaveURL(new RegExp(`change=${changeId}`));
});

test("selected-change commands surface explicit failure, block-by-spec success, and delete reconciliation @platform", async ({
  page,
}) => {
  const suffix = buildUniqueSuffix();
  const repositoryName = `operator-command-block-${suffix}`;
  const repositoryPath = `/tmp/operator-command-block-${suffix}`;

  await gotoShippedApp(page, "/?workspace=catalog");
  await startRepositoryCreation(page, repositoryName, repositoryPath);
  await expect(page.locator('[data-platform-surface="repository-profile"]')).toContainText(repositoryName);

  await page.locator('[data-platform-action="create-first-change"]').click();
  const changeId = await extractToastIdentifier(
    page,
    /Change (ch-[a-z0-9]+) created for /,
    "change id",
  );

  await page.locator('[data-platform-action="open-queue"]').click();
  await expectTenantQueueWorkspace(page, repositoryName);
  await page.locator(`[data-change-id="${changeId}"]`).click();
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(changeId);

  await failMutationOnce(
    page,
    new RegExp(`/api/tenants/[^/]+/changes/${changeId}/actions/escalate$`),
    "POST",
    "forced operator command failure",
  );
  await page.locator('[data-platform-action="escalate-change"]').click();
  await expect(page.locator('[data-platform-governance="selected-change-command-error"]')).toContainText(
    "forced operator command failure",
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(changeId);

  await page.locator('[data-platform-action="block-change-by-spec"]').click();
  await expect(page.locator(".toast")).toContainText(`Change ${changeId} marked blocked by spec.`);
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toHaveAttribute(
    "data-platform-detail-status",
    "ready",
    { timeout: 15000 },
  );
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Blocked by specification ambiguity",
  );
  await expect(page.locator('[data-platform-governance="selected-change-command-unavailable"]')).toContainText(
    "Run next step stays disabled once the change is blocked, escalated, or already done.",
  );

  await page.locator('[data-platform-action="delete-change"]').click();
  await expect(page.locator(".toast")).toContainText(`Change ${changeId} deleted.`);
  await expect(page.locator(`[data-change-id="${changeId}"]`)).toHaveCount(0);
  await expect(page.locator('[data-platform-surface="queue-selected-change-workspace"]')).toContainText(
    "Choose a queue row",
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
