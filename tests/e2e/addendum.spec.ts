import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 }
] as const;

function watchHealth(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

async function expectReadableLayout(page: Page, width: number) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("h1")).toHaveCount(1);
  const metrics = await page.evaluate(() => ({
    viewport: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src)
  }));
  expect(metrics.scrollWidth, `${width}px horizontal overflow`).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.brokenImages, `${width}px broken images`).toEqual([]);
}

test("MIND ONE editions stay request-only and the comparison publishes no invented Pro entitlements", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const errors = watchHealth(page);
    await page.goto("http://127.0.0.1:4321/products/mindone/");
    await expect(page.locator("h1")).toContainText("MIND ONE");
    await expect(page.locator(".site-header__actions [data-cta='request-demo']")).not.toContainText(/demo/i);
    await expect(page.locator(".site-header__actions [data-cta='request-demo']")).toHaveAttribute("href", /intent=product-enquiry(?:&|$)/);
    await expect(page.locator("[data-cta='request-mindone-access']").first()).toHaveAttribute("href", /product=mindone(?:&|$)/);
    await expect(page.locator("body")).toContainText("An enquiry does not grant product access");
    await expectReadableLayout(page, viewport.width);
    expect(errors, `MIND ONE ${viewport.width}`).toEqual([]);
  }

  await page.goto("http://127.0.0.1:4321/products/mindone-pro/");
  await expect(page.locator("h1")).toContainText("MIND ONE Pro");
  await expect(page.locator("body")).toContainText("No approved Pro-only feature list is published");
  await expect(page.locator(".site-header__actions [data-cta='request-demo']")).toHaveAttribute("href", /product=mindone-pro(?:&|$)/);
  await expectReadableLayout(page, 390);

  await page.goto("http://127.0.0.1:4321/products/mindone/compare/");
  await expect(page.getByRole("table", { name: /Published MIND ONE and MIND ONE Pro positions/ })).toBeVisible();
  await expect(page.locator(".edition-table-wrap")).toHaveAttribute("tabindex", "0");
  await expect(page.locator(".edition-table tbody tr")).toHaveCount(10);
  await expect(page.locator("body")).toContainText("No ATS, MCP or other integration has been verified");
  await expectReadableLayout(page, 390);
});

test("procurement distinguishes its instruments and preserves the Vantor and integration evidence boundaries", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const errors = watchHealth(page);
    await page.goto("http://127.0.0.1:4321/procurement-software/");
    await expect(page.locator("h1")).toContainText("Different jobs.");
    await expect(page.locator(".ecosystem-instrument-card")).toHaveCount(4);
    await expect(page.locator(".conflict-register > li")).toHaveCount(3);
    await expect(page.locator(".integrity-register > li")).toHaveCount(5);
    await expect(page.locator(".ecosystem-boundary")).toContainText("No first-party DigiTracks procurement MCP server was verified");
    await expect(page.locator("[data-cta='request-procurement-demo']").first()).toHaveAttribute("href", /intent=consultation(?:&|$)/);
    await expect(page.locator(".integrity-register a").first()).toHaveAttribute("href", /\/$/);
    await expectReadableLayout(page, viewport.width);
    expect(errors, `Procurement ${viewport.width}`).toEqual([]);
  }
});

test("industry paths render distinct workflows, verified products and consultation intent at every breakpoint", async ({ page }) => {
  const industries = ["education", "healthcare", "beauty-wellness", "business-operations", "procurement", "recruitment"];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const industry of industries) {
      const errors = watchHealth(page);
      await page.goto(`http://127.0.0.1:4321/solutions/${industry}/`);
      await expect(page.locator(".industry-sequence > li")).toHaveCount(3);
      expect(await page.locator(".industry-product-card").count()).toBeGreaterThan(0);
      await expect(page.locator(".industry-questions li")).toHaveCount(3);
      await expect(page.locator(".industry-close a")).toHaveAttribute("href", /intent=consultation(?:&|$)/);
      await expectReadableLayout(page, viewport.width);
      expect(errors, `${industry} ${viewport.width}`).toEqual([]);
    }
  }
});

