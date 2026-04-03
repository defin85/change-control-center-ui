import { expect, test, type Page } from "@playwright/test";

function uniqueTitle(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createIsolatedChange(page: Page, prefix: string) {
  const title = uniqueTitle(prefix);
  const createResponse = await page.request.post("/api/tenants/tenant-demo/changes", {
    data: { title },
  });
  expect(createResponse.ok()).toBeTruthy();
  const payload = (await createResponse.json()) as { change: { id: string; title: string } };
  return payload.change;
}

async function waitForDetailPanel(page: Page, title: string) {
  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').first();
  await expect(detailPanel.getByRole("heading", { name: title })).toBeVisible();
  return detailPanel;
}

async function openIsolatedChange(page: Page, prefix: string) {
  const change = await createIsolatedChange(page, prefix);
  await page.goto(`/?change=${change.id}`);
  await waitForDetailPanel(page, change.title);
  return change;
}

async function activeElementInsideDialog(page: Page) {
  return page.evaluate(() => {
    const activeElement = document.activeElement;
    return activeElement instanceof HTMLElement && Boolean(activeElement.closest('[role="dialog"]'));
  });
}

test("shows a normalized contract failure when bootstrap payload is invalid @platform", async ({ page }) => {
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ activeTenantId: "tenant-demo" }),
    });
  });

  await page.goto("/");

  await expect(page.getByText(/Control API contract failure/i)).toBeVisible();
});

test("shows a normalized HTTP failure when bootstrap request fails @platform", async ({ page }) => {
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "bootstrap unavailable" }),
    });
  });

  await page.goto("/");

  await expect(page.getByText(/Control API request failed \(HTTP 503\)/i)).toBeVisible();
  await expect(page.getByText(/bootstrap unavailable/i)).toBeVisible();
});

