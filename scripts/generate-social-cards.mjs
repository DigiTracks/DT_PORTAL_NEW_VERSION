import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "@playwright/test";
import { routeRegistry } from "../packages/seo/src/route-registry.generated.ts";
import { originById, validateRouteRegistry } from "../packages/seo/src/routes.ts";
import { socialCardPath } from "../packages/seo/src/social.ts";
import { sourceAssetRegistry } from "../packages/brand/src/source-assets.generated.ts";

const root = path.resolve(import.meta.dirname, "..");
const registryFile = path.join(root, "packages/seo/src/route-registry.generated.ts");
const inventoryFile = path.join(root, "inventories/social-cards.json");
const generatedAssetsFile = path.join(root, "packages/brand/src/assets.generated.ts");
const approvalDate = "2026-11-25";
const width = 1200;
const height = 630;
const palette = ["#090f17", "#f4f2ed", "#6ce5e8"];
const generatorVersion = 2;
const generatedAt = new Date().toISOString();
const generatedDate = generatedAt.slice(0, 10);
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const posix = (value) => value.split(path.sep).join("/");
const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

if (Number(process.versions.node.split(".")[0]) < 24) {
  throw new Error("generate-social-cards.mjs requires Node 24 or newer for native TypeScript stripping.");
}

const registryErrors = validateRouteRegistry(routeRegistry);
if (registryErrors.length) throw new Error(`Invalid route registry:\n${registryErrors.join("\n")}`);

const routes = routeRegistry.filter((route) => route.indexable && route.routeClass === "public-seo" && !route.redirectTo && !route.hashRoute);
if (routes.length === 0) throw new Error("The route registry contains no indexable public pages.");

const fontSpecs = [
  {
    id: "font:host-grotesk",
    packageName: "@fontsource-variable/host-grotesk",
    file: "files/host-grotesk-latin-wght-normal.woff2",
    cssFamily: "Host Grotesk Variable",
    owner: "The Host Grotesk Project Authors",
    weight: "300 800"
  },
  {
    id: "font:instrument-serif",
    packageName: "@fontsource/instrument-serif",
    file: "files/instrument-serif-latin-400-normal.woff2",
    cssFamily: "Instrument Serif",
    owner: "The Instrument Serif Project Authors",
    weight: "400"
  }
];

const fonts = fontSpecs.map((spec) => {
  const packageDirectory = path.join(root, "packages/ui/node_modules", spec.packageName);
  const metadata = JSON.parse(fs.readFileSync(path.join(packageDirectory, "package.json"), "utf8"));
  const licenceText = fs.readFileSync(path.join(packageDirectory, "LICENSE"), "utf8");
  if (metadata.license !== "OFL-1.1" || !licenceText.includes("SIL OPEN FONT LICENSE Version 1.1")) {
    throw new Error(`${spec.packageName}: installed metadata and licence file do not confirm OFL-1.1.`);
  }
  if (!licenceText.includes(spec.owner)) {
    throw new Error(`${spec.packageName}: licence file does not confirm the recorded copyright owner.`);
  }
  const filePath = path.join(packageDirectory, spec.file);
  const bytes = fs.readFileSync(filePath);
  return {
    spec,
    filePath,
    dataUri: `data:font/woff2;base64,${bytes.toString("base64")}`,
    record: {
      id: spec.id,
      path: `/${posix(path.relative(root, filePath))}`,
      sha256: sha256(bytes),
      kind: "font",
      owner: spec.owner,
      licence: "OFL-1.1",
      sourceProject: `${spec.packageName}@${metadata.version}`,
      approval: "approved",
      approvedAt: approvalDate,
      permittedUse: "Use and embed in DigiTracks pages and generated social cards under OFL-1.1; retain the copyright and licence notice and do not sell the font software by itself."
    }
  };
});

const cards = routes.map((route) => {
  const origin = originById(route.origin).origin;
  const socialPath = socialCardPath(origin, route.path);
  const filename = path.posix.basename(socialPath);
  const file = `apps/${route.origin}/public${socialPath}`;
  return { route, origin, socialPath, filename, file, absoluteFile: path.join(root, file) };
});

