import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const sites = [
  { name: "portal", url: "http://127.0.0.1:4321/", trailingSlash: true },
  { name: "learn", url: "http://127.0.0.1:4322/", trailingSlash: true },
  { name: "sourcecraft", url: "http://127.0.0.1:4323/", trailingSlash: true },
  { name: "procuresherpa", url: "http://127.0.0.1:4324/", trailingSlash: false },
  { name: "learnpmo", url: "http://127.0.0.1:4325/plan/", trailingSlash: true },
  { name: "hcmfusion", url: "http://127.0.0.1:4326/", trailingSlash: true }
] as const;

const viewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
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

async function layoutMetrics(page: Page) {
  return page.evaluate(() => {
    const firstSection = document.querySelector("main > section");
    const heading = document.querySelector("h1");
    return {
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      h1Count: document.querySelectorAll("h1").length,
      h1Text: heading?.textContent?.trim() ?? "",
      h1Width: heading?.getBoundingClientRect().width ?? 0,
      firstSectionBottom: firstSection?.getBoundingClientRect().bottom ?? 0,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? ""
    };
  });
}

async function waitForSourceCraft(page: Page) {
  const search = page.getByLabel("Search the public index");
  await search.scrollIntoViewIfNeeded();
  await expect(search).toBeEnabled();
  await expect(page.locator(".source-explorer__status")).toContainText("Saved on this device");
  return search;
}

test("deployment redirect manifests are complete, permanent and one-hop", async () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "inventories/deploy-manifests.json"), "utf8"));
  const allSources = new Set<string>();
  const allTargets = new Set<string>();
  let ruleCount = 0;

  for (const origin of manifest.origins) {
    const publicFile = path.join(root, origin.file);
    const builtFile = path.join(root, `apps/${origin.id}/dist/_redirects`);
    const lines = fs.readFileSync(publicFile, "utf8").trim().split("\n");
    expect(lines).toHaveLength(origin.rules.length);
    expect(fs.readFileSync(builtFile, "utf8")).toBe(fs.readFileSync(publicFile, "utf8"));

    for (const line of lines) {
      const [from, to, status] = line.split(" ");
      const source = new URL(from, origin.origin).toString();
      const target = new URL(to);
      expect(status).toBe("301");
      expect(target.origin).toBe(origin.origin);
      expect(target.toString()).not.toBe(source);
      expect(allSources.has(`${origin.id}:${source}`)).toBe(false);
      expect(allSources.has(`${origin.id}:${target.toString()}`)).toBe(false);
      expect(allTargets.has(`${origin.id}:${source}`)).toBe(false);
      allSources.add(`${origin.id}:${source}`);
      allTargets.add(`${origin.id}:${target.toString()}`);
      ruleCount += 1;
    }
  }

  expect(ruleCount).toBe(manifest.ruleCount);
  expect(ruleCount).toBeGreaterThan(0);
});

test("all six origin homes remain readable without horizontal overflow", async ({ page }) => {
  const metrics: Record<string, unknown[]> = {};
  for (const site of sites) {
    metrics[site.name] = [];
    for (const viewport of viewports) {
      const errors = watchHealth(page);
      await page.setViewportSize(viewport);
      const response = await page.goto(site.url, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      expect(response?.status(), `${site.name} ${viewport.width}`).toBe(200);
      const result = await layoutMetrics(page);
      expect(result.scrollWidth, `${site.name} ${viewport.width} overflow`).toBeLessThanOrEqual(viewport.width);
      expect(result.h1Count, `${site.name} ${viewport.width} heading structure`).toBe(1);
      expect(result.h1Width, `${site.name} ${viewport.width} heading width`).toBeGreaterThan(0);
      if (viewport.width >= 1024 && site.name !== "procuresherpa") {
        expect(result.firstSectionBottom, `${site.name} ${viewport.width} first-screen hero`).toBeLessThanOrEqual(viewport.height + 2);
      }
      expect(errors, `${site.name} ${viewport.width} browser health`).toEqual([]);
      metrics[site.name].push(result);
    }
  }

  const output = path.resolve(import.meta.dirname, "../../artifacts/child-site-qa/layout-metrics.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(metrics, null, 2)}\n`);
});

test("public interfaces use platform terminology instead of Estate labels", async ({ page }) => {
  for (const site of sites) {
    await page.goto(site.url);
    const labels = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const text: string[] = [];
      while (walker.nextNode()) {
        const parent = walker.currentNode.parentElement;
        if (parent && !["SCRIPT", "STYLE"].includes(parent.tagName)) text.push(walker.currentNode.textContent ?? "");
      }
      text.push(document.title);
      for (const element of document.querySelectorAll("[aria-label], [title], [placeholder]")) {
        text.push(element.getAttribute("aria-label") ?? "", element.getAttribute("title") ?? "", element.getAttribute("placeholder") ?? "");
      }
      for (const meta of document.querySelectorAll('meta[name="description"]')) text.push(meta.getAttribute("content") ?? "");
      return text.join(" ");
    });
    expect(labels, site.name).not.toMatch(/\bestate\b/i);
  }

  await page.goto("http://127.0.0.1:4323/regions/");
  await expect(page.locator("body")).not.toContainText(/\bestate\b/i);
});

