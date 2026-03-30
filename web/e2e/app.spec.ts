import { expect, test } from "@playwright/test";

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
  const detailActions = page.locator(".detail-stage .detail-panel").first();

  await expect(page.locator('[data-platform-shell="workspace-page"]')).toBeVisible();
  await expect(page.locator('[data-platform-shell="master-detail"]')).toBeVisible();
  await expect(page.locator('[data-platform-shell="detail-workspace"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="operator-workbench"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="global-actions"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-context"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="control-queue"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="queue-filter-context"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="inspector-surface"]')).toBeVisible();
  await expect(page.locator('[data-platform-surface="signal-summary-card"]')).toHaveCount(4);

  await page.getByRole("button", { name: /ch-146/i }).click();
  await expect(page.locator("header").getByRole("button", { name: "New change" })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: "Run next step" })).toBeVisible();
  await expect(page.getByLabel("Search")).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Views", { exact: true })).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Filters", { exact: true })).toBeVisible();
  await expect(page.locator(".operator-rail").getByText("Chief policy", { exact: true })).toBeVisible();
  await expect(page.locator(".inspector-panel").getByText("Inspector", { exact: true })).toBeVisible();
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

test("creates a run and shows runtime lineage in run studio @platform", async ({ page }) => {
  await page.goto("/");

  const detailActions = page.locator(".detail-stage .detail-panel").first();
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
  await page.goto("/");

  await page.getByRole("button", { name: /ch-150/i }).click();
  await page.getByRole("tab", { name: "Clarifications" }).click();
  await page.getByRole("button", { name: /generate round/i }).click();
  await page.getByLabel("Separate sidecar").first().check();
  await page.getByPlaceholder("Дополнительный комментарий").first().fill("Зафиксировать sidecar deployment.");
  await page.getByRole("button", { name: /submit answers/i }).click();

  await page.reload();
  await page.getByRole("button", { name: /ch-150/i }).click();
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

test("uses a drawer-style detail workspace on narrow viewports @platform", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });
  await page.goto("/");

  const detailWorkspace = page.locator('[data-platform-shell="detail-workspace"]');

  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "false");
  await page.getByRole("button", { name: /ch-142/i }).click();
  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "true");
  await expect(detailWorkspace.getByRole("button", { name: "Close workspace" })).toBeVisible();

  await detailWorkspace.getByRole("button", { name: "Close workspace" }).click();

  await expect(detailWorkspace).toHaveAttribute("data-platform-open", "false");
  await expect(page).not.toHaveURL(/change=ch-142/);
});

test("fails closed on the global run action when no change is selected @platform", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 });
  await page.goto("/");

  const headerRunAction = page.locator("header").getByRole("button", { name: "Run next step" });

  await expect(headerRunAction).toBeDisabled();
  await expect(page.locator('[data-platform-governance="run-next-selection-required"]')).toBeVisible();

  await page.getByRole("button", { name: /ch-142/i }).click();

  await expect(headerRunAction).toBeEnabled();

  await page.getByRole("button", { name: "Close workspace" }).click();

  await expect(headerRunAction).toBeDisabled();
});

test("fails closed on run studio entry until a backend-owned run exists @platform", async ({ page }) => {
  await page.goto("/");

  await page.locator("header").getByRole("button", { name: "New change" }).click();
  await page.getByRole("button", { name: /^ch-.* New change/ }).click();

  const detailActions = page.locator(".detail-stage .detail-panel").first();
  const openRunStudio = detailActions.getByRole("button", { name: "Open run studio" });

  await expect(openRunStudio).toBeDisabled();
  await expect(page.locator('[data-platform-governance="run-studio-run-required"]')).toBeVisible();

  await page.getByRole("button", { name: /ch-142/i }).click();

  await expect(openRunStudio).toBeEnabled();
});

test("fails closed on clarification submission until an answer is selected @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-150/i }).click();
  await page.getByRole("tab", { name: "Clarifications" }).click();
  await page.getByRole("button", { name: /generate round/i }).click();

  const submitAnswers = page.getByRole("button", { name: /submit answers/i });

  await expect(submitAnswers).toBeDisabled();
  await expect(page.locator('[data-platform-governance="clarification-selection-required"]')).toBeVisible();

  await page.getByLabel("Separate sidecar").first().check();

  await expect(submitAnswers).toBeEnabled();
});

test("fails closed on fact promotion until required inputs are present @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-142/i }).click();
  const detailPanel = page.locator(".detail-stage .detail-panel").first();
  await detailPanel.getByRole("tab", { name: "Chief" }).click();

  const promoteFact = detailPanel.getByRole("button", { name: "Promote fact" });

  await expect(promoteFact).toBeDisabled();
  await expect(page.locator('[data-platform-governance="fact-input-required"]')).toBeVisible();

  await page.getByPlaceholder("Fact title").fill("Operator policy");
  await expect(promoteFact).toBeDisabled();

  await page.getByPlaceholder("Why this fact should enter tenant memory").fill("Escalate after two repeated fingerprints.");
  await expect(promoteFact).toBeEnabled();
});

test("preserves the selected run when opening run studio from change detail @platform", async ({ page }) => {
  await page.goto("/");

  const detailActions = page.locator(".detail-stage .detail-panel").first();
  const runStudio = page.locator("#run-studio");

  await page.getByRole("button", { name: /ch-142/i }).click();
  await detailActions.getByRole("button", { name: "Run next step" }).click();
  await detailActions.getByRole("tab", { name: "Runs" }).click();
  await page.getByRole("button", { name: /run-30/i }).click();

  await expect(runStudio.getByRole("heading", { name: "run-30" })).toBeVisible();

  await detailActions.getByRole("button", { name: "Open run studio" }).click();

  await expect(runStudio.getByRole("heading", { name: "run-30" })).toBeVisible();
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

test("reconciles tenant events without losing selected operator context @platform", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /ch-146/i }).click();
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
  await expect(page.getByRole("heading", { name: "New change" })).toBeVisible();
  await expect(page.locator(".status-bar")).toContainText("draft");

  const detailActions = page.locator(".detail-stage .detail-panel").first();
  await detailActions.getByRole("button", { name: "Escalate" }).click();
  await expect(page.locator(".status-bar")).toContainText("Escalated");
  await expect(page.locator(".status-bar")).toContainText("Operator intervention required");

  await detailActions.getByRole("button", { name: "Mark blocked by spec" }).click();
  await expect(page.locator(".status-bar")).toContainText("Blocked by spec");
  await expect(page.locator(".status-bar")).toContainText("Clarify specification");

  await page.getByRole("button", { name: /ch-146/i }).click();
  await expect(page).toHaveURL(/change=ch-146/);
  await detailActions.getByRole("button", { name: "Run next step" }).click();

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

test("uses approved platform foundations across required operator surfaces @platform", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-platform-foundation="base-ui-operator-rail-view-action"]')).toHaveCount(5);
  await expect(page.locator('[data-platform-foundation="base-ui-operator-rail-filter-action"]')).toHaveCount(3);
  await expect(page.locator('[data-platform-foundation="base-ui-queue-actions"]')).toHaveCount(2);

  await page.getByLabel("Search").fill("ch-142");
  await page.getByRole("button", { name: /ch-142/i }).click();

  await expect(page.locator('[data-platform-foundation="base-ui-queue-row"]')).toHaveCount(1);
  await expect(page.locator('[data-platform-foundation="base-ui-inspector-actions"]')).toHaveCount(1);

  const detailPanel = page.locator(".detail-stage .detail-panel").first();
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
