import type { RouteRecord } from "./routes.ts";
import { routeRegistry as generatedRouteRegistry } from "./route-registry.generated.ts";

export * from "./routes.ts";
export * from "./social.ts";
export const routeRegistry: readonly RouteRecord[] = generatedRouteRegistry;
export * from "./head.ts";
export * from "./schema.ts";
export * from "./sitemap.ts";
export * from "./redirects.ts";
export * from "./static-routes.ts";
