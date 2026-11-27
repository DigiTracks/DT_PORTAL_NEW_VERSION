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
const width = 1200;
const height = 630;
const originThemes = {
  portal: {
    background: "#173f7a",
    ink: "#fffaf0",
    muted: "#d8e5ff",
    accent: "#f5cf65",
    secondary: "#ef785d",
    motif: "#6ce5e8",
    border: "rgb(255 250 240 / 16%)",
    grid: "rgb(245 207 101 / 7%)",
    lockup: "light",
    signature: "SYSTEMS / CONTEXT"
  },
  learn: {
    background: "#fffaf0",
    ink: "#14213f",
    muted: "#59627a",
    accent: "#244bc5",
    secondary: "#f3cf65",
    motif: "#ef7658",
    border: "rgb(20 33 63 / 16%)",
    grid: "rgb(36 75 197 / 7%)",
    lockup: "dark",
    signature: "LEARNING / PRACTICE"
  },
  sourcecraft: {
    background: "#f6efd9",
    ink: "#123a8c",
    muted: "#4f628e",
    accent: "#173e9e",
    secondary: "#f3cf65",
    motif: "#d95c43",
    border: "rgb(18 58 140 / 17%)",
    grid: "rgb(18 58 140 / 7%)",
    lockup: "dark",
    signature: "PROCUREMENT / REFERENCE"
  },
  procuresherpa: {
    background: "#0d2f27",
    ink: "#fffbed",
    muted: "#b9cec3",
    accent: "#f3a64a",
    secondary: "#9ed9b8",
    motif: "#f3a64a",
    border: "rgb(255 251 237 / 15%)",
    grid: "rgb(158 217 184 / 6%)",
    lockup: "light",
    signature: "PROCUREMENT / WORKSPACE"
  },
  learnpmo: {
    background: "#fbf2dc",
    ink: "#3c2b29",
    muted: "#705c54",
    accent: "#9a432b",
    secondary: "#e8b84b",
    motif: "#86b7d4",
    border: "rgb(103 56 45 / 17%)",
    grid: "rgb(154 67 43 / 7%)",
    lockup: "dark",
    signature: "PROJECTS / LEARNING"
  },
  hcmfusion: {
    background: "#fff7f2",
    ink: "#472c2b",
    muted: "#795d58",
    accent: "#783a32",
    secondary: "#e3b94f",
    motif: "#d98c9c",
    border: "rgb(77 41 40 / 16%)",
    grid: "rgb(120 58 50 / 7%)",
    lockup: "dark",
    signature: "PEOPLE / EVIDENCE"
  }
};
const palettes = Object.fromEntries(Object.entries(originThemes).map(([origin, theme]) => [origin, [theme.background, theme.ink, theme.accent, theme.secondary, theme.motif]]));
const generatorVersion = 4;
const generatedAt = new Date().toISOString();
const generatedDate = generatedAt.slice(0, 10);
const stagingRoot = path.join(
  root,
  ".artifacts",
  `social-card-generation-${generatedAt.replace(/[:.]/g, "-")}-${process.pid}-${crypto.randomBytes(4).toString("hex")}`
);
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

// Pages built outside the route registry still need a card, because the layout
// derives their og:image from the same path.
const staticRoutes = [
  {
    id: "portal:static:/resources/",
    origin: "portal",
    path: "/resources/",
    routeClass: "public-seo",
    indexable: true,
    title: "Resources",
    description: "Engineering notes, security material, buyer questions and the four free learning platforms.",
    template: "marketing",
    breadcrumbs: [],
    schema: [],
    ctaIds: [],
    analyticsId: "static:resources",
    canonicalOrigin: "https://digitracks.net",
    baselineSitemap: false,
    hashRoute: false,
    contentStatus: "approved"
  },
  {
    id: "learn:static:/privacy/",
    origin: "learn",
    path: "/privacy/",
    routeClass: "public-seo",
    indexable: true,
    title: "Privacy notice",
    description: "What the learning platform stores, where it stays and how to have it removed.",
    template: "legal",
    breadcrumbs: [],
    schema: [],
    ctaIds: [],
    analyticsId: "static:learn-privacy",
    canonicalOrigin: "https://learn.digitracks.net",
    baselineSitemap: false,
    hashRoute: false,
    contentStatus: "approved"
  },
  {
    id: "learn:static:/terms/",
    origin: "learn",
    path: "/terms/",
    routeClass: "public-seo",
    indexable: true,
    title: "Terms of use",
    description: "The terms that apply to the free learning material and practice tools.",
    template: "legal",
    breadcrumbs: [],
    schema: [],
    ctaIds: [],
    analyticsId: "static:learn-terms",
    canonicalOrigin: "https://learn.digitracks.net",
    baselineSitemap: false,
    hashRoute: false,
    contentStatus: "approved"
  }
];
routes.push(...staticRoutes);
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
      approval: "pending",
      permittedUse: "Use and embed in DigiTracks pages and generated social cards under OFL-1.1; retain the copyright and licence notice and do not sell the font software by itself."
    }
  };
});

