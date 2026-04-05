import type { Page } from "@playwright/test";

export async function gotoApp(page: Page, path = "/") {
  await page.goto(normalizeLegacyWorkbenchPath(path), { waitUntil: "domcontentloaded" });
}

export async function gotoShippedApp(page: Page, path = "/") {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

export async function reloadApp(page: Page) {
  await page.reload({ waitUntil: "domcontentloaded" });
}

function normalizeLegacyWorkbenchPath(path: string) {
  const url = new URL(path, "http://127.0.0.1");
  if (url.searchParams.has("legacyWorkbench")) {
    return `${url.pathname}${url.search}`;
  }
  if (url.searchParams.get("workspace") === "catalog") {
    return `${url.pathname}${url.search}`;
  }

  url.searchParams.set("legacyWorkbench", "1");
  return `${url.pathname}${url.search}`;
}
