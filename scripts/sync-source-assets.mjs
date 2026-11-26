import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const referenceRoot = process.argv[2] ?? "/data/HomeWorks/DT-Portal-main";
const apps = ["portal", "learn", "sourcecraft", "procuresherpa", "learnpmo", "hcmfusion"];
const approvalDate = "2026-11-25";
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const posix = (value) => value.split(path.sep).join("/");

const masterAssets = [
  { file: "brand-lockup-light.webp", destination: "brand/brand-lockup-light.webp", kind: "logo" },
  { file: "brand-lockup-dark.webp", destination: "brand/brand-lockup-dark.webp", kind: "logo" },
  { file: "brand-mark.webp", destination: "brand/brand-mark.webp", kind: "logo" },
  { file: "favicon.ico", destination: "favicon.ico", kind: "icon" },
  { file: "apple-touch-icon.png", destination: "apple-touch-icon.png", kind: "icon" },
  { file: "icon-192.png", destination: "icons/icon-192.png", kind: "icon" },
  { file: "icon-512.png", destination: "icons/icon-512.png", kind: "icon" }
];

const lockupDerivatives = [
  { source: "brand-lockup-light.webp", file: "brand-lockup-light-320.webp" },
  { source: "brand-lockup-dark.webp", file: "brand-lockup-dark-320.webp" }
];

const records = [];
const inventoryRecords = [];

function copyVerified(sourceFile, destinations, record) {
  if (!fs.existsSync(sourceFile)) throw new Error(`Approved source asset is missing: ${sourceFile}`);
  const bytes = fs.readFileSync(sourceFile);
  const sha256 = hash(bytes);
  const copied = [];
  for (const destination of destinations) {
    const absoluteDestination = path.join(root, destination);
    fs.mkdirSync(path.dirname(absoluteDestination), { recursive: true });
    fs.copyFileSync(sourceFile, absoluteDestination);
    if (hash(fs.readFileSync(absoluteDestination)) !== sha256) throw new Error(`Copied asset hash differs: ${destination}`);
    copied.push(posix(destination));
  }
  records.push({ ...record, sha256 });
  inventoryRecords.push({
    ...record,
    sha256,
    source: posix(path.relative(root, sourceFile)),
    destinations: copied
  });
}

for (const asset of masterAssets) {
  copyVerified(
    path.join(referenceRoot, "public", asset.file),
    apps.map((app) => `apps/${app}/public/${asset.destination}`),
    {
      id: `brand:${asset.file}`,
      path: `/${asset.destination}`,
      kind: asset.kind,
      owner: "DigiTracks",
      licence: "Proprietary - owner-supplied DigiTracks asset",
      sourceProject: "Existing DigiTracks portal public assets",
      approval: "approved",
      approvedAt: approvalDate,
      permittedUse: "DigiTracks estate identity, favicon and install icon use approved by the owner on 2026-11-25."
    }
  );
}

for (const derivative of lockupDerivatives) {
  const sourceFile = path.join(referenceRoot, "public", derivative.source);
  if (!fs.existsSync(sourceFile)) throw new Error(`Approved source asset is missing: ${sourceFile}`);
  const temporaryFile = path.join(root, "artifacts", `.${derivative.file}.tmp`);
  let bytes;
  try {
    bytes = execFileSync("magick", [sourceFile, "-resize", "320x", "-strip", "-quality", "86", "-define", "webp:method=6", "webp:-"], { maxBuffer: 2_000_000 });
  } catch (error) {
    throw new Error(`ImageMagick is required to derive the size-matched lockups: ${error.message}`);
  }
  fs.mkdirSync(path.dirname(temporaryFile), { recursive: true });
  fs.writeFileSync(temporaryFile, bytes);
  copyVerified(
    temporaryFile,
    apps.map((app) => `apps/${app}/public/brand/${derivative.file}`),
    {
      id: `brand:${derivative.file}`,
      path: `/brand/${derivative.file}`,
      kind: "logo",
      owner: "DigiTracks",
      licence: "Proprietary - owner-supplied DigiTracks asset",
      sourceProject: "Derived from the existing DigiTracks portal lockup",
      approval: "approved",
      approvedAt: approvalDate,
      permittedUse: "Size-matched DigiTracks header and footer lockup; the supplied original remains unchanged."
    }
  );
  const inventoryRecord = inventoryRecords.at(-1);
  inventoryRecord.source = posix(path.relative(root, sourceFile));
  inventoryRecord.derivation = {
    tool: "ImageMagick",
    operation: "Resize to 320px width, strip metadata, WebP quality 86",
    sourceSha256: hash(fs.readFileSync(sourceFile))
  };
  fs.unlinkSync(temporaryFile);
}

const productDirectory = path.join(referenceRoot, "public/products");
const productFiles = fs.readdirSync(productDirectory).filter((file) => file.endsWith(".webp")).sort();
if (productFiles.length !== 33) throw new Error(`Expected 33 unique official product marks, found ${productFiles.length}.`);
for (const file of productFiles) {
  const id = path.posix.basename(file, ".webp");
  copyVerified(
    path.join(productDirectory, file),
    [`apps/portal/public/products/${file}`, ...(id === "sherpa-toolkit" ? [`apps/learn/public/products/${file}`] : [])],
    {
      id: `product:${id}`,
      path: `/products/${file}`,
      kind: "product-logo",
      owner: "DigiTracks",
      licence: "Proprietary - owner-supplied DigiTracks asset",
      sourceProject: "Existing DigiTracks portal public assets",
      approval: "approved",
      approvedAt: approvalDate,
      permittedUse: "Official product identity in the DigiTracks catalogue, approved by the owner on 2026-11-25."
    }
  );
}

const generatedFile = path.join(root, "packages/brand/src/source-assets.generated.ts");
fs.writeFileSync(generatedFile, `// Generated by scripts/sync-source-assets.mjs on ${approvalDate}. Do not edit by hand.\nimport type { AssetRecord } from "./assets.ts";\n\nexport const sourceAssetRegistry = ${JSON.stringify(records, null, 2)} as const satisfies readonly AssetRecord[];\n`);

const inventory = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  approvedAt: approvalDate,
  referenceRoot,
  sourcePolicy: "Strictly read-only; only owner-approved identity assets are copied into this repository.",
  counts: { uniqueAssets: records.length, masterAssets: masterAssets.length, lockupDerivatives: lockupDerivatives.length, productMarks: productFiles.length, copiedFiles: inventoryRecords.reduce((sum, record) => sum + record.destinations.length, 0) },
  assets: inventoryRecords
};
fs.writeFileSync(path.join(root, "inventories/source-assets.json"), `${JSON.stringify(inventory, null, 2)}\n`);

console.log(JSON.stringify(inventory.counts, null, 2));
