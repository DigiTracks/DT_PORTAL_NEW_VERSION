import { productRegistry } from "@digitracks/catalog";
import { origins, routeRegistry } from "@digitracks/seo";

const publicProducts = productRegistry.filter(
  (product) => product.availability !== "internal" && product.availability !== "retired",
);
const productIds = new Set(publicProducts.map((product) => product.id));
const demoProductIds = new Set(
  publicProducts
    .filter((product) => product.requestable && product.availability !== "unknown")
    .map((product) => product.id),
);

function canonicalPath(origin: (typeof origins)[number], path: string): string {
  if (path === "/") return path;
  if (origin.trailingSlash && !path.endsWith("/")) return `${path}/`;
  if (!origin.trailingSlash && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

const publicPageKeys = new Set<string>();
for (const route of routeRegistry) {
  if (route.routeClass !== "public-seo" || route.redirectTo || route.hashRoute) continue;
  const origin = origins.find((candidate) => candidate.id === route.origin);
  if (!origin) continue;
  publicPageKeys.add(`${origin.origin}${canonicalPath(origin, route.path)}`);
}

export function isKnownProductId(value: string): boolean {
  return productIds.has(value);
}

export function isDemoProductId(value: string): boolean {
  return demoProductIds.has(value);
}

export function isPublicPage(origin: string, path: string): boolean {
  const config = origins.find((candidate) => candidate.origin === origin);
  if (!config) return false;
  return publicPageKeys.has(`${origin}${canonicalPath(config, path)}`);
}
