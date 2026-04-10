import type { Page } from "@playwright/test";

export async function gotoApp(page: Page, path = "/") {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

export async function gotoShippedApp(page: Page, path = "/") {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

export async function reloadApp(page: Page) {
  await page.reload({ waitUntil: "domcontentloaded" });
}