test("services preserve evaluation, implementation, migration and support enquiry intents", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const errors = watchHealth(page);
    await page.goto("http://127.0.0.1:4321/services/");
    await expect(page.locator(".services-engagement-grid article")).toHaveCount(4);
    await expect(page.locator(".services-engagement-grid a[href*='intent=consultation']")).toHaveCount(2);
    await expect(page.locator(".services-engagement-grid a[href*='intent=migration']")).toHaveCount(1);
    await expect(page.locator(".services-engagement-grid a[href*='intent=support']")).toHaveCount(1);
    await expect(page.locator(".services-boundary")).toContainText("No fixed price, delivery duration, service-level agreement");
    await expectReadableLayout(page, viewport.width);
    expect(errors, `Services ${viewport.width}`).toEqual([]);
  }
});

test("ProcureSherpa Learning uses a local official mark and honest learning-access boundaries", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const errors = watchHealth(page);
    await page.goto("http://127.0.0.1:4322/procuresherpa/");
    await expect(page.locator("h1")).toContainText("Learn the work.");
    await expect(page.locator(".academy-capability-grid > li")).toHaveCount(6);
    await expect(page.locator(".academy-boundary dl > div")).toHaveCount(6);
    await expect(page.locator(".academy-instrument img")).toHaveAttribute("src", "/products/sherpa-toolkit.webp");
    await expect(page.locator(".academy-instrument img")).toHaveJSProperty("complete", true);
    await expect(page.locator(".academy-instrument img")).not.toHaveJSProperty("naturalWidth", 0);
    await expect(page.getByRole("link", { name: "Ask about learning access" })).toHaveAttribute("href", /intent=learning(?:&|$)/);
    await expect(page.locator("body")).toContainText("does not enrol a learner, issue credentials");
    await expectReadableLayout(page, viewport.width);
    expect(errors, `ProcureSherpa Learning ${viewport.width}`).toEqual([]);
  }
});

test("homepage follows the flagship-first portfolio hierarchy at every breakpoint", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const errors = watchHealth(page);
    await page.goto("http://127.0.0.1:4321/");
    await expect(page.locator("h1")).toContainText("Complex work.");
    await expect(page.locator(".hero-home__eyebrow")).toContainText("Product-led technology");
    await expect(page.locator(".home-flagship__edition-grid article")).toHaveCount(2);
    await expect(page.locator(".home-flagship__edition-grid h3").nth(0)).toHaveText("MIND ONE");
    await expect(page.locator(".home-flagship__edition-grid h3").nth(1)).toHaveText("MIND ONE Pro");
    await expect(page.locator("[data-cta='request-mindone-access']")).toHaveAttribute("href", /intent=product-enquiry(?:&|$)/);
    await expect(page.locator(".home-flagship__note")).toContainText("does not grant product access");
    await expect(page.locator(".duo-product")).toHaveCount(2);
    await expect(page.locator(".duo-product h3").nth(0)).toHaveText("Run the institution.");
    await expect(page.locator(".duo-product h3").nth(1)).toHaveText("Review the candidate.");
    await expect(page.locator(".home-procurement__grid > li")).toHaveCount(4);
    await expect(page.locator(".home-procurement__grid")).toContainText("Vertex");
    await expect(page.locator(".home-procurement__grid")).toContainText("Vantor");
    await expect(page.locator(".home-procurement__grid")).toContainText("Procure5");
    await expect(page.locator(".home-procurement__grid")).toContainText("Procure Sherpa");
    await expect(page.locator(".home-procurement__learning")).toContainText("ProcureSherpa Learning");
    await expect(page.locator(".home-services__list > li")).toHaveCount(4);
    await expect(page.locator(".origin-index > li")).toHaveCount(5);
    await expect(page.locator(".family-section")).toHaveCount(0);

    const sectionOrder = await page.locator("main > section").evaluateAll((sections) => sections.slice(0, 4).map((section) => section.className));
    expect(sectionOrder[0]).toContain("hero--home");
    expect(sectionOrder[1]).toContain("home-flagship");
    expect(sectionOrder[2]).toContain("home-duo");
    expect(sectionOrder[3]).toContain("home-procurement");
    await expectReadableLayout(page, viewport.width);
    expect(errors, `Homepage ${viewport.width}`).toEqual([]);
  }
});

