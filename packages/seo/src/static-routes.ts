import type { OriginId, RouteRecord } from "./routes.ts";

const fileRoutes = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/site.webmanifest",
  "/sw.js",
  "/favicon.ico",
  "/data/library.json"
]);

export function isFileRoute(route: RouteRecord): boolean {
  return fileRoutes.has(route.path.replace(/\/$/, ""));
}

export function staticPageRoutes(origin: OriginId, routes: readonly RouteRecord[]): RouteRecord[] {
  return routes.filter((route) => route.origin === origin
    && route.path !== "/"
    && !route.redirectTo
    && !route.hashRoute
    && (route.routeClass === "public-seo" || route.routeClass === "public-utility")
    && !isFileRoute(route));
}

export function originRedirects(origin: OriginId, routes: readonly RouteRecord[]): Record<string, string> {
  return Object.fromEntries(routes
    .filter((route) => route.origin === origin && route.redirectTo && !route.hashRoute)
    .map((route) => [route.path, route.redirectTo!]));
}