test("product catalogue filters and inspector selection are shareable URL state", async ({ page }) => {
  await page.goto("http://127.0.0.1:4321/products/?q=unify&discipline=operations&view=flagships&product=unify");
  const search = page.getByLabel("Search the catalogue");
  await search.scrollIntoViewIfNeeded();
  await expect(search).toBeEnabled();
  await expect(search).toHaveValue("unify");
  await expect(page.getByLabel("Show")).toHaveValue("flagships");
  await expect(page.getByRole("button", { name: "Enterprise & operations" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".catalogue-record")).toHaveCount(1);
  await expect(page.locator("#inspector-title")).toHaveText("Unify");
  await search.fill("vertex");
  await expect(page).toHaveURL(/q=vertex/);
  await page.getByRole("button", { name: "All disciplines" }).click();
  await expect(page).toHaveURL(/product=vertex/);
  await expect(page.locator("#inspector-title")).toHaveText("Vertex");

  await page.goBack();
  await expect(page.getByRole("button", { name: "Enterprise & operations" })).toHaveAttribute("aria-pressed", "true");
  await expect(search).toHaveValue("vertex");
  await page.goForward();
  await expect(page.getByRole("button", { name: "All disciplines" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#inspector-title")).toHaveText("Vertex");

  await page.getByRole("button", { name: /Reset filters/ }).click();
  await expect(search).toHaveValue("");
  await expect(page).not.toHaveURL(/q=|discipline=|view=/);
});

test("homepage product atlas restores deep links and records discrete selection history", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4321/?atlas=engineering&atlas-product=recon");
  const atlas = page.locator(".product-atlas");
  await atlas.scrollIntoViewIfNeeded();
  await expect(atlas.getByRole("button", { name: /Engineering/ })).toBeEnabled();
  await expect(atlas.getByRole("button", { name: /Engineering/ })).toHaveAttribute("aria-pressed", "true");
  await expect(atlas.locator(".product-atlas__detail h3")).toHaveText("Recon");

  await atlas.getByRole("button", { name: /Procurement/ }).click();
  await expect(page).toHaveURL(/atlas=procurement/);
  await expect(page).toHaveURL(/atlas-product=vertex/);
  await expect(atlas.locator(".product-atlas__detail h3")).toHaveText("Vertex");

  await page.goBack();
  await expect(page).toHaveURL(/atlas=engineering/);
  await expect(page).toHaveURL(/atlas-product=recon/);
  await expect(atlas.locator(".product-atlas__detail h3")).toHaveText("Recon");
  await page.goForward();
  await expect(atlas.locator(".product-atlas__detail h3")).toHaveText("Vertex");
});

test("Learn orbit nodes are positioned and learning routes stay public", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4322/");
  const nodes = await page.locator(".learning-orbit a").evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    const orbit = element.parentElement!.getBoundingClientRect();
    return {
      x: Math.round(rect.left - orbit.left),
      y: Math.round(rect.top - orbit.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }));
  expect(nodes).toHaveLength(4);
  expect(new Set(nodes.map((node) => `${node.x}:${node.y}`)).size).toBe(4);
  for (const node of nodes) expect(node.width).toBeGreaterThan(0);
  const learningHrefs = await page.locator(".learning-path-grid a").evaluateAll((elements) => elements.map((element) => element.getAttribute("href")).sort());
  expect(learningHrefs).toEqual(["/hcmfusion/", "/learnpmo/", "/procuresherpa/", "/sourcecraft/"]);
  await expect(page.locator(".learning-path-grid")).not.toContainText("Robots.Txt");
  await expect(page.locator(".learning-path-grid")).not.toContainText("Sitemap.Xml");

  await page.goto("http://127.0.0.1:4322/procuresherpa/");
  await expect(page.locator("h1")).toContainText("Learn the work.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.getByRole("link", { name: "Ask about learning access" })).toHaveAttribute("href", /intent=learning(?:&|$)/);
});

test("SourceCraft search, filters, favourites, recents and export use its own storage namespace", async ({ page }) => {
  await page.goto("http://127.0.0.1:4323/");
  const search = await waitForSourceCraft(page);

  await search.fill("approval");
  await expect(page.locator(".source-record")).not.toHaveCount(0);
  await expect(page).toHaveURL(/q=approval/);
  const searchedCount = await page.locator(".source-record").count();
  expect(searchedCount).toBeLessThan(139);

  await search.fill("");
  await page.getByLabel("Region", { exact: true }).selectOption({ index: 1 });
  await expect(page.locator(".source-record")).not.toHaveCount(0);
  await expect(page).toHaveURL(/region=/);
  await page.goBack();
  await expect(page.getByLabel("Region", { exact: true })).toHaveValue("all");
  await expect(page).not.toHaveURL(/region=/);
  await page.goForward();
  await expect(page.getByLabel("Region", { exact: true })).not.toHaveValue("all");
  await page.getByLabel("Region", { exact: true }).selectOption("all");
  await expect(page).not.toHaveURL(/q=|region=/);

  const firstRecord = page.locator(".source-record").first();
  const firstTitle = await firstRecord.locator("h3").innerText();
  const favourite = firstRecord.locator(".favourite-button");
  await favourite.click();
  await expect(favourite).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await waitForSourceCraft(page);
  await page.locator(".source-record").first().scrollIntoViewIfNeeded();
  await expect(page.locator(".source-record").first().getByRole("button", { name: /^Saved:/ })).toHaveAttribute("aria-pressed", "true");

  const stored = await page.evaluate(() => ({
    keys: Object.keys(localStorage).sort(),
    favourites: JSON.parse(localStorage.getItem("digitracks:sourcecraft:favourites:v1") ?? "null")
  }));
  expect(stored.keys).toEqual(["digitracks:sourcecraft:favourites:v1", "digitracks:sourcecraft:recent:v1"]);
  expect(stored.favourites.version).toBe(1);
  expect(stored.favourites.data.favourites).toHaveLength(1);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export favourites" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("sourcecraft-favourites.json");

  await page.getByRole("button", { name: "Clear local list" }).click();
  await expect(page.getByRole("button", { name: "Export favourites" })).toBeDisabled();
  await page.getByRole("button", { name: "Undo clear" }).click();
  await expect(page.getByRole("button", { name: "Export favourites" })).toBeEnabled();
  await expect(page.locator(".source-record").first().getByRole("button", { name: /^Saved:/ })).toHaveAttribute("aria-pressed", "true");

  await page.locator(".source-record").first().locator("h3 a").click();
  await expect(page.locator("h1")).toBeVisible();
  const recent = await page.evaluate(() => JSON.parse(localStorage.getItem("digitracks:sourcecraft:recent:v1") ?? "null"));
  expect(recent.data.recents).toHaveLength(1);

  await page.goto("http://127.0.0.1:4322/");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.goto("http://127.0.0.1:4323/");
  await waitForSourceCraft(page);
  await page.locator(".source-record").first().scrollIntoViewIfNeeded();
  await expect(page.locator(".source-record").first().getByRole("button", { name: /^Saved:/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".source-record").first().locator("h3")).toContainText(firstTitle);
});

test("SourceCraft service worker and public library stay same-origin", async ({ page, context }) => {
  await page.goto("http://127.0.0.1:4323/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const registration = await page.evaluate(async () => {
    const current = await navigator.serviceWorker.getRegistration();
    return { scope: current?.scope, script: current?.active?.scriptURL };
  });
  expect(registration.scope).toBe("http://127.0.0.1:4323/");
  expect(registration.script).toBe("http://127.0.0.1:4323/sw.js");

  const library = await page.request.get("http://127.0.0.1:4323/data/library.json");
  expect(library.status()).toBe(200);
  const payload = await library.json();
  expect(Array.isArray(payload.records)).toBe(true);
  expect(JSON.stringify(payload)).not.toContain("assessment answer");

  const otherOrigin = await context.newPage();
  await otherOrigin.goto("http://127.0.0.1:4322/");
  expect(await otherOrigin.evaluate(() => navigator.serviceWorker.getRegistrations().then((items) => items.length))).toBe(0);
  await otherOrigin.close();
});

test("ProcureSherpa hash navigation, search and local notes persist independently", async ({ page }) => {
  await page.goto("http://127.0.0.1:4324/#/academy");
  await expect(page.locator(".sherpa-route h2")).toBeVisible();
  await page.locator(".sherpa-rail").getByRole("link", { name: /Glossary/ }).click();
  await expect(page).toHaveURL(/#\/glossary$/);
  await expect(page.locator(".sherpa-route h2")).toContainText("Glossary");

  await page.getByLabel("Search preserved routes").fill("contract");
  await expect(page.locator(".sherpa-route-results")).toBeVisible();
  await expect(page).toHaveURL(/q=contract/);
  expect(await page.locator(".sherpa-route-results li").count()).toBeGreaterThan(0);
  await page.getByLabel("Search preserved routes").fill("");
  await expect(page).not.toHaveURL(/q=/);

  const notes = page.getByLabel("Notes saved on this device");
  await notes.fill("Questions for a qualified procurement demo.");
  await expect(page.getByRole("status")).toContainText("Saved locally");
  await page.getByRole("button", { name: "Clear notes" }).click();
  await expect(notes).toHaveValue("");
  await page.getByRole("button", { name: "Undo clear" }).click();
  await expect(notes).toHaveValue("Questions for a qualified procurement demo.");
  await page.reload();
  await expect(notes).toHaveValue("Questions for a qualified procurement demo.");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(["digitracks:procuresherpa:review-notes:v1"]);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export notes" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("procuresherpa-review-notes.json");

  await page.goto("http://127.0.0.1:4324/#/not-a-real-route");
  await expect(page.locator(".sherpa-route h2")).toContainText("not in the preserved manifest");
});

test("LearnPMO root reaches its public guide and private routes remain honest boundaries", async ({ page }) => {
  await page.goto("http://127.0.0.1:4325/");
  await expect(page).toHaveURL(/\/dashboard\/$/);
  await expect(page.locator("h1")).toContainText("Practice workspace");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator("body")).not.toContainText("completed");

  await page.goto("http://127.0.0.1:4325/assumptions/");
  await expect(page.locator("h1")).toContainText("public guide ends here");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.getByRole("link", { name: "Ask about authorised access" })).toHaveAttribute("href", /intent=consultation(?:&|$)/);

  await page.goto("http://127.0.0.1:4325/plan/");
  await expect(page.locator("h1")).toContainText("Study plan");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
});

test("HCM and SourceCraft rights-reserved routes are reachable but not indexable", async ({ page }) => {
  const checks = [
    { url: "http://127.0.0.1:4326/concepts/absence-accrual-plan/", heading: "Permission before republication." },
    { url: "http://127.0.0.1:4323/terms/approval-threshold/", heading: "Permission before republication." }
  ];

  for (const check of checks) {
    const response = await page.goto(check.url);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(check.heading);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    await expect(page.getByRole("link", { name: "Ask about authorised access" })).toHaveAttribute("href", /intent=consultation(?:&|$)/);
    await expect(page.locator("body")).not.toContainText("Correct answer:");
  }

  await page.goto("http://127.0.0.1:4326/sources/gaps/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator("body")).toContainText("UNKNOWN");
});

test("every origin serves a real noindex 404 for unknown paths", async ({ page }) => {
  for (const site of sites) {
    const url = new URL(`this-route-does-not-exist${site.trailingSlash ? "/" : ""}`, site.url);
    const response = await page.goto(url.toString());
    expect(response?.status(), site.name).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    await expect(page.locator("h1")).toContainText(/not here/i);
  }
});

test("unconfigured enquiry delivery collects no details and preserves a contextual email fallback", async ({ page }) => {
  const response = await page.goto("http://127.0.0.1:4321/contact/?intent=demo&product=vedik");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("status")).toContainText("Delivery not configured");
  await expect(page.getByRole("status")).toContainText("No enquiry details are collected in this state");
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.getByLabel("Email", { exact: false })).toHaveCount(0);
  const fallback = page.getByRole("link", { name: "Continue by email" });
  await expect(fallback).toHaveAttribute("href", /^mailto:contact@digitracks\.net\?.*Product%20demo/);
  await expect(fallback).toHaveAttribute("href", /Product%3A%20Vedik/);
  const fallbackHref = decodeURIComponent((await fallback.getAttribute("href")) ?? "");
  expect(fallbackHref).toContain("Product demo");
  expect(fallbackHref).toContain("Vedik");
  await expect(page.getByText("Nothing is sent from this page.")).toBeVisible();
});