test("desktop mega menus support keyboard dismissal and mobile navigation stays within the viewport", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4321/");
  const productsMenu = page.locator(".desktop-nav .nav-menu").first();
  const productsSummary = productsMenu.locator("summary");
  await expect(productsSummary).toHaveText("Products");
  await productsSummary.focus();
  await page.keyboard.press("Enter");
  await expect(productsMenu).toHaveAttribute("open", "");
  await expect(productsMenu.locator(".nav-menu__panel")).toBeVisible();
  const panelBox = await productsMenu.locator(".nav-menu__panel").boundingBox();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(0);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(1440);
  await page.keyboard.press("Escape");
  await expect(productsMenu).not.toHaveAttribute("open", "");
  await expect(productsSummary).toBeFocused();

  const resourcesSummary = page.locator(".desktop-nav .nav-menu--compact > summary");
  await expect(resourcesSummary).toHaveText("Resources");
  await resourcesSummary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".desktop-nav .nav-menu--compact")).toHaveAttribute("open", "");
  await page.locator("h1").click();
  await expect(page.locator(".desktop-nav .nav-menu--compact")).not.toHaveAttribute("open", "");

  for (const viewport of viewports.slice(1)) {
    await page.setViewportSize(viewport);
    await page.goto("http://127.0.0.1:4321/");
    const mobileMenu = page.locator(".mobile-nav");
    const mobileSummary = mobileMenu.locator("summary");
    await expect(mobileSummary).toHaveText("Menu");
    await mobileSummary.click();
    await expect(mobileMenu).toHaveAttribute("open", "");
    const mobilePanel = mobileMenu.locator(".mobile-nav__panel");
    await expect(mobilePanel).toBeVisible();
    await expect(mobilePanel.getByText("Flagship & core", { exact: true })).toBeVisible();
    await expect(mobilePanel.getByText("Procurement", { exact: true })).toBeVisible();
    const box = await mobilePanel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    await page.keyboard.press("Escape");
    await expect(mobileMenu).not.toHaveAttribute("open", "");
    await expect(mobileSummary).toBeFocused();
    await expectReadableLayout(page, viewport.width);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4321/");
  expect(await page.locator(".site-footer__grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(6);
  await page.setViewportSize({ width: 768, height: 1024 });
  expect(await page.locator(".site-footer__grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.locator(".site-footer__grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(1);
});

test("flagship catalogue includes MIND ONE and keeps request-only CTAs out of the demo path", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4321/products/?view=flagships&product=mindone");
  const search = page.getByLabel("Search the catalogue");
  await search.scrollIntoViewIfNeeded();
  await expect(search).toBeEnabled();
  await expect(page.getByLabel("Show")).toHaveValue("flagships");
  await expect(page.locator("#inspector-title")).toHaveText("MIND ONE");
  await expect(page.locator(".catalogue-record").filter({ hasText: "MIND ONE" }).first()).toBeVisible();
  const request = page.locator("[data-cta='request-product-interest']");
  await expect(request).toContainText("Register product interest");
  await expect(request).toHaveAttribute("href", /intent=product-enquiry(?:&|$)/);
  await expect(request).toHaveAttribute("href", /product=mindone(?:&|$)/);
  await expect(page.locator(".catalogue-inspector__note")).toContainText("product access is issued separately");

  await page.getByLabel("Show").selectOption("family");
  await expect(page.locator(".catalogue-record").filter({ hasText: "MIND ONE Pro" })).toBeVisible();
  await page.locator(".catalogue-record").filter({ hasText: "MIND ONE Pro" }).click();
  await expect(page.locator("#inspector-title")).toHaveText("MIND ONE Pro");
  await expect(request).toHaveAttribute("href", /product=mindone-pro(?:&|$)/);
  await expect(page).toHaveURL(/product=mindone-pro/);
});