test("renders the operator console surfaces and mandatory detail tabs @smoke @platform", async ({ page }) => {
  await page.goto("/");
  const detailActions = page.locator('[data-platform-shell="detail-panel"]').first();

  await expect(page.locator('[data-platform-shell="workspace-page"]')).toBeVisible();
  await expect(page.locator('[data-platform-shell="master-detail"]')).toBeVisible();
  await expect(page.locator('[data-platform-shell="detail-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="operator-workbench"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="global-actions"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-context"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="control-queue"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-filter-context"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="selected-change-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="signal-summary-card"]')).toHaveCount(4);

  await page.getByRole("button", { name: /ch-146/i }).click();
  await expect(page.locator("header").getByRole("button", { name: "New change" })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: "Run next step" })).toBeVisible();
  await expect(page.getByLabel("Search")).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Views", { exact: true })).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Filters", { exact: true })).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Chief policy", { exact: true })).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Saved slices", { exact: true })).toBeVisible();
  await expect(page.locator(".queue-panel").getByText("Control Queue", { exact: true })).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-filter-context"]').getByText("Active slice")).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-filter-context"]').getByText("Queue filter")).toBeVisible();
  await expect(page.locator('[data-platform-governance="queue-actions-closed"]')).toBeVisible();
  await expect(page.locator('[data-platform-action="saved-filters"]')).toBeDisabled();
  await expect(page.locator('[data-platform-action="export-report"]')).toBeDisabled();
  await expect(page.locator("header").getByRole("button", { name: "Run next step" })).toBeVisible();
  await expect(detailActions.getByRole("button", { name: "Open run studio" })).toHaveAttribute("aria-controls", "run-studio");
  await expect(detailActions.getByRole("button", { name: "Escalate" })).toBeVisible();
  await expect(detailActions.getByRole("button", { name: "Mark blocked by spec" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("tab", { name: "Traceability" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("tab", { name: "Gaps" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("tab", { name: "Git" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("tab", { name: "Chief" })).toBeVisible();
  await expect(page.locator(".tab-list").getByRole("tab", { name: "Clarifications" })).toBeVisible();

  const detailTabs = page.locator(".tab-list");

  await detailTabs.getByRole("tab", { name: "Traceability" }).click();
  await expect(page.getByText("Requirement")).toBeVisible();
  await detailTabs.getByRole("tab", { name: "Gaps" }).click();
  await expect(page.getByText("Severity")).toBeVisible();
  await detailTabs.getByRole("tab", { name: "Git" }).click();
  await expect(page.getByText("Landing status")).toBeVisible();
  await detailTabs.getByRole("tab", { name: "Chief" }).click();
  await expect(page.getByText("Chief History")).toBeVisible();
  await detailTabs.getByRole("tab", { name: "Clarifications" }).click();
  await expect(page.getByRole("button", { name: /generate round/i })).toBeVisible();
});

test("wires the approved foundations on the default operator path @platform", async ({ page }) => {
  const createResponse = await page.request.post("/api/tenants/tenant-demo/changes", {
    data: { title: "Foundation proof change" },
  });
  expect(createResponse.ok()).toBeTruthy();
  const { change } = (await createResponse.json()) as { change: { id: string; title: string } };

  const clarificationResponse = await page.request.post(
    `/api/tenants/tenant-demo/changes/${change.id}/clarifications/auto`,
  );
  expect(clarificationResponse.ok()).toBeTruthy();

  await page.goto("/");

  await expect(page.locator('[data-platform-foundation="base-ui-toolbar"]')).toBeVisible();
  await expect(page.locator('[data-platform-foundation="base-ui-select"]')).toBeVisible();
  await expect(page.locator('[data-platform-foundation="tanstack-table"]')).toBeVisible();
  await expect(page.locator('[data-platform-foundation="base-ui-tabs"]')).toBeVisible();

  await expect(page.getByRole("button", { name: /Foundation proof change/i })).toBeVisible();
  await page.getByRole("button", { name: /Foundation proof change/i }).click();
  await page.getByRole("tab", { name: "Clarifications" }).click();

  await expect(page.locator('[data-platform-foundation="base-ui-clarification-actions"]')).toHaveCount(2);
  await expect(page.locator('[data-platform-foundation="base-ui-radio-group"]')).toHaveCount(1);
  await expect(page.locator('[data-platform-foundation="platform-clarification-textarea"]')).toHaveCount(1);
});

test("creates a new project from the header and switches to its empty tenant workspace @platform", async ({ page }) => {
  const projectName = uniqueTitle("Workspace seed");
  const repoPath = `/tmp/${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "New project" }).click();

  const dialog = page.getByRole("dialog", { name: "New project" });
  await dialog.getByLabel("Project name").fill(projectName);
  await dialog.getByLabel("Repository path").fill(repoPath);
  await dialog.getByLabel("Project description").fill("Created from the operator header.");
  await dialog.getByRole("button", { name: "Create project" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("Tenant")).toContainText(projectName);
  await expect(page.locator(".toast")).toContainText(`Created project ${projectName}.`);
  await expect(page.locator(".queue-panel .empty-state")).toContainText("No changes match the current slice.");
  await expect(page.locator(".hero-ribbon")).toContainText(repoPath);
  await expect(page).toHaveURL(/tenant=tenant-/);
});

test("aligns document language and form semantics on the backend-served shell @platform", async ({ page }) => {
  const change = await createIsolatedChange(page, "Locale semantics proof");
  const createRoundResponse = await page.request.post(`/api/tenants/tenant-demo/changes/${change.id}/clarifications/auto`);
  expect(createRoundResponse.ok()).toBeTruthy();

  await page.goto(`/?change=${change.id}&tab=chief`);
  const detailPanel = await waitForDetailPanel(page, change.title);

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByLabel("Search")).toHaveAttribute("name", "search");
  await expect(page.getByLabel("Tenant")).toBeVisible();

  await detailPanel.getByRole("tab", { name: "Chief" }).click();
  await expect(page.getByLabel("Fact title")).toHaveAttribute("name", "fact-title");
  await expect(page.getByLabel("Fact rationale")).toHaveAttribute("name", "fact-rationale");

  await detailPanel.getByRole("tab", { name: "Clarifications" }).click();
  await expect(page.getByLabel(/Additional clarification note:/).first()).toHaveAttribute("name", /clarification-note-/);
});

test("creates a run and shows runtime lineage in run studio @platform", async ({ page }) => {
  await page.goto("/");

  const detailActions = page.locator('[data-platform-shell="detail-panel"]').first();
  const runStudio = page.locator("#run-studio");

  await page.getByRole("button", { name: /ch-142/i }).click();
  await detailActions.getByRole("tab", { name: "Runs" }).click();
  await page.getByRole("button", { name: /run-30/i }).click();

  await expect(runStudio.getByRole("heading", { name: "run-30" })).toBeVisible();
  await expect(runStudio.getByText("thr_seed_142_30", { exact: true })).toBeVisible();
  await expect(runStudio.getByText("turn_seed_142_30", { exact: true })).toBeVisible();
  await expect(runStudio.getByText(/^stdio$/)).toBeVisible();
  await expect(runStudio.getByText("Runtime Events", { exact: true })).toBeVisible();
  await expect(runStudio.getByText("No runtime events captured for this run.", { exact: true })).toBeVisible();
  await expect(runStudio.getByText("Approvals", { exact: true })).toBeVisible();
  await expect(runStudio.getByText("No approvals captured for this run.", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Evidence" }).click();
  await expect(page.getByText("Compact review output")).toBeVisible();
});

test("persists clarification answers across reload @smoke", async ({ page }) => {
  const change = await createIsolatedChange(page, "Clarification reload proof");
  const createRoundResponse = await page.request.post(`/api/tenants/tenant-demo/changes/${change.id}/clarifications/auto`);
  expect(createRoundResponse.ok()).toBeTruthy();

  await page.goto(`/?change=${change.id}&tab=clarifications`);
  await page.locator(".option-card").first().click();
  await page.getByLabel(/Additional clarification note:/).first().fill("Зафиксировать sidecar deployment.");
  await page.getByRole("button", { name: /submit answers/i }).click();

  await page.reload();
  await expect(page).toHaveURL(new RegExp(`change=${change.id}`));
  await page.getByRole("tab", { name: "Clarifications" }).click();

  await expect(page.getByText("Зафиксировать sidecar deployment.")).toBeVisible();
});

test("restores route-addressable operator context after reload @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  await page.getByLabel("Search").fill("ch-142");
  await page.getByRole("tab", { name: "Runs" }).click();
  await page.getByRole("button", { name: /run-30/i }).click();

  await expect(page).toHaveURL(/change=ch-142/);
  await expect(page).toHaveURL(/run=run-30/);
  await expect(page).toHaveURL(/q=ch-142/);
  await expect(page).toHaveURL(/tab=runs/);

  await page.reload();

  await expect(page.getByLabel("Search")).toHaveValue("ch-142");
  await expect(page.locator(".tab-list [role=\"tab\"][aria-selected=\"true\"]")).toHaveText("Runs");
  await expect(page.locator("#run-studio").getByRole("heading", { name: "run-30" })).toBeVisible();
});

test("restores route-addressable operator context through browser navigation @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  await page.getByRole("tab", { name: "Runs" }).click();
  await page.getByRole("button", { name: /run-30/i }).click();

  await expect(page).toHaveURL(/change=ch-142/);
  await expect(page).toHaveURL(/run=run-30/);
  await expect(page).toHaveURL(/tab=runs/);

  await page.getByRole("button", { name: /ch-146/i }).click();
  await page.locator(".tab-list").getByRole("tab", { name: "Gaps" }).click();

  await expect(page).toHaveURL(/change=ch-146/);
  await expect(page).toHaveURL(/tab=gaps/);

  await page.goBack();

  await expect(page).toHaveURL(/change=ch-142/);
  await expect(page).toHaveURL(/run=run-30/);
  await expect(page).toHaveURL(/tab=runs/);
  await expect(page.locator('[data-platform-foundation="base-ui-tabs"] [role="tab"][aria-selected="true"]')).toHaveText("Runs");
  await expect(page.locator("#run-studio").getByRole("heading", { name: "run-30" })).toBeVisible();

  await page.goForward();

  await expect(page).toHaveURL(/change=ch-146/);
  await expect(page).toHaveURL(/tab=gaps/);
  await expect(page.locator('[data-platform-foundation="base-ui-tabs"] [role="tab"][aria-selected="true"]')).toHaveText("Gaps");
  await expect(page.getByText("Severity")).toBeVisible();
});

test("restores search query through browser navigation @platform", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });
  await page.goto("/");

  const search = page.getByLabel("Search");

  await search.fill("ch-142");
  await expect(page).toHaveURL(/q=ch-142/);

  await search.fill("ch-146");
  await expect(page).toHaveURL(/q=ch-146/);

  await page.goBack();

  await expect(search).toHaveValue("ch-142");
  await expect(page).toHaveURL(/q=ch-142/);
});

test("keeps selected operator context inside the visible filtered queue slice @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  await expect(page).toHaveURL(/change=ch-142/);
  await expect(page.getByRole("heading", { name: "Replace static template with real operator shell" })).toBeVisible();

  const search = page.getByLabel("Search");
  await search.fill("ch-146");

  await expect(page).toHaveURL(/q=ch-146/);
  await expect(page).toHaveURL(/change=ch-146/);
  await expect(page.getByRole("heading", { name: "Bootstrap real app stack" })).toBeVisible();
  await expect(page.locator(".queue-panel").getByRole("button", { name: /ch-142/i })).toHaveCount(0);
  await expect(page.locator(".queue-panel").getByRole("button", { name: /ch-146/i })).toHaveCount(1);

  await page.goBack();

  await expect(search).toHaveValue("");
  await expect(page).toHaveURL(/change=ch-142/);
  await expect(page.getByRole("heading", { name: "Replace static template with real operator shell" })).toBeVisible();
});

test("rehydrates queue context from backend state during same-tenant browser navigation @platform", async ({ page }) => {
  let refreshFromBackend = false;

  await page.route("**/api/tenants/tenant-demo/changes", async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    if (refreshFromBackend) {
      payload.changes = payload.changes.map((change: { id: string; title: string }) =>
        change.id === "ch-142"
          ? {
              ...change,
              title: "Backend rehydrated queue title",
            }
          : change,
      );
    }
    await route.fulfill({
      response,
      json: payload,
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /ch-142/i }).click();
  await page.getByRole("button", { name: /ch-146/i }).click();

  refreshFromBackend = true;
  await page.goBack();

  await expect(page).toHaveURL(/change=ch-142/);
  await expect(page.locator(".queue-panel")).toContainText("Backend rehydrated queue title");
});

test("fails closed on stale cross-tenant route context without a terminal shell error @platform", async ({ page }) => {
  let staleDetailRequests = 0;

  await page.route("**/api/tenants/tenant-sandbox/changes/ch-142", async (route) => {
    staleDetailRequests += 1;
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Change not found" }),
    });
  });

  await page.goto("/?tenant=tenant-sandbox&change=ch-142");

  await expect.poll(() => staleDetailRequests).toBe(0);
  await expect(page.locator('[data-platform-surface="operator-workbench"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Isolated sandbox change" })).toBeVisible();
  await expect(page.getByText(/^Error:/)).toHaveCount(0);
});

test("uses a drawer-style detail workspace on narrow viewports @platform", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });
  await page.goto("/");

  const detailWorkspace = page.locator('[data-platform-shell="detail-workspace"]');
  const selectedQueueRow = page.locator('[data-change-id="ch-142"]');

  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "false");
  await selectedQueueRow.click();
  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "true");
  const dialog = page.getByRole("dialog", { name: "Selected change context" });
  const closeWorkspace = page.getByRole("button", { name: "Close workspace" });

  await expect(dialog).toBeVisible();
  await expect(closeWorkspace).toBeVisible();
  await expect(closeWorkspace).toBeFocused();

  await page.keyboard.press("Tab");
  await expect.poll(() => activeElementInsideDialog(page)).toBe(true);

  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => activeElementInsideDialog(page)).toBe(true);

  await closeWorkspace.click();

  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "false");
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/change=ch-142/);
  await expect(selectedQueueRow).toHaveAttribute("aria-pressed", "true");
  await expect(selectedQueueRow).toBeFocused();
});

test("fails closed on the global run action when no change is selected @platform", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });
  await page.goto("/");

  const headerRunAction = page.locator("header [data-platform-action='run-next-step']").first();

  await expect(headerRunAction).toBeDisabled();
  await expect(page.locator('[data-platform-governance="run-next-selection-required"]')).toBeVisible();

  await page.getByRole("button", { name: /ch-142/i }).click();
  await page.getByRole("button", { name: "Close workspace" }).click();
  await expect(page).toHaveURL(/change=ch-142/);
  await expect(headerRunAction).toBeEnabled();
  await page.locator('.queue-panel [data-platform-action="clear-selection"]').click();

  await expect(headerRunAction).toBeDisabled();
});

test("demotes the global next-step action while a change workspace is focused @platform", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });
  await page.goto("/");

  const headerRunAction = page.locator("header [data-platform-action='run-next-step']").first();

  await expect(headerRunAction).toHaveAttribute("data-platform-hierarchy", "primary");

  await page.getByRole("button", { name: /ch-142/i }).click();
  const detailPanel = page.getByRole("dialog", { name: "Selected change context" }).locator('[data-platform-shell="detail-panel"]').first();
  const detailRunAction = detailPanel.getByRole("button", { name: "Run next step" });

  await expect(headerRunAction).toHaveAttribute("data-platform-hierarchy", "secondary");
  await expect(detailRunAction).toHaveAttribute("data-platform-hierarchy", "primary");
  await page.getByRole("button", { name: "Close workspace" }).click();
  await expect(headerRunAction).toHaveAttribute("data-platform-hierarchy", "primary");
});

test("keeps global header mutations behind an explicit workflow pending boundary @platform", async ({ page }) => {
  await openIsolatedChange(page, "Header workflow pending");

  let delayedRunNext: Promise<void> | null = null;
  await page.route("**/api/tenants/tenant-demo/changes/*/actions/run-next", async (route) => {
    delayedRunNext = (async () => {
      const response = await route.fetch();
      const body = await response.body();
      await delay(300);
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        body,
      });
    })();
    await delayedRunNext;
  });

  const header = page.locator("header");
  const runNext = header.getByRole("button", { name: "Run next step" });
  const newChange = header.getByRole("button", { name: "New change" });
  const newProject = header.getByRole("button", { name: "New project" });

  await runNext.click();

  await expect(runNext).toBeDisabled();
  await expect(newChange).toBeDisabled();
  await expect(newProject).toBeDisabled();
  await expect(page.locator('[data-platform-governance="global-command-pending"]')).toContainText("Run next step");
  await expect.poll(() => delayedRunNext !== null).toBe(true);
  await delayedRunNext;
  await expect(page.locator('[data-platform-governance="global-command-pending"]')).toHaveCount(0);
});

test("surfaces normalized failures for global header mutations @platform", async ({ page }) => {
  await openIsolatedChange(page, "Header workflow failure");

  await page.route("**/api/tenants/tenant-demo/changes/*/actions/run-next", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "header run unavailable" }),
    });
  });

  await page.locator("header").getByRole("button", { name: "Run next step" }).click();

  await expect(page.locator('[data-platform-governance="global-command-error"]')).toContainText("Global command failed.");
  await expect(page.locator('[data-platform-governance="global-command-error"]')).toContainText(
    /Control API request failed \(HTTP 503\)/i,
  );
  await expect(page.locator('[data-platform-governance="global-command-error"]')).toContainText(/header run unavailable/i);
});

test("fails closed on run studio entry until a backend-owned run exists @platform", async ({ page }) => {
  await openIsolatedChange(page, "Run studio gate");

  const detailActions = page.locator('[data-platform-shell="detail-panel"]').first();
  const openRunStudio = detailActions.getByRole("button", { name: "Open run studio" });

  await expect(openRunStudio).toBeDisabled();
  await expect(page.locator('[data-platform-governance="run-studio-run-required"]')).toBeVisible();

  await page.getByRole("button", { name: /ch-142/i }).click();

  await expect(openRunStudio).toBeEnabled();
});

test("deletes the selected change through an explicit confirmation flow @platform", async ({ page }) => {
  const change = await openIsolatedChange(page, "Delete flow");

  await page.getByLabel("Search").fill(change.title);
  const detailActions = page.locator('[data-platform-shell="detail-panel"]').first();
  await detailActions.getByRole("button", { name: "Delete change" }).click();

  const dialog = page.getByRole("alertdialog", { name: new RegExp(`Delete ${change.id}`, "i") });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete change" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".toast")).toContainText(`Deleted ${change.id}.`);
  await expect(page.locator(".queue-panel .empty-state")).toContainText("No changes match the current slice.");
  await expect(page.locator(`[data-change-id="${change.id}"]`)).toHaveCount(0);
  await expect(page).not.toHaveURL(new RegExp(`change=${change.id}`));
});

test("fails closed on clarification submission until an answer is selected @platform", async ({ page }) => {
  const change = await createIsolatedChange(page, "Clarification selection gate");
  const createRoundResponse = await page.request.post(`/api/tenants/tenant-demo/changes/${change.id}/clarifications/auto`);
  expect(createRoundResponse.ok()).toBeTruthy();

  await page.goto(`/?change=${change.id}&tab=clarifications`);

  const submitAnswers = page.getByRole("button", { name: /submit answers/i });

  await expect(submitAnswers).toBeDisabled();
  await expect(page.locator('[data-platform-governance="clarification-selection-required"]')).toBeVisible();

  await page.locator(".option-card").first().click();

  await expect(submitAnswers).toBeEnabled();
});

test("keeps clarification round creation unavailable while an open round already exists @platform", async ({ page }) => {
  const change = await createIsolatedChange(page, "Clarification open-round gate");
  const createRoundResponse = await page.request.post(`/api/tenants/tenant-demo/changes/${change.id}/clarifications/auto`);
  expect(createRoundResponse.ok()).toBeTruthy();

  await page.goto(`/?change=${change.id}&tab=clarifications`);

  const generateRound = page.getByRole("button", { name: /generate round/i });
  await expect(generateRound).toBeDisabled();
  await expect(page.locator('[data-platform-governance="clarification-round-open"]')).toContainText(
    "Finish the active clarification round before generating the next one.",
  );
});

test("keeps historical clarification rounds read-only and resets drafts for the next open round @platform", async ({ page }) => {
  const change = await createIsolatedChange(page, "Clarification history proof");
  const firstRoundResponse = await page.request.post(`/api/tenants/tenant-demo/changes/${change.id}/clarifications/auto`);
  expect(firstRoundResponse.ok()).toBeTruthy();

  await page.goto(`/?change=${change.id}&tab=clarifications`);
  await page.locator(".option-card").first().click();
  await page.getByLabel(/Additional clarification note:/).first().fill("Historical answer should stay visible.");
  await page.getByRole("button", { name: /submit answers/i }).click();

  await expect(page.getByText("Historical answer should stay visible.")).toBeVisible();
  await expect(
    page.getByText("Historical clarification rounds are read-only. Generate a new round to continue planning."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /submit answers/i })).toHaveCount(0);

  const secondRoundResponse = await page.request.post(`/api/tenants/tenant-demo/changes/${change.id}/clarifications/auto`);
  expect(secondRoundResponse.ok()).toBeTruthy();
  await page.reload();

  await expect(page.getByText("Historical answer should stay visible.")).toBeVisible();
  await expect(page.getByLabel(/Additional clarification note:/).first()).toHaveValue("");
  await expect(page.getByRole("button", { name: /submit answers/i })).toBeDisabled();
});

test("fails closed on fact promotion until required inputs are present @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').first();
  await detailPanel.getByRole("tab", { name: "Chief" }).click();

  const promoteFact = detailPanel.getByRole("button", { name: "Promote fact" });

  await expect(promoteFact).toBeDisabled();
  await expect(page.locator('[data-platform-governance="fact-input-required"]')).toBeVisible();

  await page.getByLabel("Fact title").fill("Operator policy");
  await expect(promoteFact).toBeDisabled();

  await page.getByLabel("Fact rationale").fill("Escalate after two repeated fingerprints.");
  await expect(promoteFact).toBeEnabled();
});

test("promotes durable facts through the canonical backend flow @platform", async ({ page }) => {
  const change = await openIsolatedChange(page, "Fact promotion proof");
  const detailPanel = await waitForDetailPanel(page, change.title);
  await detailPanel.getByRole("tab", { name: "Chief" }).click();

  await page.getByLabel("Fact title").fill("Operator memory policy");
  await page.getByLabel("Fact rationale").fill("Escalate after two repeated fingerprints.");
  await detailPanel.getByRole("button", { name: "Promote fact" }).click();

  await expect(detailPanel.getByText("Operator memory policy")).toBeVisible();
  await expect(detailPanel.getByText("Escalate after two repeated fingerprints.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: new RegExp(change.id, "i") }).click();
  const reloadedDetailPanel = await waitForDetailPanel(page, change.title);
  await reloadedDetailPanel.getByRole("tab", { name: "Chief" }).click();

  await expect(reloadedDetailPanel.getByText("Operator memory policy")).toBeVisible();
  await expect(reloadedDetailPanel.getByText("Escalate after two repeated fingerprints.")).toBeVisible();
});

test("preserves the selected run when opening run studio from change detail @platform", async ({ page }) => {
  await openIsolatedChange(page, "Run studio selection proof");
  const detailActions = page.locator('[data-platform-shell="detail-panel"]').first();
  const runStudio = page.locator("#run-studio");

  await detailActions.getByRole("button", { name: "Run next step" }).click();
  await detailActions.getByRole("tab", { name: "Runs" }).click();
  const runRow = detailActions.getByRole("button", { name: /run-\d+/i }).first();
  await expect(runRow).toBeVisible();
  await runRow.click();

  const selectedRunHeading = runStudio.getByRole("heading").first();
  const selectedRunName = await selectedRunHeading.textContent();
  await expect(selectedRunHeading).toBeVisible();

  await detailActions.getByRole("button", { name: "Open run studio" }).click();

  await expect(runStudio.getByRole("heading", { name: selectedRunName ?? "" })).toBeVisible();
});

test("keeps the operator shell available when realtime subscription fails @platform", async ({ page }) => {
  await page.addInitScript(() => {
    class FailingWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = FailingWebSocket.CONNECTING;
      url: string;
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;

      constructor(url: string) {
        this.url = url;
        window.setTimeout(() => {
          this.readyState = FailingWebSocket.CLOSED;
          this.onerror?.(new Event("error"));
          this.onclose?.(new CloseEvent("close"));
        }, 0);
      }

      send() {}

      close() {
        this.readyState = FailingWebSocket.CLOSED;
      }
    }

    window.WebSocket = FailingWebSocket as unknown as typeof WebSocket;
  });

  await page.goto("/");

  await expect(page.locator('[data-platform-surface="operator-workbench"]')).toBeVisible();
  await expect(page.locator('[data-platform-governance="realtime-degraded"]')).toBeVisible();
  await expect(page.getByText(/realtime subscription failed/i)).toBeVisible();
});

test("surfaces realtime degradation after an unexpected close without a socket error @platform", async ({ page }) => {
  await page.addInitScript(() => {
    class ClosingWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = ClosingWebSocket.CONNECTING;
      url: string;
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;

      constructor(url: string) {
        this.url = url;
        window.setTimeout(() => {
          this.readyState = ClosingWebSocket.OPEN;
          this.onopen?.(new Event("open"));
          this.readyState = ClosingWebSocket.CLOSED;
          this.onclose?.(new CloseEvent("close"));
        }, 0);
      }

      send() {}

      close() {
        this.readyState = ClosingWebSocket.CLOSED;
      }
    }

    window.WebSocket = ClosingWebSocket as unknown as typeof WebSocket;
  });

  await page.goto("/");

  await expect(page.locator('[data-platform-surface="operator-workbench"]')).toBeVisible();
  await expect(page.locator('[data-platform-governance="realtime-degraded"]')).toBeVisible();
  await expect(page.getByText(/realtime subscription failed/i)).toBeVisible();
});

test("reconciles only the affected selected surfaces for tenant events @platform", async ({ page }) => {
  let queueRequests = 0;
  let selectedDetailRequests = 0;
  let selectedRunRequests = 0;

  await page.addInitScript(() => {
    const controlledWindow = window as Window & {
      __emitTenantEvent?: (payload: unknown) => void;
    };

    class ControlledWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;
      static instances: ControlledWebSocket[] = [];

      readyState = ControlledWebSocket.CONNECTING;
      url: string;
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;

      constructor(url: string) {
        this.url = url;
        ControlledWebSocket.instances.push(this);
        window.setTimeout(() => {
          this.readyState = ControlledWebSocket.OPEN;
          this.onopen?.(new Event("open"));
        }, 0);
      }

      send() {}

      close() {
        this.readyState = ControlledWebSocket.CLOSED;
        this.onclose?.(new CloseEvent("close"));
      }
    }

    window.WebSocket = ControlledWebSocket as unknown as typeof WebSocket;
    controlledWindow.__emitTenantEvent = (payload: unknown) => {
      for (const socket of ControlledWebSocket.instances) {
        socket.onmessage?.(
          new MessageEvent("message", {
            data: JSON.stringify(payload),
          }),
        );
      }
    };
  });

  await page.route("**/api/tenants/tenant-demo/changes", async (route) => {
    queueRequests += 1;
    await route.continue();
  });
  await page.route("**/api/tenants/tenant-demo/changes/ch-142", async (route) => {
    selectedDetailRequests += 1;
    await route.continue();
  });
  await page.route("**/api/tenants/tenant-demo/runs/run-30", async (route) => {
    selectedRunRequests += 1;
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: /ch-142/i }).click();
  await page.getByRole("tab", { name: "Runs" }).click();
  await page.getByRole("button", { name: /run-30/i }).click();
  await expect(page.locator("#run-studio").getByRole("heading", { name: "run-30" })).toBeVisible();

  const queueRequestsBeforeEvent = queueRequests;
  const detailRequestsBeforeEvent = selectedDetailRequests;
  const runRequestsBeforeEvent = selectedRunRequests;

  await page.evaluate(() => {
    const controlledWindow = window as Window & {
      __emitTenantEvent?: (payload: unknown) => void;
    };

    controlledWindow.__emitTenantEvent?.({
      type: "change-escalated",
      changeId: "ch-146",
    });
  });

  await expect.poll(() => queueRequests).toBe(queueRequestsBeforeEvent + 1);
  await expect
    .poll(() => selectedDetailRequests, {
      message: "unrelated tenant events must not refetch the selected change detail surface",
    })
    .toBe(detailRequestsBeforeEvent);
  await expect
    .poll(() => selectedRunRequests, {
      message: "unrelated tenant events must not refetch the selected run surface",
    })
    .toBe(runRequestsBeforeEvent);
});

test("reconciles tenant events without losing selected operator context @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-146/i }).click();
  await expect(page.getByRole("heading", { name: "Bootstrap real app stack" })).toBeVisible();
  await expect(page.locator(".status-bar")).not.toContainText("Escalated");

  const response = await page.request.post("/api/tenants/tenant-demo/changes/ch-146/actions/escalate");
  expect(response.ok()).toBeTruthy();

  await expect(page.locator(".status-bar")).toContainText("Escalated");
  await expect(page).toHaveURL(/change=ch-146/);
});

test("operator actions create a change, mutate its state, and resolve runtime approvals @smoke @platform", async ({ page }) => {
  await page.goto("/");

  await page.locator("header").getByRole("button", { name: "New change" }).click();
  await page.getByRole("button", { name: /^ch-.* New change/ }).click();
  const detailActions = await waitForDetailPanel(page, "New change");
  await expect(page.locator(".status-bar")).toContainText("draft");

  await detailActions.getByRole("button", { name: "Escalate" }).click();
  await expect(page.locator(".status-bar")).toContainText("Escalated");
  await expect(page.locator(".status-bar")).toContainText("Operator intervention required");

  await detailActions.getByRole("button", { name: "Mark blocked by spec" }).click();
  await expect(page.locator(".status-bar")).toContainText("Blocked by spec");
  await expect(page.locator(".status-bar")).toContainText("Clarify specification");

  const runChange = await createIsolatedChange(page, "Operator action run proof");
  await page.getByRole("button", { name: new RegExp(runChange.id, "i") }).click();
  await expect(page).toHaveURL(new RegExp(`change=${runChange.id}`));
  const runDetailActions = await waitForDetailPanel(page, runChange.title);
  await runDetailActions.getByRole("button", { name: "Run next step" }).click();

  const runStudio = page.locator("#run-studio");
  await expect(runStudio.getByRole("button", { name: "Accept" })).toHaveAttribute(
    "data-platform-foundation",
    "base-ui-approval-actions",
  );
  await expect(runStudio.getByRole("button", { name: "Accept" })).toBeVisible();
  await runStudio.getByRole("button", { name: "Accept" }).click();

  await expect(runStudio.getByText(/accepted/i)).toBeVisible();
  await expect(runStudio.getByText("serverRequest/resolved")).toBeVisible();
});

test("surfaces normalized contract failures for change command mutations @platform", async ({ page }) => {
  await page.route("**/api/tenants/tenant-demo/changes/ch-142/actions/escalate", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "escalation unavailable" }),
    });
  });

  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').first();
  await detailPanel.getByRole("button", { name: "Escalate" }).click();

  await expect(detailPanel.getByText(/Change command failed\./i)).toBeVisible();
  await expect(detailPanel.getByText(/Control API request failed \(HTTP 503\)/i)).toBeVisible();
  await expect(detailPanel.getByText(/escalation unavailable/i)).toBeVisible();
});

test("keeps follow-up refresh failures inside the local change workflow boundary @platform", async ({ page }) => {
  let failNextDetailRefresh = false;

  await page.addInitScript(() => {
    class SilentWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = SilentWebSocket.CONNECTING;
      url: string;
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;

      constructor(url: string) {
        this.url = url;
        window.setTimeout(() => {
          this.readyState = SilentWebSocket.OPEN;
          this.onopen?.(new Event("open"));
        }, 0);
      }

      send() {}

      close() {
        this.readyState = SilentWebSocket.CLOSED;
        this.onclose?.(new CloseEvent("close"));
      }
    }

    window.WebSocket = SilentWebSocket as unknown as typeof WebSocket;
  });

  await page.route("**/api/tenants/tenant-demo/changes/ch-142/actions/escalate", async (route) => {
    const response = await route.fetch();
    failNextDetailRefresh = true;
    await route.fulfill({ response });
  });

  await page.route("**/api/tenants/tenant-demo/changes/ch-142", async (route) => {
    if (failNextDetailRefresh) {
      failNextDetailRefresh = false;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "detail refresh unavailable" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: /ch-142/i }).click();
  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').first();

  await detailPanel.getByRole("button", { name: "Escalate" }).click();

  await expect(detailPanel.getByText(/Change command failed\./i)).toBeVisible();
  await expect(detailPanel.getByText(/Control API request failed \(HTTP 503\)/i)).toBeVisible();
  await expect(detailPanel.getByText(/detail refresh unavailable/i)).toBeVisible();
  await expect(page.getByText(/^Error:/)).toHaveCount(0);
  await expect(page.locator('[data-platform-surface="operator-workbench"]')).toBeVisible();
});

test("surfaces normalized contract failures for fact promotion mutations @platform", async ({ page }) => {
  await page.route("**/api/tenants/tenant-demo/changes/ch-142/promotions", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "promotion unavailable" }),
    });
  });

  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').first();
  await detailPanel.getByRole("tab", { name: "Chief" }).click();

  await page.getByLabel("Fact title").fill("Operator policy");
  await page.getByLabel("Fact rationale").fill("Escalate after two repeated fingerprints.");
  await detailPanel.getByRole("button", { name: "Promote fact" }).click();

  await expect(detailPanel.getByText(/Fact promotion failed\./i)).toBeVisible();
  await expect(detailPanel.getByText(/Control API request failed \(HTTP 503\)/i)).toBeVisible();
  await expect(detailPanel.getByText(/promotion unavailable/i)).toBeVisible();
});

test("keeps gap inspection non-mutating until an explicit action is invoked @platform", async ({ page }) => {
  let blockRequests = 0;

  await page.route("**/api/tenants/tenant-demo/changes/ch-142/actions/block-by-spec", async (route) => {
    blockRequests += 1;
    await route.continue();
  });

  await page.goto("/?change=ch-142&tab=gaps");

  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').first();
  await expect(detailPanel.locator('[data-platform-foundation="base-ui-gap-row"]').first()).toBeVisible();
  await detailPanel.locator('[data-platform-foundation="base-ui-gap-row"]').first().click();

  await expect.poll(() => blockRequests).toBe(0);
  await expect(detailPanel.getByRole("button", { name: "Mark blocked by spec" })).toBeVisible();
  await expect(page.locator(".status-bar")).not.toContainText("Blocked by spec");
});

test("uses approved platform foundations across required operator surfaces @platform", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-platform-foundation="base-ui-operator-rail-view-action"]')).toHaveCount(5);
  await expect(page.locator('[data-platform-foundation="base-ui-operator-rail-filter-action"]')).toHaveCount(3);
  await expect(page.locator('[data-platform-foundation="base-ui-queue-actions"]')).toHaveCount(3);

  await page.getByLabel("Search").fill("ch-142");
  await page.getByRole("button", { name: /ch-142/i }).click();

  await expect(page.locator('[data-platform-foundation="base-ui-queue-row"]')).toHaveCount(1);
  await expect(page.locator('[data-platform-foundation="base-ui-queue-actions"]')).toHaveCount(3);

  const detailPanel = page.locator('[data-platform-shell="detail-panel"]').first();
  await detailPanel.getByRole("tab", { name: "Runs" }).click();
  await expect(page.getByRole("button", { name: /run-30/i })).toHaveAttribute("data-platform-foundation", "base-ui-run-row");

  await detailPanel.getByRole("tab", { name: "Gaps" }).click();
  await expect(page.locator('[data-platform-foundation="base-ui-gap-row"]')).toHaveCount(1);

  await detailPanel.getByRole("tab", { name: "Chief" }).click();
  await expect(page.locator('[data-platform-foundation="base-ui-chief-input"]')).toHaveCount(1);
  await expect(page.locator('[data-platform-foundation="platform-chief-textarea"]')).toHaveCount(1);
  await expect(page.locator('[data-platform-foundation="base-ui-chief-actions"]')).toHaveCount(1);

  await detailPanel.getByRole("tab", { name: "Clarifications" }).click();
  await detailPanel.getByRole("button", { name: /generate round/i }).click();
  await expect(page.locator('[data-platform-foundation="platform-clarification-textarea"]')).toHaveCount(2);
});
