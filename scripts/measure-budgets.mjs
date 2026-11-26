import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apps = ["portal", "learn", "sourcecraft", "procuresherpa", "learnpmo", "hcmfusion"];
const limits = {
  htmlGzipBytes: 100_000,
  initialJavaScriptGzipBytes: 75_000,
  initialCssGzipBytes: 60_000,
  fontTransferBytes: 80_000
};
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};
const chromePath = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("A system Chromium executable is required for font-transfer measurement");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function gzip(buffer) {
  return zlib.gzipSync(buffer, { level: 9 }).length;
}

function resolveAsset(dist, reference, baseFile = path.join(dist, "index.html")) {
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean || clean.startsWith("data:")) return undefined;
  const pathname = clean.startsWith("/") ? clean : `/${path.relative(dist, path.resolve(path.dirname(baseFile), clean)).replaceAll(path.sep, "/")}`;
  const candidate = path.resolve(dist, `.${pathname}`);
  return candidate.startsWith(`${path.resolve(dist)}${path.sep}`) && fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : undefined;
}

function resolveRequest(dist, pathname) {
  const relative = pathname.replace(/^\/+/, "");
  const candidates = pathname === "/"
    ? [path.join(dist, "index.html")]
    : pathname.endsWith("/")
      ? [path.join(dist, relative, "index.html"), path.join(dist, `${relative.slice(0, -1)}.html`)]
      : [path.join(dist, `${relative}.html`), path.join(dist, relative, "index.html"), path.join(dist, relative)];
  return candidates.find((candidate) => {
    const resolved = path.resolve(candidate);
    return resolved.startsWith(`${path.resolve(dist)}${path.sep}`) && fs.existsSync(resolved) && fs.statSync(resolved).isFile();
  });
}