const cards = routes.map((route) => {
  const origin = originById(route.origin).origin;
  const socialPath = socialCardPath(origin, route.path);
  const filename = path.posix.basename(socialPath);
  const file = `apps/${route.origin}/public${socialPath}`;
  const directory = path.join(stagingRoot, "cards", route.origin, "social");
  return { route, origin, socialPath, filename, file, directory, stagedFile: path.join(directory, filename) };
});

const expectedFiles = new Set(cards.map((card) => card.stagedFile));
if (expectedFiles.size !== cards.length) throw new Error("Two indexable routes resolve to the same social-card file.");

const brandLockupUris = Object.fromEntries(["light", "dark"].map((variant) => [
  variant,
  `data:image/webp;base64,${fs.readFileSync(path.join(root, `apps/portal/public/brand/brand-lockup-${variant}.webp`)).toString("base64")}`
]));

function geometricMotif(seed, theme) {
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
    return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${theme.motif}" stroke-width="1.2" opacity="${opacity.toFixed(2)}"/>`;
  }).join("");
  const nodes = points.map((point, index) => {
    const bright = bytes[(index + 5) % bytes.length] % 5 === 0;
    return `<circle cx="${point.x}" cy="${point.y}" r="${bright ? 5 : 3}" fill="${bright ? theme.ink : theme.motif}"/>`;
  }).join("");
  return `<svg class="motif" viewBox="0 0 300 300" aria-hidden="true">
    <circle cx="150" cy="150" r="126" fill="none" stroke="${theme.ink}" stroke-opacity=".12"/>
    <circle cx="150" cy="150" r="88" fill="none" stroke="${theme.secondary}" stroke-opacity=".42" stroke-dasharray="2 9"/>
    <path d="M150 8v20M150 272v20M8 150h20M272 150h20" stroke="${theme.ink}" stroke-opacity=".4"/>
    <g>${lines}${nodes}</g>
    <rect x="137" y="137" width="26" height="26" rx="2" fill="${theme.background}" stroke="${theme.motif}" stroke-width="1.5" transform="rotate(45 150 150)"/>
  </svg>`;
}

function cardMarkup(card) {
  const { route } = card;
  const theme = originThemes[route.origin];
  if (!theme) throw new Error(`No social-card theme for origin ${route.origin}.`);
  const titleSize = route.title.length > 52 ? 68 : route.title.length > 42 ? 76 : 84;
  const originLabel = new URL(card.origin).host;
  const variables = [
    `--card-bg:${theme.background}`,
    `--card-ink:${theme.ink}`,
    `--card-muted:${theme.muted}`,
    `--card-accent:${theme.accent}`,
    `--card-border:${theme.border}`,
    `--card-grid:${theme.grid}`
  ].join(";");
  return `<article class="card" data-route-id="${escapeHtml(route.id)}" style="${variables};--title-size:${titleSize}px">
    <div class="frame"></div>
    <header>
      <div class="brand"><img class="brand-lockup" src="${brandLockupUris[theme.lockup]}" alt="Digi Tracks" width="170" height="28" /></div>
      <div class="origin">${escapeHtml(originLabel)}</div>
    </header>
    <div class="rule"></div>
    <h1>${escapeHtml(route.title)}</h1>
    ${geometricMotif(`${card.origin}${route.path}`, theme)}
    <footer><span class="path">${escapeHtml(route.path)}</span><span class="signature">${escapeHtml(theme.signature)}</span></footer>
  </article>`;
}

