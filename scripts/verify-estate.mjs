import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { assetRegistry, validateAssetRegistry } from "../packages/brand/src/assets.ts";
import { origins, routeRegistry, routeUrl, validateRouteRegistry } from "../packages/seo/src/index.ts";
import { validateRedirects } from "../packages/seo/src/redirects.ts";

const root = path.resolve(import.meta.dirname, "..");
const errors = [];
const warnings = [];
const counts = { origins: origins.length, routes: routeRegistry.length, htmlFiles: 0, indexablePages: 0, noindexPages: 0, redirectDocuments: 0, socialImages: 0, redirects: 0 };

function fail(message) {
  errors.push(message);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function attributes(source) {
  return Object.fromEntries([...source.matchAll(/([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map((match) => [match[1].toLowerCase(), match[3]]));
}

function documentMeta(html) {
  const meta = {};
  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = attributes(match[1]);
    if (attrs.name || attrs.property) meta[attrs.name ?? attrs.property] = attrs.content ?? "";
  }
  const canonical = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i);
  return { meta, canonical: canonical ? attributes(canonical[0]).href : undefined };
}

function fileForUrl(dist, url) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const relative = pathname.replace(/^\/+/, "");
  const candidates = pathname === "/"
    ? ["index.html"]
    : relative.endsWith("/")
      ? [`${relative}index.html`, `${relative.replace(/\/$/, "")}.html`]
      : path.extname(relative)
        ? [relative]
        : [`${relative}.html`, `${relative}/index.html`];
  return candidates.map((candidate) => path.join(dist, candidate)).find((candidate) => fs.existsSync(candidate));
}

function inlineHashes(html) {
  return [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .filter((match) => match[1].trim())
    .map((match) => `'sha256-${crypto.createHash("sha256").update(match[1]).digest("base64")}'`);
}

const registryErrors = validateRouteRegistry(routeRegistry);
for (const error of registryErrors) fail(`Route registry: ${error}`);
const assetErrors = validateAssetRegistry(assetRegistry);
for (const error of assetErrors) fail(`Asset registry: ${error}`);

const summary = JSON.parse(fs.readFileSync(path.join(root, "inventories/generated-registry-summary.json"), "utf8"));
if (summary.routes !== routeRegistry.length) fail(`Generated route summary is stale: ${summary.routes} !== ${routeRegistry.length}`);
if (summary.baselineSitemapRoutes !== 384) fail(`Baseline sitemap preservation changed: ${summary.baselineSitemapRoutes}`);
if (summary.indexableRoutes !== routeRegistry.filter((route) => route.indexable).length) fail(`Generated indexable summary is stale: ${summary.indexableRoutes} !== ${routeRegistry.filter((route) => route.indexable).length}`);

const manifest = JSON.parse(fs.readFileSync(path.join(root, "inventories/deploy-manifests.json"), "utf8"));
const redirectRules = manifest.origins.flatMap((origin) => origin.rules.map((rule) => ({ ...rule, permanent: true })));
for (const error of validateRedirects(redirectRules)) fail(`Redirect manifest: ${error}`);
counts.redirects = redirectRules.length;

const prohibited = ["github.com/chandrahotha", "garage", "garix", "unsplash.com", "picsum.com", "placeholder.com", "lorem ipsum"];
for (const origin of origins) {
  const dist = path.join(root, "apps", origin.id, "dist");
  const publicDirectory = path.join(root, "apps", origin.id, "public");
  for (const required of ["index.html", "404.html", "robots.txt", "sitemap.xml", "_redirects", "_headers"]) {
    if (!fs.existsSync(path.join(dist, required))) fail(`${origin.id}: missing dist/${required}`);
  }
  const publicRedirects = path.join(publicDirectory, "_redirects");
  if (fs.existsSync(publicRedirects) && fs.readFileSync(publicRedirects, "utf8") !== fs.readFileSync(path.join(dist, "_redirects"), "utf8")) {
    fail(`${origin.id}: built redirects differ from public redirects`);
  }

  const headers = fs.existsSync(path.join(dist, "_headers")) ? fs.readFileSync(path.join(dist, "_headers"), "utf8") : "";
  for (const header of ["X-Content-Type-Options: nosniff", "Strict-Transport-Security:", "Content-Security-Policy:", "Referrer-Policy: strict-origin-when-cross-origin", "X-Frame-Options: DENY"]) {
    if (!headers.includes(header)) fail(`${origin.id}: security headers missing ${header}`);
  }
  const csp = headers.match(/Content-Security-Policy: ([^\n]+)/)?.[1] ?? "";
  if (!csp.includes("default-src 'self'") || !csp.includes("object-src 'none'") || !csp.includes("frame-ancestors 'none'")) fail(`${origin.id}: CSP baseline is incomplete`);
  const scriptSrc = csp.split(";").find((directive) => directive.trim().startsWith("script-src")) ?? "";
  if (scriptSrc.includes("'unsafe-inline'")) fail(`${origin.id}: script-src must use exact hashes, not unsafe-inline`);

  const robots = fs.existsSync(path.join(dist, "robots.txt")) ? fs.readFileSync(path.join(dist, "robots.txt"), "utf8") : "";
  if (!robots.includes(`${origin.origin}/sitemap.xml`)) fail(`${origin.id}: robots.txt does not name its own sitemap`);

  const sitemap = fs.existsSync(path.join(dist, "sitemap.xml")) ? fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8") : "";
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expectedUrls = routeRegistry
    .filter((route) => route.origin === origin.id && route.routeClass === "public-seo" && route.indexable && !route.redirectTo)
    .map((route) => routeUrl(route.origin, route.path));
  if (locations.length !== expectedUrls.length) fail(`${origin.id}: sitemap has ${locations.length} URLs, expected ${expectedUrls.length}`);
  if (new Set(locations).size !== locations.length) fail(`${origin.id}: sitemap contains duplicate URLs`);
  for (const location of locations) {
    try {
      if (new URL(location).origin !== origin.origin) fail(`${origin.id}: sitemap crosses origin: ${location}`);
    } catch {
      fail(`${origin.id}: sitemap contains an invalid URL: ${location}`);
    }
  }

  const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
  counts.htmlFiles += htmlFiles.length;
  for (const file of htmlFiles) {
    const relative = path.relative(dist, file);
    const html = fs.readFileSync(file, "utf8");
    const { meta, canonical } = documentMeta(html);
    const refresh = html.match(/<meta\b[^>]*http-equiv=["']refresh["'][^>]*content=["']0;\s*url=([^"']+)["'][^>]*>/i)
      ?? html.match(/<meta\b[^>]*content=["']0;\s*url=([^"']+)["'][^>]*http-equiv=["']refresh["'][^>]*>/i);
    if (refresh) {
      counts.redirectDocuments += 1;
      if (meta.robots !== "noindex") fail(`${origin.id}/${relative}: redirect document must be noindex`);
      let destination;
      try {
        destination = new URL(refresh[1], origin.origin);
      } catch {
        fail(`${origin.id}/${relative}: redirect document has an invalid destination`);
      }
      if (destination && destination.origin !== origin.origin) fail(`${origin.id}/${relative}: redirect document crosses origin`);
      if (canonical && destination && canonical !== destination.toString()) fail(`${origin.id}/${relative}: redirect canonical does not match its destination`);
    } else {
      const h1Count = (html.match(/<h1\b/gi) ?? []).length;
      if (h1Count !== 1) fail(`${origin.id}/${relative}: expected one h1, found ${h1Count}`);
      const robotsValue = meta.robots;
      if (!robotsValue) fail(`${origin.id}/${relative}: missing robots meta`);
      const indexable = robotsValue === "index, follow";
      if (indexable) {
        counts.indexablePages += 1;
        if (!canonical) fail(`${origin.id}/${relative}: indexable page has no canonical`);
        else {
          try {
            if (new URL(canonical).origin !== origin.origin) fail(`${origin.id}/${relative}: canonical crosses origin`);
          } catch {
            fail(`${origin.id}/${relative}: invalid canonical ${canonical}`);
          }
        }
        const image = meta["og:image"];
        if (!image) fail(`${origin.id}/${relative}: indexable page has no og:image`);
        else {
          counts.socialImages += 1;
          const imageFile = fileForUrl(dist, image);
          if (!imageFile) fail(`${origin.id}/${relative}: og:image is not a built local file: ${image}`);
        }
      } else {
        counts.noindexPages += 1;
        if (robotsValue !== "noindex, follow") fail(`${origin.id}/${relative}: unexpected robots value ${robotsValue}`);
        if (canonical) fail(`${origin.id}/${relative}: noindex page must not declare a canonical`);
      }
    }
    for (const hash of inlineHashes(html)) {
      if (!scriptSrc.includes(hash)) fail(`${origin.id}/${relative}: CSP is missing inline hash ${hash}`);
    }
    for (const match of html.matchAll(/(?:src|href)=["'](\/_astro\/[^"']+)["']/g)) {
      const asset = path.join(dist, decodeURIComponent(match[1].replace(/^\//, "")));
      if (!fs.existsSync(asset)) fail(`${origin.id}/${relative}: missing built asset ${match[1]}`);
    }
    const lower = html.toLowerCase();
    for (const term of prohibited) {
      if (lower.includes(term)) fail(`${origin.id}/${relative}: prohibited reference "${term}"`);
    }
  }
}

const portalIndex = path.join(root, "apps/portal/dist/sitemap-index.xml");
if (!fs.existsSync(portalIndex)) fail("portal: missing sitemap-index.xml");
else {
  const index = fs.readFileSync(portalIndex, "utf8");
  for (const origin of origins) {
    if (!index.includes(`${origin.origin}/sitemap.xml`)) fail(`sitemap index omits ${origin.id}`);
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  counts,
  assets: assetRegistry.length,
  errors,
  warnings
};
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/estate-verification.json"), `${JSON.stringify(report, null, 2)}\n`);

if (errors.length > 0) {
  console.error(`Estate verification failed (${errors.length} errors).`);
  for (const error of errors.slice(0, 80)) console.error(`- ${error}`);
  if (errors.length > 80) console.error(`- ... ${errors.length - 80} more in artifacts/estate-verification.json`);
  process.exitCode = 1;
} else {
  console.log(`Estate verified: ${counts.routes} routes, ${counts.htmlFiles} HTML files, ${counts.indexablePages} indexable pages, ${counts.redirects} redirects, ${assetsLabel(assetRegistry.length)}.`);
}

function assetsLabel(count) {
  return `${count} governed assets`;
}