async function startServer(app) {
  const dist = path.join(root, "apps", app, "dist");
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const file = resolveRequest(dist, pathname);
    const bodyPath = file ?? path.join(dist, "404.html");
    const body = fs.readFileSync(bodyPath);
    response.writeHead(file ? 200 : 404, {
      "Content-Type": mimeTypes[path.extname(bodyPath)] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store"
    });
    response.end(request.method === "HEAD" ? undefined : body);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { dist, origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

function pageUrl(file, dist) {
  const relative = path.relative(dist, file).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  return `/${relative.replace(/\.html$/, "")}`;
}

function bodyClass(source) {
  return source.match(/<body\b[^>]*\bclass=["']([^"']+)["']/i)?.[1] ?? "";
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
  return match?.[1];
}

function measurePage(dist, file) {
  const html = fs.readFileSync(file);
  const source = html.toString("utf8");
  const cssFiles = new Set();
  const javascriptFiles = new Set();
  const inlineJavaScript = [];
  for (const match of source.matchAll(/<(link|script)\b[^>]*>/gi)) {
    const tag = match[0];
    if (match[1].toLowerCase() === "link") {
      const rel = attribute(tag, "rel") ?? "";
      const href = attribute(tag, "href");
      if (!href || !/\b(stylesheet|modulepreload)\b/i.test(rel)) continue;
      const asset = resolveAsset(dist, href, file);
      if (!asset) throw new Error(`Missing asset ${href} referenced by ${path.relative(root, file)}`);
      if (/\bstylesheet\b/i.test(rel)) cssFiles.add(asset);
      else javascriptFiles.add(asset);
      continue;
    }
    const type = attribute(tag, "type");
    if (type === "application/ld+json") continue;
    const src = attribute(tag, "src");
    if (src) {
      const asset = resolveAsset(dist, src, file);
      if (!asset) throw new Error(`Missing script ${src} referenced by ${path.relative(root, file)}`);
      javascriptFiles.add(asset);
    } else {
      const end = source.indexOf("</script>", match.index);
      inlineJavaScript.push(source.slice((match.index ?? 0) + match[0].length, end < 0 ? undefined : end));
    }
  }

  const cssRaw = [...cssFiles].reduce((total, asset) => total + fs.statSync(asset).size, 0);
  const cssGzip = [...cssFiles].reduce((total, asset) => total + gzip(fs.readFileSync(asset)), 0);
  const scriptRaw = inlineJavaScript.reduce((total, script) => total + Buffer.byteLength(script), 0)
    + [...javascriptFiles].reduce((total, asset) => total + fs.statSync(asset).size, 0);
  const scriptGzip = inlineJavaScript.reduce((total, script) => total + gzip(Buffer.from(script)), 0)
    + [...javascriptFiles].reduce((total, asset) => total + gzip(fs.readFileSync(asset)), 0);

  return {
    app: path.basename(path.dirname(dist)),
    file: path.relative(root, file).replaceAll(path.sep, "/"),
    bodyClass: bodyClass(source),
    htmlRawBytes: html.length,
    htmlGzipBytes: gzip(html),
    initialJavaScriptRawBytes: scriptRaw,
    initialJavaScriptGzipBytes: scriptGzip,
    initialCssRawBytes: cssRaw,
    initialCssGzipBytes: cssGzip,
    fontTransferBytes: 0,
    initialReadingTransferBytes: gzip(html) + scriptGzip + cssGzip,
    assets: {
      css: [...cssFiles].map((asset) => path.relative(root, asset).replaceAll(path.sep, "/")),
      javascript: [...javascriptFiles].map((asset) => path.relative(root, asset).replaceAll(path.sep, "/")),
      fonts: []
    }
  };
}

const pages = [];
const origins = [];
const servers = {};
for (const app of apps) {
  const dist = path.join(root, "apps", app, "dist");
  const files = walk(dist);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const appPages = htmlFiles.map((file) => measurePage(dist, file));
  pages.push(...appPages);
  const largestFiles = files.map((file) => ({ file: path.relative(root, file).replaceAll(path.sep, "/"), bytes: fs.statSync(file).size })).sort((a, b) => b.bytes - a.bytes).slice(0, 8);
  origins.push({ app, dist, htmlFiles, appPages, files, largestFiles });
  servers[app] = await startServer(app);
}

const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  for (const origin of origins) {
    const samples = new Map();
    for (const page of origin.appPages) {
      const current = samples.get(page.bodyClass);
      if (!current || page.htmlRawBytes > current.htmlRawBytes) samples.set(page.bodyClass, page);
    }
    const fontsByClass = new Map();
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      for (const sample of samples.values()) {
        await page.goto(`${servers[origin.app].origin}${pageUrl(path.join(root, sample.file), origin.dist)}`, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.fonts.ready);
        const requested = await page.evaluate(() => performance.getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => /\.(woff2?|ttf|otf)(?:$|[?#])/i.test(name)));
        const fonts = fontsByClass.get(sample.bodyClass) ?? new Set();
        for (const name of requested) {
          const asset = resolveAsset(origin.dist, new URL(name).pathname);
          if (asset) fonts.add(asset);
        }
        fontsByClass.set(sample.bodyClass, fonts);
      }
      await context.close();
    }
    for (const sample of origin.appPages) {
      const fonts = [...(fontsByClass.get(sample.bodyClass) ?? [])];
      const fontTransferBytes = fonts.reduce((total, asset) => total + fs.statSync(asset).size, 0);
      sample.fontTransferBytes = fontTransferBytes;
      sample.initialReadingTransferBytes += fontTransferBytes;
      sample.assets.fonts = fonts.map((asset) => path.relative(root, asset).replaceAll(path.sep, "/"));
    }
  }
} finally {
  await browser.close();
  await Promise.all(Object.values(servers).map((server) => server.close()));
}

const failures = [];
const originResults = [];
for (const origin of origins) {
  const largest = (key) => origin.appPages.reduce((best, page) => !best || page[key] > best[key] ? page : best, null);
  originResults.push({
    app: origin.app,
    htmlFiles: origin.htmlFiles.length,
    totalBytes: origin.files.reduce((total, file) => total + fs.statSync(file).size, 0),
    totalGzipBytes: origin.files.reduce((total, file) => total + gzip(fs.readFileSync(file)), 0),
    maxHtmlGzipBytes: largest("htmlGzipBytes"),
    maxInitialJavaScriptGzipBytes: largest("initialJavaScriptGzipBytes"),
    maxInitialCssGzipBytes: largest("initialCssGzipBytes"),
    maxFontTransferBytes: largest("fontTransferBytes"),
    largestFiles: origin.largestFiles
  });
}
for (const page of pages) {
  for (const [key, limit] of Object.entries(limits)) {
    if (page[key] > limit) failures.push(`${page.file}: ${key} ${page[key]} > ${limit}`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  method: "gzip level 9 for HTML, CSS and JavaScript; font transfer measured from real Chromium requests at 390px and 1440px for every body-class template",
  limits,
  origins: originResults,
  pages,
  failures
};
const output = path.join(root, "artifacts", "budgets.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
for (const origin of originResults) {
  console.log(`${origin.app}: HTML ${origin.maxHtmlGzipBytes.htmlGzipBytes} B, initial JS ${origin.maxInitialJavaScriptGzipBytes.initialJavaScriptGzipBytes} B, CSS ${origin.maxInitialCssGzipBytes.initialCssGzipBytes} B, fonts ${origin.maxFontTransferBytes.fontTransferBytes} B`);
}
console.log(`Byte budgets written to ${output}`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