const expectedFiles = new Set(cards.map((card) => card.absoluteFile));
if (expectedFiles.size !== cards.length) throw new Error("Two indexable routes resolve to the same social-card file.");
for (const origin of new Set(cards.map((card) => card.route.origin))) {
  const directory = path.join(root, "apps", origin, "public/social");
  fs.mkdirSync(directory, { recursive: true });
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".png") && !expectedFiles.has(path.join(directory, entry.name))) {
      fs.unlinkSync(path.join(directory, entry.name));
    }
  }
}

const brandLockupUri = `data:image/webp;base64,${fs.readFileSync(path.join(root, "apps/portal/public/brand/brand-lockup-light.webp")).toString("base64")}`;

function geometricMotif(seed) {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  const columns = 4;
  const rows = 5;
  const points = Array.from({ length: columns * rows }, (_, index) => ({
    x: 20 + (index % columns) * 82 + (bytes[index % bytes.length] % 13) - 6,
    y: 18 + Math.floor(index / columns) * 67 + (bytes[(index + 7) % bytes.length] % 11) - 5
  }));
  const edges = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      if (column < columns - 1 && (bytes[(index + 3) % bytes.length] & 1 || row === 2)) {
        edges.push([index, index + 1]);
      }
      if (row < rows - 1 && (bytes[(index + 11) % bytes.length] & 1 || column === 1)) {
        edges.push([index, index + columns]);
      }
    }
  }
  const lines = edges.map(([from, to]) => {
    const start = points[from];
    const end = points[to];
    const opacity = 0.24 + (bytes[(from + to) % bytes.length] % 40) / 100;
    return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#6ce5e8" stroke-width="1.2" opacity="${opacity.toFixed(2)}"/>`;
  }).join("");
  const nodes = points.map((point, index) => {
    const bright = bytes[(index + 5) % bytes.length] % 5 === 0;
    return `<circle cx="${point.x}" cy="${point.y}" r="${bright ? 5 : 3}" fill="${bright ? "#f4f2ed" : "#6ce5e8"}"/>`;
  }).join("");
  return `<svg class="motif" viewBox="0 0 300 300" aria-hidden="true">
    <circle cx="150" cy="150" r="126" fill="none" stroke="#f4f2ed" stroke-opacity=".12"/>
    <circle cx="150" cy="150" r="88" fill="none" stroke="#6ce5e8" stroke-opacity=".18" stroke-dasharray="2 9"/>
    <path d="M150 8v20M150 272v20M8 150h20M272 150h20" stroke="#f4f2ed" stroke-opacity=".4"/>
    <g>${lines}${nodes}</g>
    <rect x="137" y="137" width="26" height="26" rx="2" fill="#090f17" stroke="#6ce5e8" stroke-width="1.5" transform="rotate(45 150 150)"/>
  </svg>`;
}

function cardMarkup(card) {
  const { route } = card;
  const titleSize = route.title.length > 52 ? 68 : route.title.length > 42 ? 76 : 84;
  const originLabel = new URL(card.origin).host;
  return `<article class="card" data-route-id="${escapeHtml(route.id)}" style="--title-size:${titleSize}px">
    <div class="frame"></div>
    <header>
      <div class="brand"><img class="brand-lockup" src="${brandLockupUri}" alt="Digi Tracks" width="170" height="28" /></div>
      <div class="origin">${escapeHtml(originLabel)}</div>
    </header>
    <div class="rule"></div>
    <h1>${escapeHtml(route.title)}</h1>
    ${geometricMotif(`${card.origin}${route.path}`)}
    <footer><span class="path">${escapeHtml(route.path)}</span><span class="signature">SYSTEMS / CONTEXT</span></footer>
  </article>`;
}

