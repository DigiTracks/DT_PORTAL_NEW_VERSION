import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { routeRegistry } from "../packages/seo/src/route-registry.generated.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ports = { portal: 4421, learn: 4422, sourcecraft: 4423, procuresherpa: 4424, learnpmo: 4425, hcmfusion: 4426 };
const publicHosts = {
  "digitracks.net": "portal",
  "learn.digitracks.net": "learn",
  "sourcecraft.digitracks.net": "sourcecraft",
  "procuresherpa.digitracks.net": "procuresherpa",
  "learnpmo.digitracks.net": "learnpmo",
  "hcmfusion.digitracks.net": "hcmfusion"
};
const viewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 }
];
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};
export async function collectStylesheetReferences(page) {
  return page.evaluate(() => {
    const urls = [];
    const errors = [];
    const baseURI = document.baseURI;
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = [...sheet.cssRules];
      } catch (error) {
        errors.push({ type: "stylesheet-access", href: sheet.href, error: String(error) });
        continue;
      }
      const stylesheetBase = sheet.href ?? baseURI;
      for (const rule of rules) {
        for (const match of rule.cssText.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/g)) {
          const href = match[1] ?? match[2] ?? match[3] ?? "";
          if (!href || href.startsWith("#")) continue;
          try {
            urls.push(new URL(href, stylesheetBase).href);
          } catch (error) {
            errors.push({ type: "invalid-css-url", href, stylesheetBase, error: String(error) });
          }
        }
      }
    }
    return { urls, errors };
  });
}

