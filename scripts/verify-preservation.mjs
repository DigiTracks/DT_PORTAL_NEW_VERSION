import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const baseline = JSON.parse(fs.readFileSync(path.join(root, "inventories/preservation-baseline.json"), "utf8"));
const tracked = JSON.parse(fs.readFileSync(path.join(root, "inventories/old-repo-tracked-hashes.json"), "utf8"));
const errors = [];
const warnings = [];
const operatorOnlyReferences = new Set(["scripts/generate-registries.mjs", "scripts/sync-source-assets.mjs"]);

function git(args) {
  return execFileSync("git", ["-C", baseline.repository, ...args], { encoding: "utf8" }).trim();
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

let head = null;
let branch = null;
let status = "";
try {
  head = git(["rev-parse", "HEAD"]);
  branch = git(["branch", "--show-current"]);
  status = git(["status", "--porcelain=v1"]);
} catch (error) {
  errors.push(`Could not read reference repository: ${error.message}`);
}

if (head !== baseline.head) errors.push(`Reference HEAD changed: expected ${baseline.head}, received ${head}`);
if (branch !== baseline.branch) errors.push(`Reference branch changed: expected ${baseline.branch}, received ${branch}`);
if (status) errors.push(`Reference working tree is not clean:\n${status}`);

const files = git(["ls-files", "-z"]).split("\0").filter(Boolean);
if (files.length !== tracked.trackedFileCount) {
  errors.push(`Reference tracked-file count changed: expected ${tracked.trackedFileCount}, received ${files.length}`);
}
for (const file of files) {
  const expected = tracked.hashes[file];
  if (!expected) {
    errors.push(`Reference has a new tracked file: ${file}`);
    continue;
  }
  const actual = sha256(path.join(baseline.repository, file));
  if (actual !== expected) errors.push(`Reference file changed: ${file}`);
}
for (const file of Object.keys(tracked.hashes)) {
  if (!files.includes(file)) errors.push(`Reference tracked file is missing: ${file}`);
}

function inspectSource(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute);
    if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(absolute);
      if (target.includes("DT-Portal-main")) errors.push(`Workspace symlink points to the reference repository: ${relative}`);
      continue;
    }
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".astro", ".git"].includes(entry.name)) continue;
      inspectSource(absolute);
      continue;
    }
    if (!entry.isFile() || entry.name.endsWith(".generated.ts") || operatorOnlyReferences.has(relative)) continue;
    if (!/\.(?:[cm]?[jt]sx?|json|astro|css|md)$/.test(entry.name)) continue;
    const content = fs.readFileSync(absolute, "utf8");
    if (content.includes(baseline.repository)) errors.push(`Runtime/source reference to the old repository: ${relative}`);
  }
}

for (const sourceRoot of ["apps", "packages", "scripts", "tests"]) inspectSource(path.join(root, sourceRoot));

const report = {
  checkedAt: new Date().toISOString(),
  repository: baseline.repository,
  head,
  branch,
  clean: status === "",
  trackedFiles: files.length,
  hashesMatched: errors.filter((error) => error.startsWith("Reference file changed")).length === 0,
  errors,
  warnings
};
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/preservation-verification.json"), `${JSON.stringify(report, null, 2)}\n`);

if (errors.length > 0) {
  console.error(`Preservation verification failed (${errors.length} errors).`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Preservation verified: ${files.length} tracked files unchanged at ${head}; working tree clean.`);
}