const fontFaces = fonts.map(({ spec, dataUri }) => `@font-face{font-family:"${spec.cssFamily}";font-style:normal;font-weight:${spec.weight};font-display:block;src:url("${dataUri}") format("woff2");}`).join("\n");
const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces}
*{box-sizing:border-box}html,body{margin:0;background:#d9d5ca}body{font-family:"Host Grotesk Variable",sans-serif}.card{position:relative;width:1200px;height:630px;overflow:hidden;background:var(--card-bg);color:var(--card-ink)}.card:before{content:"";position:absolute;inset:0;background-image:linear-gradient(var(--card-grid) 1px,transparent 1px),linear-gradient(90deg,var(--card-grid) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(90deg,transparent 0,#000 55%,#000 100%)}.frame{position:absolute;inset:30px;border:1px solid var(--card-border)}header{position:absolute;left:64px;right:64px;top:51px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center}.brand-lockup{display:block;width:170px;height:28px;object-fit:contain}.origin{font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:15px;letter-spacing:.04em;color:var(--card-accent)}.rule{position:absolute;left:64px;right:64px;top:112px;height:1px;background:var(--card-border)}h1{position:absolute;left:64px;top:166px;width:750px;margin:0;font-family:"Instrument Serif",serif;font-size:var(--title-size);font-weight:400;line-height:.99;letter-spacing:-.025em;text-wrap:balance;overflow-wrap:break-word}.motif{position:absolute;right:57px;top:157px;width:300px;height:300px}footer{position:absolute;left:64px;right:64px;bottom:57px;display:flex;align-items:center;justify-content:space-between;gap:24px;font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:15px;letter-spacing:.035em}.path{max-width:720px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--card-ink)}.signature{color:var(--card-accent);white-space:nowrap}
</style></head><body>${cards.map(cardMarkup).join("")}</body></html>`;

function pngDimensions(file) {
  const bytes = fs.readFileSync(file);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature) || bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`Not a valid PNG: ${file}`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

let preserveStaging = false;
let publicationCompleted = false;
try {
  for (const directory of new Set(cards.map((card) => card.directory))) {
    fs.mkdirSync(directory, { recursive: true });
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
    await page.locator(".card").nth(index).screenshot({ path: card.stagedFile, type: "png", animations: "disabled", scale: "css" });
    const dimensions = pngDimensions(card.stagedFile);
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
const stagedRegistryErrors = validateRouteRegistry(syncedRegistry);
if (stagedRegistryErrors.length) throw new Error(`Staged route registry is invalid:\n${stagedRegistryErrors.join("\n")}`);
const registrySource = `${fs.readFileSync(registryFile, "utf8").split("\n")[0]}\nexport const routeRegistry = ${JSON.stringify(syncedRegistry, null, 2)} as const;\n`;
const routeRegistrySha256 = sha256(registrySource);

const cardRecords = cards.map((card) => {
  const bytes = fs.readFileSync(card.stagedFile);
  return {
    routeId: card.route.id,
    origin: card.origin,
    originId: card.route.origin,
    path: card.route.path,
    file: posix(card.file),
    dimensions: { width, height },
    sha256: sha256(bytes),
    generatedAt,
    approval: "pending",
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
    palettes,
    method: "Original origin-aware typographic composition with the owner-supplied Digi Tracks lockup and route-seeded geometric SVG; local font data URIs only; external network requests blocked.",
    fonts: fonts.map(({ spec, record }) => ({
      family: spec.cssFamily,
      file: record.path,
      sha256: record.sha256,
      licence: record.licence,
      sourceProject: record.sourceProject,
      approval: record.approval
    }))
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
const inventorySource = `${JSON.stringify(inventory, null, 2)}\n`;

const assetRecords = [
  ...cardRecords.map((card, index) => ({
    id: `social:${card.originId}:${path.posix.basename(card.file, ".png")}`,
    path: cards[index].socialPath,
    sha256: card.sha256,
    kind: "social-card",
    owner: "DigiTracks",
    licence: "Proprietary - original DigiTracks artwork",
    sourceProject: "scripts/generate-social-cards.mjs",
    approval: "pending",
    permittedUse: "Local Open Graph and Twitter social card for this indexable DigiTracks route; original typography and geometric artwork only."
  })),
  ...fonts.map(({ record }) => record)
];
const generatedAssetsSource = `// Generated by scripts/generate-social-cards.mjs on ${generatedDate}. Do not edit by hand.\nimport type { AssetRecord } from "./assets.ts";\n\nexport const generatedAssetRegistry = ${JSON.stringify(assetRecords, null, 2)} as const satisfies readonly AssetRecord[];\n`;
const stagedRegistryFile = path.join(stagingRoot, "metadata", "route-registry.generated.ts");
const stagedInventoryFile = path.join(stagingRoot, "metadata", "social-cards.json");
const stagedAssetsFile = path.join(stagingRoot, "metadata", "assets.generated.ts");
fs.mkdirSync(path.dirname(stagedRegistryFile), { recursive: true });
fs.writeFileSync(stagedRegistryFile, registrySource);
fs.writeFileSync(stagedInventoryFile, inventorySource);
fs.writeFileSync(stagedAssetsFile, generatedAssetsSource);

const { validateAssetRegistry } = await import("../packages/brand/src/assets.ts");
const stagedAssetRegistry = [...sourceAssetRegistry, ...assetRecords];
const assetErrors = validateAssetRegistry(stagedAssetRegistry);
if (assetErrors.length) throw new Error(`Staged asset registry is invalid:\n${assetErrors.join("\n")}`);
if (stagedAssetRegistry.length !== inventory.counts.assetRecords) throw new Error("Staged asset registry and inventory counts differ.");
if (assetRecords.some((record) => record.approval !== "pending" || Object.hasOwn(record, "approvedAt"))) {
  throw new Error("Newly generated social cards and fonts must remain pending owner approval.");
}
for (const [index, card] of cardRecords.entries()) {
  const stagedFile = cards[index].stagedFile;
  const dimensions = pngDimensions(stagedFile);
  if (dimensions.width !== width || dimensions.height !== height || sha256(fs.readFileSync(stagedFile)) !== card.sha256) {
    throw new Error(`Staged card failed verification: ${card.file}`);
  }
}

const origins = [...new Set(cards.map((card) => card.route.origin))];
const publications = [
  ...origins.map((origin) => ({
    target: path.join(root, "apps", origin, "public/social"),
    staged: path.join(stagingRoot, "cards", origin, "social")
  })),
  { target: registryFile, staged: stagedRegistryFile },
  { target: inventoryFile, staged: stagedInventoryFile },
  { target: generatedAssetsFile, staged: stagedAssetsFile }
];
const backupsRoot = path.join(stagingRoot, "backups");
const operations = [];
try {
  for (let index = 0; index < publications.length; index += 1) {
    const publication = publications[index];
    const operation = {
      ...publication,
      backup: path.join(backupsRoot, String(index).padStart(2, "0"), path.basename(publication.target)),
      hadOriginal: fs.existsSync(publication.target),
      backedUp: false,
      installed: false
    };
    operations.push(operation);
    fs.mkdirSync(path.dirname(operation.backup), { recursive: true });
    if (operation.hadOriginal) {
      fs.renameSync(operation.target, operation.backup);
      operation.backedUp = true;
    }
    fs.renameSync(operation.staged, operation.target);
    operation.installed = true;
  }

  for (const card of cardRecords) {
    const absoluteFile = path.join(root, card.file);
    const dimensions = pngDimensions(absoluteFile);
    if (dimensions.width !== width || dimensions.height !== height || sha256(fs.readFileSync(absoluteFile)) !== card.sha256) {
      throw new Error(`Published card failed final verification: ${card.file}`);
    }
  }
  for (const origin of origins) {
    const directory = path.join(root, "apps", origin, "public/social");
    const expectedNames = new Set(cards.filter((card) => card.route.origin === origin).map((card) => card.filename));
    const actualNames = fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
      .map((entry) => entry.name);
    if (actualNames.length !== expectedNames.size || actualNames.some((name) => !expectedNames.has(name))) {
      throw new Error(`Published social-card directory contains stale or missing PNGs: ${directory}`);
    }
  }
  for (const [file, source] of [
    [registryFile, registrySource],
    [inventoryFile, inventorySource],
    [generatedAssetsFile, generatedAssetsSource]
  ]) {
    if (fs.readFileSync(file, "utf8") !== source) throw new Error(`Published metadata failed final verification: ${file}`);
  }
  publicationCompleted = true;
} catch (error) {
  const rollbackErrors = [];
  for (const operation of [...operations].reverse()) {
    try {
      if (operation.installed) fs.rmSync(operation.target, { recursive: true, force: true });
      if (operation.backedUp) fs.renameSync(operation.backup, operation.target);
    } catch (rollbackError) {
      rollbackErrors.push(`${operation.target}: ${rollbackError.message}`);
    }
  }
  if (rollbackErrors.length) {
    preserveStaging = true;
    throw new Error(
      `Social-card publication failed and rollback was incomplete. Backups are retained at ${backupsRoot}.\n${rollbackErrors.join("\n")}`,
      { cause: error }
    );
  }
  throw error;
}

console.log(JSON.stringify({
  generatedAt,
  cards: cardRecords.length,
  fonts: fonts.length,
  assetRecords: stagedAssetRegistry.length,
  approval: "pending",
  byOrigin: inventory.counts.byOrigin,
  rendererVersion,
  registryErrors: assetErrors.length,
  inventory: posix(path.relative(root, inventoryFile)),
  assets: posix(path.relative(root, generatedAssetsFile))
}, null, 2));
} finally {
  if (!preserveStaging) {
    try {
      fs.rmSync(stagingRoot, { recursive: true, force: true });
    } catch (error) {
      if (!publicationCompleted) throw error;
      console.warn(`Social cards published, but staging cleanup failed: ${stagingRoot}`);
    }
  }
}
