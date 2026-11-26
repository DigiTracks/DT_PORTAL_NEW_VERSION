import fs from "node:fs";
import path from "node:path";
import { origins, validateRouteRegistry } from "../packages/seo/src/routes.ts";
import { routeRegistry } from "../packages/seo/src/index.ts";
import { validateRedirects } from "../packages/seo/src/redirects.ts";

const root = path.resolve(import.meta.dirname, "..");
const routeErrors = validateRouteRegistry(routeRegistry);
if (routeErrors.length > 0) {
  throw new Error(`Invalid route registry:\n${routeErrors.join("\n")}`);
}

const rules = routeRegistry
  .filter((route) => route.redirectTo && !route.hashRoute)
  .map((route) => ({
    origin: route.origin,
    from: route.path,
    to: route.redirectTo,
    permanent: true
  }));

const redirectErrors = validateRedirects(rules);
if (redirectErrors.length > 0) {
  throw new Error(`Invalid redirects:\n${redirectErrors.join("\n")}`);
}

const artifactDirectory = path.join(root, "artifacts", "deploy-manifests");
fs.mkdirSync(artifactDirectory, { recursive: true });

const manifest = {
  format: "cloudflare-pages-redirects-v1",
  generatedAt: new Date().toISOString(),
  ruleCount: rules.length,
  origins: origins.map((origin) => ({
    id: origin.id,
    origin: origin.origin,
    trailingSlash: origin.trailingSlash,
    file: `apps/${origin.id}/public/_redirects`,
    rules: rules.filter((rule) => rule.origin === origin.id)
  }))
};

for (const origin of manifest.origins) {
  const destination = path.join(root, origin.file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const lines = origin.rules
    .slice()
    .sort((left, right) => right.from.length - left.from.length || left.from.localeCompare(right.from))
    .map((rule) => `${rule.from} ${rule.to} 301`);
  fs.writeFileSync(destination, `${lines.join("\n")}\n`);
}

fs.writeFileSync(path.join(artifactDirectory, "redirects.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(root, "inventories", "deploy-manifests.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({
  ruleCount: manifest.ruleCount,
  perOrigin: Object.fromEntries(manifest.origins.map((origin) => [origin.id, origin.rules.length]))
}, null, 2));
