import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { runLighthouse } from "lighthouse/cli/run.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv.includes("--performance") ? "performance" : process.argv.includes("--accessibility") ? "accessibility" : "all";
const chromePath = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("A system Chromium executable is required");
process.env.CHROME_PATH = chromePath;

const apps = [
  { id: "portal", port: 4341, home: "/" },
  { id: "learn", port: 4342, home: "/" },
  { id: "sourcecraft", port: 4343, home: "/" },
  { id: "procuresherpa", port: 4344, home: "/" },
  { id: "learnpmo", port: 4345, home: "/dashboard/" },
  { id: "hcmfusion", port: 4346, home: "/" }
];

const routes = [
  { app: "portal", path: "/", name: "portal-home" },
  { app: "portal", path: "/products/", name: "portal-products" },
  { app: "portal", path: "/products/unify/", name: "portal-product" },
  { app: "portal", path: "/products/mindone/", name: "portal-flagship" },
  { app: "portal", path: "/products/mindone-pro/", name: "portal-flagship-pro" },
  { app: "portal", path: "/products/mindone/compare/", name: "portal-edition-comparison" },
  { app: "portal", path: "/procurement-software/", name: "portal-procurement" },
  { app: "portal", path: "/products/vedik/", name: "portal-elevated-product" },
  { app: "portal", path: "/solutions/education/", name: "portal-industry" },
  { app: "portal", path: "/services/", name: "portal-services" },
  { app: "portal", path: "/contact/", name: "portal-contact" },
  { app: "learn", path: "/", name: "learn-home" },
  { app: "learn", path: "/procuresherpa/", name: "learn-product" },
  { app: "sourcecraft", path: "/", name: "sourcecraft-home" },
  { app: "sourcecraft", path: "/terms/approval-threshold/", name: "sourcecraft-boundary" },
  { app: "procuresherpa", path: "/#/academy", name: "procuresherpa-workspace" },
  { app: "learnpmo", path: "/dashboard/", name: "learnpmo-dashboard" },
  { app: "learnpmo", path: "/plan/", name: "learnpmo-guide" },
  { app: "hcmfusion", path: "/", name: "hcmfusion-home" },
  { app: "hcmfusion", path: "/sources/gaps/", name: "hcmfusion-evidence" }
];

const viewports = [
  { width: 1440, height: 900, name: "desktop" },
  { width: 390, height: 844, name: "mobile" }
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon"
};

