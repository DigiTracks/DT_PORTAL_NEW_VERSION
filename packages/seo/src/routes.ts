export type OriginId = "portal" | "learn" | "sourcecraft" | "procuresherpa" | "learnpmo" | "hcmfusion";

export type RouteClass = "public-seo" | "public-utility" | "private" | "administrative" | "retired";

export interface OriginConfig {
  id: OriginId;
  origin: string;
  sitemapBaseline: number;
  trailingSlash: boolean;
}

export interface RouteRecord {
  id: string;
  origin: OriginId;
  path: string;
  routeClass: RouteClass;
  indexable: boolean;
  title: string;
  description: string;
  template: string;
  contentKey?: string;
  breadcrumbs: readonly { label: string; path: string }[];
  schema?: readonly string[];
  ctaIds: readonly string[];
  analyticsId: string;
  canonicalOrigin?: string;
  redirectTo?: string;
  baselineSitemap?: boolean;
  hashRoute?: boolean;
  contentStatus?: "approved" | "in-review" | "blocked" | "retired";
  socialImage?: string;
  sourceStatus?: string;
}

export const origins: readonly OriginConfig[] = [
  { id: "portal", origin: "https://digitracks.net", sitemapBaseline: 58, trailingSlash: true },
  { id: "learn", origin: "https://learn.digitracks.net", sitemapBaseline: 6, trailingSlash: true },
  { id: "sourcecraft", origin: "https://sourcecraft.digitracks.net", sitemapBaseline: 139, trailingSlash: true },
  { id: "procuresherpa", origin: "https://procuresherpa.digitracks.net", sitemapBaseline: 1, trailingSlash: false },
  { id: "learnpmo", origin: "https://learnpmo.digitracks.net", sitemapBaseline: 12, trailingSlash: true },
  { id: "hcmfusion", origin: "https://hcmfusion.digitracks.net", sitemapBaseline: 168, trailingSlash: true }
] as const;

export const baselineSitemapTotal = origins.reduce((total, origin) => total + origin.sitemapBaseline, 0);

export function originById(id: OriginId): OriginConfig {
  const origin = origins.find((candidate) => candidate.id === id);
  if (!origin) throw new Error(`Unknown origin: ${id}`);
  return origin;
}

export function routeUrl(origin: OriginId, path: string): string {
  const config = originById(origin);
  if (!path.startsWith("/")) throw new Error(`Route path must start with /: ${path}`);
  if (path.includes("?") || path.includes("#")) throw new Error(`Route registry paths cannot contain query or hash data: ${path}`);
  const url = new URL(path, config.origin);
  if (config.trailingSlash && url.pathname !== "/" && !url.pathname.endsWith("/")) url.pathname += "/";
  if (!config.trailingSlash && url.pathname !== "/" && url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
  return url.toString();
}

export function validateRouteRegistry(routes: readonly RouteRecord[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const route of routes) {
    const key = `${route.origin}:${route.path}`;
    if (seen.has(key)) errors.push(`Duplicate route: ${key}`);
    seen.add(key);

    if (!route.id.trim()) errors.push(`Route ${key} has an empty id`);
    if (!route.path.startsWith("/")) errors.push(`Route ${route.id} path must start with /`);
    if (!route.title.trim()) errors.push(`Route ${route.id} has an empty title`);
    if (!route.description.trim()) errors.push(`Route ${route.id} has an empty description`);
    if (!route.template.trim()) errors.push(`Route ${route.id} has an empty template`);
    if (!route.analyticsId.trim()) errors.push(`Route ${route.id} has an empty analytics id`);

    if (route.routeClass !== "public-seo" && route.indexable) {
      errors.push(`Route ${route.id} cannot be indexable outside public-seo`);
    }
    if (route.indexable && route.contentStatus !== "approved") {
      errors.push(`Indexable route ${route.id} requires approved content status`);
    }
    if (route.routeClass === "public-seo" && !route.indexable && !route.contentStatus) {
      errors.push(`Non-indexable public route ${route.id} requires a content status`);
    }

    const config = originById(route.origin);
    if (route.canonicalOrigin && route.canonicalOrigin !== config.origin) {
      errors.push(`Route ${route.id} has an unexpected cross-origin canonical`);
    }

    if (route.routeClass === "public-seo" || route.routeClass === "public-utility") {
      if (route.breadcrumbs.length === 0) errors.push(`Route ${route.id} requires breadcrumbs`);
    }
    if (route.hashRoute && route.indexable) errors.push(`Hash route ${route.id} cannot be independently indexable`);
    if (route.routeClass === "public-seo" && !route.indexable && !route.contentStatus) {
      errors.push(`Non-indexable public route ${route.id} requires a content status`);
    }

    if (route.redirectTo) {
      const target = new URL(route.redirectTo);
      if (target.protocol !== "https:") errors.push(`Route ${route.id} redirect must use HTTPS`);
      if (target.origin !== config.origin) errors.push(`Route ${route.id} redirect must stay on its origin`);
    }
  }

  return errors;
}