test("an unconfigured analytics endpoint sends no browser events", async ({ page }) => {
  let eventCount = 0;
  await page.route("**/api/events", async (route) => {
    eventCount += 1;
    await route.fulfill({ status: 204 });
  });
  await page.goto("http://127.0.0.1:4321/products/unify/");
  await page.getByRole("link", { name: "Request full demo access" }).click();
  await expect(page).toHaveURL(/\/contact\/\?intent=demo&product=unify$/);
  expect(eventCount).toBe(0);
});

test("reduced motion suppresses decorative transitions and animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const site of sites) {
    await page.goto(site.url);
    const motion = await page.evaluate(() => {
      const elements = [...document.querySelectorAll("body *")].slice(0, 500);
      return elements.flatMap((element) => {
        const style = getComputedStyle(element);
        return style.animationName !== "none" ? [`${element.tagName}.${element.className}:${style.animationName}`] : [];
      });
    });
    expect(motion, site.name).toEqual([]);
  }
});

test("the systems engine turns on desktop and keeps static mobile and reduced-motion fallbacks", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4321/");
  const sculpture = page.locator(".ecosystem-sculpture");
  await expect(sculpture).toHaveAttribute("data-state", "ready", { timeout: 15_000 });
  await expect(sculpture.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(1_500);
  const firstPose = await sculpture.screenshot();
  await page.waitForTimeout(1_400);
  const secondPose = await sculpture.screenshot();
  expect(secondPose.equals(firstPose)).toBe(false);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(sculpture).toHaveAttribute("data-state", "fallback");
  await expect(sculpture.locator("canvas")).toHaveCount(0);
  await expect(sculpture.locator(".ecosystem-sculpture__fallback")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(sculpture).toHaveAttribute("data-state", "fallback");
  await expect(sculpture.locator("canvas")).toHaveCount(0);
  await expect(sculpture.locator(".ecosystem-sculpture__fallback")).toBeVisible();
});

test("long product titles stay inside the viewport and capability icons follow their meaning", async ({ page }) => {
  const icons = ["scales", "calculator", "scorecard", "sliders"];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("http://127.0.0.1:4321/products/procure5/procuredecision/");
    const title = page.locator("#product-title");
    await expect(title).toHaveText("ProcureDecision");
    await expect(title).toHaveClass(/hero-product__title--compact/);
    const metrics = await title.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        textRects: [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right }))
      };
    });
    expect(metrics.scrollWidth, `${viewport.width} title overflow`).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.textRects.every((rect) => rect.left >= -1 && rect.right <= viewport.width + 1), `${viewport.width} title bounds`).toBe(true);
    await expect(page.locator(".product-signal__node")).toHaveCount(4);
    for (const [index, icon] of icons.entries()) {
      await expect(page.locator(".product-signal__node").nth(index)).toHaveAttribute("data-capability-icon", icon);
    }
  }
});