const fontFaces = fonts.map(({ spec, dataUri }) => `@font-face{font-family:"${spec.cssFamily}";font-style:normal;font-weight:${spec.weight};font-display:block;src:url("${dataUri}") format("woff2");}`).join("\n");
const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces}
*{box-sizing:border-box}html,body{margin:0;background:#090f17}body{font-family:"Host Grotesk Variable",sans-serif;color:#f4f2ed}.card{position:relative;width:1200px;height:630px;overflow:hidden;background:#090f17}.card:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(108,229,232,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(108,229,232,.045) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(90deg,transparent 0,#000 55%,#000 100%)}.frame{position:absolute;inset:30px;border:1px solid rgba(244,242,237,.14)}header{position:absolute;left:64px;right:64px;top:51px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center}.brand-lockup{display:block;width:170px;height:28px;object-fit:contain}.origin{font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:15px;letter-spacing:.04em;color:#6ce5e8}.rule{position:absolute;left:64px;right:64px;top:112px;height:1px;background:rgba(244,242,237,.2)}h1{position:absolute;left:64px;top:166px;width:750px;margin:0;font-family:"Instrument Serif",serif;font-size:var(--title-size);font-weight:400;line-height:.99;letter-spacing:-.025em;text-wrap:balance;overflow-wrap:break-word}.motif{position:absolute;right:57px;top:157px;width:300px;height:300px}footer{position:absolute;left:64px;right:64px;bottom:57px;display:flex;align-items:center;justify-content:space-between;gap:24px;font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:15px;letter-spacing:.035em}.path{max-width:720px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4f2ed}.signature{color:#6ce5e8;white-space:nowrap}
</style></head><body>${cards.map(cardMarkup).join("")}</body></html>`;

function pngDimensions(file) {
  const bytes = fs.readFileSync(file);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature) || bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`Not a valid PNG: ${file}`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const systemChromium = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((candidate) => fs.existsSync(candidate));
const executablePath = systemChromium ?? chromium.executablePath();
if (!fs.existsSync(executablePath)) throw new Error(`Chromium is not installed at ${executablePath}.`);
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
let rendererVersion;
try {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, offline: true });
  await context.route(/^https?:\/\//, (route) => route.abort());
  const page = await context.newPage();
  await page.setContent(documentHtml, { waitUntil: "load" });
  const fontState = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      host: document.fonts.check('600 20px "Host Grotesk Variable"'),
      serif: document.fonts.check('400 84px "Instrument Serif"')
    };
  });
  if (Object.values(fontState).some((loaded) => !loaded)) throw new Error(`A local card font did not load: ${JSON.stringify(fontState)}`);
  rendererVersion = browser.version();
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    await page.locator(".card").nth(index).screenshot({ path: card.absoluteFile, type: "png", animations: "disabled", scale: "css" });
    const dimensions = pngDimensions(card.absoluteFile);
    if (dimensions.width !== width || dimensions.height !== height) {
      throw new Error(`${card.file}: expected ${width}x${height}, received ${dimensions.width}x${dimensions.height}.`);
    }
  }
  await context.close();
} finally {
  await browser.close();
}

const scriptSha256 = sha256(fs.readFileSync(path.join(root, "scripts/generate-social-cards.mjs")));
const syncedRegistry = routeRegistry.map((route) => {
  if (!route.indexable || route.routeClass !== "public-seo" || route.redirectTo || route.hashRoute) return route;
  if (route.socialImage && !route.socialImage.startsWith("/og/")) return route;
  return { ...route, socialImage: socialCardPath(originById(route.origin).origin, route.path) };
});
const registrySource = `${fs.readFileSync(registryFile, "utf8").split("\n")[0]}\nexport const routeRegistry = ${JSON.stringify(syncedRegistry, null, 2)} as const;\n`;
if (fs.readFileSync(registryFile, "utf8") !== registrySource) fs.writeFileSync(registryFile, registrySource);
const routeRegistrySha256 = sha256(fs.readFileSync(registryFile));

const cardRecords = cards.map((card) => {
  const bytes = fs.readFileSync(card.absoluteFile);
  return {
    routeId: card.route.id,
    origin: card.origin,
    originId: card.route.origin,
    path: card.route.path,
    file: posix(card.file),
    dimensions: { width, height },
    sha256: sha256(bytes),
    generatedAt,
    generator: { name: "generate-social-cards.mjs", version: generatorVersion, scriptSha256, routeRegistrySha256 }
  };
});

const inventory = {
  schemaVersion: 1,
  generatedAt,
  generatedDate,
  generator: {
    name: "generate-social-cards.mjs",
    version: generatorVersion,
    command: "node scripts/generate-social-cards.mjs (Node 24)",
    node: process.version,
    renderer: "Playwright Chromium",
    rendererVersion,
    scriptSha256,
    routeRegistry: "packages/seo/src/route-registry.generated.ts",
    routeRegistrySha256,
    dimensions: { width, height },
    palette,
    method: "Original typographic composition with the owner-supplied Digi Tracks lockup and route-seeded geometric SVG; local font data URIs only; external network requests blocked.",
    fonts: fonts.map(({ spec, record }) => ({ family: spec.cssFamily, file: record.path, sha256: record.sha256, licence: record.licence, sourceProject: record.sourceProject }))
  },
  counts: {
    cards: cardRecords.length,
    sourceAssets: sourceAssetRegistry.length,
    fonts: fonts.length,
    assetRecords: cardRecords.length + sourceAssetRegistry.length + fonts.length,
    byOrigin: Object.fromEntries([...new Set(cards.map((card) => card.route.origin))].map((origin) => [origin, cards.filter((card) => card.route.origin === origin).length]))
  },
  cards: cardRecords
};
fs.writeFileSync(inventoryFile, `${JSON.stringify(inventory, null, 2)}\n`);

const assetRecords = [
  ...cardRecords.map((card, index) => ({
    id: `social:${card.originId}:${path.posix.basename(card.file, ".png")}`,
    path: cards[index].socialPath,
    sha256: card.sha256,
    kind: "social-card",
    owner: "DigiTracks",
    licence: "Proprietary - original DigiTracks artwork",
    sourceProject: "scripts/generate-social-cards.mjs",
    approval: "approved",
    approvedAt: approvalDate,
    permittedUse: "Local Open Graph and Twitter social card for this indexable DigiTracks route; original typography and geometric artwork only."
  })),
  ...fonts.map(({ record }) => record)
];
fs.writeFileSync(generatedAssetsFile, `// Generated by scripts/generate-social-cards.mjs on ${generatedDate}. Do not edit by hand.\nimport type { AssetRecord } from "./assets.ts";\n\nexport const generatedAssetRegistry = ${JSON.stringify(assetRecords, null, 2)} as const satisfies readonly AssetRecord[];\n`);

const { assetRegistry, validateAssetRegistry } = await import("../packages/brand/src/assets.ts");
const assetErrors = validateAssetRegistry(assetRegistry);
if (assetErrors.length) throw new Error(`Generated asset registry is invalid:\n${assetErrors.join("\n")}`);
if (assetRegistry.length !== inventory.counts.assetRecords) throw new Error("Generated asset registry and inventory counts differ.");
for (const card of cardRecords) {
  const absoluteFile = path.join(root, card.file);
  const dimensions = pngDimensions(absoluteFile);
  if (dimensions.width !== width || dimensions.height !== height || sha256(fs.readFileSync(absoluteFile)) !== card.sha256) {
    throw new Error(`Generated card failed final verification: ${card.file}`);
  }
}

console.log(JSON.stringify({
  generatedAt,
  cards: cardRecords.length,
  fonts: fonts.length,
  assetRecords: assetRegistry.length,
  byOrigin: inventory.counts.byOrigin,
  rendererVersion,
  registryErrors: assetErrors.length,
  inventory: posix(path.relative(root, inventoryFile)),
  assets: posix(path.relative(root, generatedAssetsFile))
}, null, 2));