function readHeaderRules(dist) {
  const file = path.join(dist, "_headers");
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}; run pnpm build first`);
  const rules = [];
  let current;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (!/^\s/u.test(line)) {
      current = { pattern: line.trim(), headers: [] };
      rules.push(current);
      continue;
    }
    const separator = line.indexOf(":");
    if (!current || separator < 1) throw new Error(`Invalid header rule in ${file}`);
    current.headers.push([line.slice(0, separator).trim(), line.slice(separator + 1).trim()]);
  }
  return rules;
}

function matchesRule(pattern, pathname) {
  if (pattern === "/*") return true;
  if (!pattern.endsWith("/*")) return pattern === pathname;
  const prefix = pattern.slice(0, -1);
  return pathname.startsWith(prefix);
}

function resolveFile(dist, pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("\0")) return undefined;
  if (decoded === "/") {
    const index = path.join(dist, "index.html");
    return fs.existsSync(index) && fs.statSync(index).isFile() ? index : undefined;
  }
  const relative = decoded.replace(/^\/+/, "");
  const candidates = decoded.endsWith("/")
    ? [path.join(dist, relative, "index.html"), path.join(dist, `${relative.slice(0, -1)}.html`)]
    : [path.join(dist, `${relative}.html`), path.join(dist, relative, "index.html"), path.join(dist, relative)];
  return candidates.find((candidate) => {
    const resolved = path.resolve(candidate);
    return resolved.startsWith(`${path.resolve(dist)}${path.sep}`) && fs.existsSync(resolved) && fs.statSync(resolved).isFile();
  });
}

async function startServer(app) {
  const dist = path.join(root, "apps", app.id, "dist");
  if (!fs.existsSync(dist)) throw new Error(`Missing ${dist}; run pnpm build first`);
  const rules = readHeaderRules(dist);
  const notFound = path.join(dist, "404.html");
  if (!fs.existsSync(notFound)) throw new Error(`Missing ${notFound}`);
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", `http://127.0.0.1:${app.port}`).pathname;
    const file = resolveFile(dist, pathname);
    const status = file ? 200 : 404;
    const bodyPath = file ?? notFound;
    const body = fs.readFileSync(bodyPath);
    const headers = {
      "Content-Type": mimeTypes[path.extname(bodyPath)] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store"
    };
    for (const rule of rules) {
      if (!matchesRule(rule.pattern, pathname)) continue;
      for (const [name, value] of rule.headers) headers[name] = value;
    }
    response.writeHead(status, headers);
    response.end(request.method === "HEAD" ? undefined : body);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(app.port, "127.0.0.1", resolve);
  });
  return {
    origin: `http://127.0.0.1:${app.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

function healthWatch(page) {
  const health = { pageErrors: [], consoleErrors: [], failedRequests: [], badResponses: [] };
  page.on("pageerror", (error) => health.pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") health.consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => health.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on("response", (response) => {
    if (response.status() >= 400) health.badResponses.push({ status: response.status(), url: response.url() });
  });
  return health;
}

function hasBrowserErrors(health) {
  return health.pageErrors.length + health.consoleErrors.length + health.failedRequests.length + health.badResponses.length > 0;
}

function assertSecurityHeaders(headers, failures) {
  const csp = headers["content-security-policy"] ?? "";
  const required = [
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["x-frame-options", "DENY"],
    ["cross-origin-opener-policy", "same-origin"],
    ["cross-origin-resource-policy", "same-origin"],
    ["strict-transport-security", "max-age=31536000"]
  ];
  for (const [name, value] of required) {
    if (headers[name] !== value) failures.push(`${name}: expected ${value}, received ${headers[name] ?? "missing"}`);
  }
  for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "upgrade-insecure-requests"]) {
    if (!csp.includes(directive)) failures.push(`CSP missing ${directive}`);
  }
}

async function runAccessibilityAudit(browser, servers) {
  const results = [];
  const failures = [];
  for (const route of routes) {
    const app = apps.find((candidate) => candidate.id === route.app);
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const health = healthWatch(page);
      const url = `${servers[route.app].origin}${route.path}`;
      const response = await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const pageFailures = [];
      if (response?.status() !== 200) pageFailures.push(`Expected HTTP 200, received ${response?.status()}`);
      assertSecurityHeaders(response?.headers() ?? {}, pageFailures);
      // Axe 4.14 resolves transparent descendants to the body under rendering containment.
      await page.addStyleTag({ content: "* { content-visibility: visible !important; }" });
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      for (const violation of axe.violations) {
        pageFailures.push(`${violation.id}: ${violation.nodes.length} node(s) — ${violation.help}`);
      }
      await page.keyboard.press("Tab");
      const keyboard = await page.evaluate(() => {
        const active = document.activeElement;
        const style = active ? getComputedStyle(active) : undefined;
        return {
          firstTabbableText: active?.textContent?.trim() ?? "",
          firstTabbableClass: active?.className ?? "",
          focusOutline: style?.outlineStyle ?? "none",
          scrollWidth: document.documentElement.scrollWidth,
          h1Count: document.querySelectorAll("h1").length,
          landmarks: {
            main: document.querySelectorAll("main").length,
            nav: document.querySelectorAll("nav").length
          }
        };
      });
      if (!keyboard.firstTabbableClass.includes("skip-link")) pageFailures.push("First Tab does not reach the skip link");
      if (keyboard.focusOutline === "none") pageFailures.push("First keyboard focus has no visible outline");
      if (keyboard.scrollWidth > viewport.width) pageFailures.push(`Horizontal overflow: ${keyboard.scrollWidth} > ${viewport.width}`);
      if (keyboard.h1Count !== 1) pageFailures.push(`Expected one H1, received ${keyboard.h1Count}`);
      if (keyboard.landmarks.main !== 1) pageFailures.push(`Expected one main landmark, received ${keyboard.landmarks.main}`);
      if (hasBrowserErrors(health)) pageFailures.push("Browser health errors");
      const result = {
        name: route.name,
        app: route.app,
        path: route.path,
        viewport: viewport.name,
        width: viewport.width,
        status: response?.status(),
        url,
        keyboard,
        health,
        axe: {
          violations: axe.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            nodes: violation.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary, html: node.html }))
          })),
          passes: axe.passes.length,
          incomplete: axe.incomplete.length
        },
        failures: pageFailures
      };
      results.push(result);
      failures.push(...pageFailures.map((failure) => `${route.name}/${viewport.name}: ${failure}`));
      console.log(`${pageFailures.length ? "FAIL" : "PASS"} ${route.name} ${viewport.name}: ${axe.violations.length} axe violation(s)`);
      await context.close();
    }
  }
  return { results, failures };
}

async function runPerformanceAudit(servers) {
  const results = [];
  const failures = [];
  for (const app of apps) {
    const url = `${servers[app.id].origin}${app.home}`;
    console.log(`Lighthouse ${app.id}…`);
    let runner;
    try {
      runner = await runLighthouse(url, {
        hostname: "127.0.0.1",
        logLevel: "silent",
        output: ["json"],
        outputPath: path.join(root, "artifacts", `lighthouse-${app.id}.json`),
        chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
        enableErrorReporting: false
      }, {
        extends: "lighthouse:default",
        settings: {
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          formFactor: "mobile",
          throttlingMethod: "simulate",
          screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
          throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4, requestLatencyMs: 150, downloadThroughputKbps: 1638.4, uploadThroughputKbps: 675 }
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ app: app.id, url, scores: null, metrics: null, failedAudits: [], error: message });
      failures.push(`${app.id}: Lighthouse did not complete: ${message}`);
      console.error(`FAIL ${app.id}: Lighthouse did not complete: ${message}`);
      continue;
    }
    const report = runner.lhr;
    const score = (key) => Math.round((report.categories[key]?.score ?? 0) * 100);
    const metric = (id) => report.audits[id]?.numericValue ?? null;
    const result = {
      app: app.id,
      url,
      finalDisplayedUrl: report.finalDisplayedUrl,
      scores: {
        performance: score("performance"),
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
        seo: score("seo")
      },
      metrics: {
        lcpMs: metric("largest-contentful-paint"),
        inpMs: metric("interaction-to-next-paint"),
        cls: metric("cumulative-layout-shift"),
        totalBlockingTimeMs: metric("total-blocking-time"),
        firstContentfulPaintMs: metric("first-contentful-paint"),
        speedIndexMs: metric("speed-index"),
        transferBytes: report.audits["total-byte-weight"]?.numericValue ?? null,
        javascriptBytes: report.audits["bootup-time"]?.details?.items?.reduce((sum, item) => sum + (item.total ?? 0), 0) ?? null
      },
      failedAudits: Object.values(report.audits)
        .filter((audit) => audit.score !== null && audit.score < 1 && ["performance", "accessibility", "best-practices", "seo"].some((category) => report.categories[category]?.auditRefs?.some((reference) => reference.id === audit.id && reference.weight > 0)))
        .map((audit) => ({ id: audit.id, score: audit.score, title: audit.title, displayValue: audit.displayValue }))
    };
    results.push(result);
    if (result.scores.performance < 95) failures.push(`${app.id}: Lighthouse performance ${result.scores.performance} < 95`);
    if ((result.metrics.lcpMs ?? Infinity) > 2500) failures.push(`${app.id}: LCP ${result.metrics.lcpMs} > 2500ms`);
    if ((result.metrics.cls ?? Infinity) > 0.1) failures.push(`${app.id}: CLS ${result.metrics.cls} > 0.1`);
    if (result.metrics.inpMs !== null && result.metrics.inpMs > 200) failures.push(`${app.id}: INP ${result.metrics.inpMs} > 200ms`);
    console.log(`${result.scores.performance >= 95 ? "PASS" : "FAIL"} ${app.id}: performance ${result.scores.performance}, LCP ${result.metrics.lcpMs}ms, CLS ${result.metrics.cls}`);
  }
  return { results, failures };
}

const servers = {};
for (const app of apps) servers[app.id] = await startServer(app);
let browser;
try {
  const report = { generatedAt: new Date().toISOString(), mode, failures: [] };
  if (mode !== "performance") {
    browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    const accessibility = await runAccessibilityAudit(browser, servers);
    report.accessibility = accessibility.results;
    report.accessibilityGeneratedAt = new Date().toISOString();
    report.failures.push(...accessibility.failures);
    await browser.close();
    browser = undefined;
  }
  if (mode !== "accessibility") {
    const performance = await runPerformanceAudit(servers);
    report.performance = performance.results;
    report.performanceGeneratedAt = new Date().toISOString();
    report.failures.push(...performance.failures);
  }
  const output = path.join(root, "artifacts", "browser-audit.json");
  const previous = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, "utf8")) : {};
  const combined = { ...previous, ...report };
  if (mode !== "performance" && previous.performance) {
    combined.performance = previous.performance;
    combined.performanceGeneratedAt = previous.performanceGeneratedAt;
  }
  if (mode !== "accessibility" && previous.accessibility) {
    combined.accessibility = previous.accessibility;
    combined.accessibilityGeneratedAt = previous.accessibilityGeneratedAt;
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(combined, null, 2)}\n`);
  console.log(`Browser audit written to ${output}`);
  if (report.failures.length) {
    console.error(report.failures.join("\n"));
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  await Promise.all(Object.values(servers).map((server) => server.close()));
}
