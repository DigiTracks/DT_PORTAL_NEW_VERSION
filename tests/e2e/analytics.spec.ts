import { expect, test, type Page, type Route } from "@playwright/test";

const analyticsEndpoint = "**/api/events";

async function captureExports(page: Page, failTransport = false) {
  const payloads: Record<string, unknown>[] = [];
  const headers: Record<string, string>[] = [];
  await page.route(analyticsEndpoint, async (route: Route) => {
    const request = route.request();
    payloads.push(request.postDataJSON() as Record<string, unknown>);
    headers.push(request.headers());
    if (failTransport) await route.abort("failed");
    else await route.fulfill({ status: 204 });
  });
  return { payloads, headers };
}

test("SourceCraft favourite export emits only its resource ID even when telemetry fails", async ({ page }) => {
  const analytics = await captureExports(page, true);
  await page.goto("http://127.0.0.1:4333/");
  const search = page.getByLabel("Search the public index");
  await search.scrollIntoViewIfNeeded();
  await expect(search).toBeEnabled();
  await expect(page.locator(".source-explorer__status")).toContainText("Saved on this device");

  const firstRecord = page.locator(".source-record").first();
  await firstRecord.locator(".favourite-button").click();
  await expect(firstRecord.locator(".favourite-button")).toHaveAttribute("aria-pressed", "true");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export favourites" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("sourcecraft-favourites.json");
  await expect.poll(() => analytics.payloads).toEqual([
    { event: "resource_export", resourceId: "sourcecraft-favourites" }
  ]);
  expect(analytics.headers[0].cookie).toBeUndefined();
  expect(analytics.headers[0].referer).toBeUndefined();
});

test("ProcureSherpa note export emits only its resource ID", async ({ page }) => {
  const analytics = await captureExports(page);
  await page.goto("http://127.0.0.1:4334/");
  const notes = page.getByLabel("Notes saved on this device");
  await notes.fill("Private qualification notes");
  await expect(page.getByRole("status")).toContainText("Saved locally");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export notes" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("procuresherpa-review-notes.json");
  await expect.poll(() => analytics.payloads).toEqual([
    { event: "resource_export", resourceId: "procuresherpa-notes" }
  ]);
  expect(JSON.stringify(analytics.payloads)).not.toContain("Private qualification notes");
  expect(analytics.headers[0].cookie).toBeUndefined();
  expect(analytics.headers[0].referer).toBeUndefined();
});
