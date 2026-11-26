// Typecheck-only mirror of the shared SEO contract used by this Worker.
// Runtime and tests import the real workspace package. Remove this mirror when
// the shared package publishes declarations that typecheck independently.
export interface OriginConfig {
  id: string;
  origin: string;
  trailingSlash: boolean;
}

export interface RouteRecord {
  id: string;
  origin: string;
  path: string;
  routeClass: "public-seo" | "public-utility" | "private" | "administrative" | "retired";
  redirectTo?: string;
  hashRoute?: boolean;
}

export const origins: readonly OriginConfig[];
export const routeRegistry: readonly RouteRecord[];