export async function verifyFragment(page, item) {
  let response;
  try {
    response = await page.goto(`http://127.0.0.1:${ports[item.origin]}${item.pathname}`, { waitUntil: "networkidle", timeout: 15_000 });
  } catch (error) {
    return { type: "fragment-navigation", ...item, error: String(error) };
  }
  if (!response || response.status() !== 200) {
    return { type: "fragment-http", ...item, http: response?.status() ?? null };
  }
  const found = await page.evaluate((id) => Boolean(document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`)), item.fragment);
  return found ? null : { type: "missing-fragment", ...item };
}

export function monitorNavigationHealth(page) {
  let epoch = 0;
  const requestEpochs = new WeakMap();
  const state = { runtimeErrors: [], failedRequests: [], badResponses: [] };
  const onRequest = (request) => requestEpochs.set(request, epoch);
  const onPageError = (error) => state.runtimeErrors.push(error.message);
  const onConsole = (message) => {
    if (message.type() === "error") state.runtimeErrors.push(message.text());
  };
  const onRequestFailed = (request) => {
    if (requestEpochs.get(request) !== epoch) return;
    state.failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
  };
  const onResponse = (response) => {
    if (requestEpochs.get(response.request()) === epoch && response.status() >= 400) {
      state.badResponses.push(`${response.status()} ${response.url()}`);
    }
  };
  const onFrameNavigated = (frame) => {
    if (frame !== page.mainFrame()) return;
    epoch += 1;
    state.runtimeErrors.length = 0;
    state.failedRequests.length = 0;
    state.badResponses.length = 0;
  };

  page.on("request", onRequest);
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);
  page.on("framenavigated", onFrameNavigated);

  return {
    beginNavigation() {
      epoch += 1;
      state.runtimeErrors.length = 0;
      state.failedRequests.length = 0;
      state.badResponses.length = 0;
    },
    snapshot() {
      return {
        runtimeErrors: [...state.runtimeErrors],
        failedRequests: [...state.failedRequests],
        badResponses: [...state.badResponses]
      };
    },
    close() {
      page.off("request", onRequest);
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
      page.off("requestfailed", onRequestFailed);
      page.off("response", onResponse);
      page.off("framenavigated", onFrameNavigated);
    }
  };
}

export async function decodeLazyImages(page, { timeoutMs = 3_000 } = {}) {
  return page.evaluate(async (decodeTimeoutMs) => {
    const rendered = (image) => {
      const rect = image.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      for (let element = image; element; element = element.parentElement) {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility !== "visible") return false;
      }
      return image.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true, checkContentVisibility: true });
    };
    const lazyImages = [...document.querySelectorAll('img[loading="lazy"]')];
    const images = lazyImages.filter(rendered);
    const failures = [];
    for (const image of images) {
      const src = image.currentSrc || image.src;
      let timeoutId;
      try {
        image.scrollIntoView({ block: "center" });
        const outcome = await Promise.race([
          image.decode().then(() => "decoded").catch((error) => ({ type: "decode-error", error: String(error) })),
          new Promise((resolve) => {
            timeoutId = setTimeout(() => resolve({ type: "decode-timeout" }), decodeTimeoutMs);
          })
        ]);
        if (outcome !== "decoded") failures.push({ ...outcome, src });
      } catch (error) {
        failures.push({ type: "decode-error", src, error: String(error) });
      } finally {
        clearTimeout(timeoutId);
      }
    }
    window.scrollTo(0, 0);
    return {
      count: images.length,
      skipped: lazyImages.length - images.length,
      failures,
      brokenImages: [...document.images]
        .filter((image) => rendered(image) && (!image.complete || image.naturalWidth === 0))
        .map((image) => image.currentSrc || image.src)
    };
  }, timeoutMs);
}

function resolveFile(dist, pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("\0")) return undefined;
  const relative = decoded.replace(/^\/+/, "");
  const candidates = decoded === "/"
    ? [path.join(dist, "index.html")]
    : decoded.endsWith("/")
      ? [path.join(dist, relative, "index.html"), path.join(dist, `${relative.slice(0, -1)}.html`)]
      : [path.join(dist, `${relative}.html`), path.join(dist, relative, "index.html"), path.join(dist, relative)];
  return candidates.find((candidate) => {
    const resolved = path.resolve(candidate);
    return resolved.startsWith(`${path.resolve(dist)}${path.sep}`) && fs.existsSync(resolved) && fs.statSync(resolved).isFile();
  });
}

async function startServer(origin) {
  const dist = path.join(root, "apps", origin, "dist");
  if (!fs.existsSync(path.join(dist, "index.html"))) throw new Error(`Missing ${dist}; run pnpm build first`);
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
      const file = resolveFile(dist, pathname);
      const bodyPath = file ?? path.join(dist, "404.html");
      const body = await fsp.readFile(bodyPath);
      response.writeHead(file ? 200 : 404, { "Content-Type": mimeTypes[path.extname(bodyPath)] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(500);
      response.end("Server error");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(ports[origin], "127.0.0.1", resolve);
  });
  return () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

function localTarget(link) {
  let target;
  try {
    target = new URL(link.href, `http://127.0.0.1:${ports[link.origin]}${link.source}`);
  } catch {
    return { error: "invalid URL" };
  }
  if (!["http:", "https:"].includes(target.protocol)) return undefined;
  const origin = target.hostname === "127.0.0.1"
    ? Object.keys(ports).find((candidate) => ports[candidate] === Number(target.port))
    : publicHosts[target.hostname];
  if (!origin) return undefined;
  return { origin, pathname: target.pathname, fragment: target.hash ? decodeURIComponent(target.hash.slice(1)) : "" };
}

async function main() {
  const chromePath = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((candidate) => fs.existsSync(candidate));
  if (!chromePath) throw new Error("A system Chromium executable is required");
  const routes = routeRegistry.filter((route) => route.indexable);
  if (routes.length !== 86) throw new Error(`Expected 86 indexable routes, found ${routes.length}`);
  const servers = await Promise.all(Object.keys(ports).map(startServer));
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  const health = monitorNavigationHealth(page);

  const issues = [];
  const links = [];
  const fragments = [];
  const cssAssets = [];
  try {
    for (const [routeIndex, route] of routes.entries()) {
      const url = `http://127.0.0.1:${ports[route.origin]}${route.path}`;
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        health.beginNavigation();
        console.log(`Route audit ${routeIndex + 1}/${routes.length}: ${route.origin}${route.path} @ ${viewport.width}px`);
        try {
          const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
          const lazyImages = await decodeLazyImages(page);
          const result = await page.evaluate(() => {
            const visible = (element) => {
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0 && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
            };
            const clipped = [...document.querySelectorAll("h1,h2,h3,h4,p,li,dt,dd,summary,label")]
              .filter((element) => {
                if (!visible(element)) return false;
                const style = getComputedStyle(element);
                if (style.overflow === "visible" && style.textOverflow === "clip") return false;
                return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
              })
              .map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 100), className: String(element.className).slice(0, 100), width: element.clientWidth, scrollWidth: element.scrollWidth, height: element.clientHeight, scrollHeight: element.scrollHeight }));
            const controls = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[role="button"],[role="link"]')]
              .filter(visible)
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return { element, rect, tag: element.tagName, text: element.textContent?.trim().slice(0, 80), label: element.getAttribute("aria-label"), className: String(element.className).slice(0, 100), width: rect.width, height: rect.height };
              });
            const smallControls = controls
              .filter((control) => control.width < 24 || control.height < 24)
              .map((control) => {
                const x = control.rect.left + control.rect.width / 2;
                const y = control.rect.top + control.rect.height / 2;
                const spacingExempt = controls.every((other) => other === control || Math.hypot(other.rect.left + other.rect.width / 2 - x, other.rect.top + other.rect.height / 2 - y) >= 24);
                return { tag: control.tag, text: control.text, label: control.label, className: control.className, width: Math.round(control.width), height: Math.round(control.height), spacingExempt };
              });
            const smallInputs = [...document.querySelectorAll("input,select,textarea")]
              .filter((element) => visible(element) && parseFloat(getComputedStyle(element).fontSize) < 16)
              .map((element) => ({ tag: element.tagName, name: element.getAttribute("name"), fontSize: getComputedStyle(element).fontSize }));
            return {
              h1: document.querySelectorAll("h1").length,
              main: document.querySelectorAll("main").length,
              overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
              pageWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              clipped,
              smallControls,
              confirmedSmallControls: smallControls.filter((control) => !control.spacingExempt),
              smallInputs,
              anchors: [...document.querySelectorAll("a[href]")].map((anchor) => anchor.getAttribute("href")).filter(Boolean)
            };
          });
          const stylesheets = await collectStylesheetReferences(page);
          const browserHealth = health.snapshot();
          const state = {
            route: route.id,
            origin: route.origin,
            path: route.path,
            width: viewport.width,
            http: response?.status(),
            ...result,
            brokenImages: lazyImages.brokenImages,
            lazyImages,
            ...browserHealth
          };
          if (response?.status() !== 200) issues.push({ type: "http", ...state });
          if (result.h1 !== 1 || result.main !== 1) issues.push({ type: "landmarks", ...state });
          if (result.overflow) issues.push({ type: "overflow", ...state });
          if (lazyImages.failures.length) issues.push({ type: "image-decode", ...state });
          if (lazyImages.brokenImages.length) issues.push({ type: "broken-image", ...state });
          if (result.clipped.length) issues.push({ type: "clipped-text", ...state });
          if (result.confirmedSmallControls.length) issues.push({ type: "small-control", ...state });
          if (result.smallInputs.length) issues.push({ type: "small-input", ...state });
          if (browserHealth.runtimeErrors.length || browserHealth.failedRequests.length || browserHealth.badResponses.length) issues.push({ type: "browser-health", ...state });
          for (const error of stylesheets.errors) issues.push({ ...error, route: route.id, origin: route.origin, path: route.path, width: viewport.width });
          for (const href of result.anchors) links.push({ origin: route.origin, source: route.path, href });
          for (const href of stylesheets.urls) cssAssets.push({ origin: route.origin, source: route.path, href });
        } catch (error) {
          issues.push({ type: "navigation", route: route.id, origin: route.origin, path: route.path, width: viewport.width, error: String(error), ...health.snapshot() });
        }
      }
    }
    health.close();

    const brokenLinks = [];
    for (const link of links) {
      const target = localTarget(link);
      if (!target) continue;
      if (target.error) {
        brokenLinks.push({ type: target.error, ...link });
        continue;
      }
      if (target.fragment) fragments.push({ ...link, ...target });
      if (!resolveFile(path.join(root, "apps", target.origin, "dist"), target.pathname)) brokenLinks.push({ type: "missing", ...link, resolvedOrigin: target.origin, resolvedPath: target.pathname });
    }

    const fragmentFailures = [];
    const uniqueFragments = [...new Map(fragments.map((item) => [`${item.origin}|${item.pathname}|${item.fragment}`, item])).values()];
    for (const [fragmentIndex, item] of uniqueFragments.entries()) {
      if (fragmentIndex % 25 === 0) console.log(`Fragment audit ${fragmentIndex + 1}/${uniqueFragments.length}`);
      if (item.fragment.startsWith("/")) continue;
      const failure = await verifyFragment(page, item);
      if (failure) fragmentFailures.push(failure);
    }

    const cssFailures = [];
    for (const asset of cssAssets) {
      if (!asset.href || asset.href.startsWith("data:") || asset.href.startsWith("#")) continue;
      const target = new URL(asset.href);
      if (!["http:", "https:"].includes(target.protocol) || !["127.0.0.1", ...Object.keys(publicHosts)].includes(target.hostname)) continue;
      const origin = target.hostname === "127.0.0.1"
        ? Object.keys(ports).find((candidate) => ports[candidate] === Number(target.port))
        : publicHosts[target.hostname];
      if (!origin) continue;
      const dist = path.join(root, "apps", origin, "dist");
      if (!resolveFile(dist, target.pathname)) cssFailures.push({ ...asset, resolvedOrigin: origin, resolvedPath: target.pathname });
    }

    const report = {
      generatedAt: new Date().toISOString(),
      routes: routes.length,
      states: routes.length * viewports.length,
      issues,
      brokenLinks,
      fragmentFailures,
      cssFailures,
      linkReferences: links.length,
      fragmentReferences: fragments.length,
      cssReferences: cssAssets.length,
      method: {
        targetMinimum: "24x24 CSS px, with WCAG 2.2 spacing exception",
        inputMinimum: "16px to prevent mobile focus zoom",
        lazyImageDecodeTimeoutMs: 3_000,
        imageAuditScope: "rendered images only; responsive-hidden duplicates are excluded",
        requestFailureScope: "requests started in the current document; previous-document aborts are excluded",
        hashRoutes: "validated by dedicated workspace tests"
      }
    };
    await fsp.mkdir(path.join(root, "artifacts"), { recursive: true });
    await fsp.writeFile(path.join(root, "artifacts", "full-route-qa.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({
      routes: report.routes,
      states: report.states,
      issueGroups: Object.fromEntries([...new Set(issues.map((issue) => issue.type))].map((type) => [type, issues.filter((issue) => issue.type === type).length])),
      brokenLinks: brokenLinks.length,
      fragmentFailures: fragmentFailures.length,
      cssFailures: cssFailures.length,
      linkReferences: links.length,
      fragmentReferences: fragments.length
    }, null, 2));
    if (issues.length || brokenLinks.length || fragmentFailures.length || cssFailures.length) process.exitCode = 1;
  } finally {
    await browser.close();
    await Promise.all(servers.map((close) => close()));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
