import { createHash } from "node:crypto";
import { origins } from "./routes.ts";

const SOCIAL_DIRECTORY = "/social/";
const HASH_LENGTH = 16;
const MAX_SLUG_LENGTH = 72;

function canonicalOrigin(value: string): URL {
  const url = new URL(value);
  const config = origins.find((candidate) => candidate.origin === url.origin);
  if (
    url.protocol !== "https:" ||
    !config ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(`Social cards require an approved HTTPS origin: ${value}`);
  }
  return url;
}

function canonicalPath(origin: URL, value: string): URL {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f<>]/.test(value) ||
    value.includes("?") ||
    value.includes("#")
  ) {
    throw new Error(`Social cards require a canonical route path: ${value}`);
  }

  const url = new URL(value, origin);
  const config = origins.find((candidate) => candidate.origin === origin.origin)!;
  if (config.trailingSlash && url.pathname !== "/" && !url.pathname.endsWith("/")) {
    url.pathname += "/";
  }
  if (!config.trailingSlash && url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url;
}

function routeSlug(url: URL): string {
  const segments = url.pathname.split("/").filter(Boolean).map((segment) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      throw new Error(`Social-card path contains invalid percent encoding: ${url.pathname}`);
    }
    return decoded
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }).filter(Boolean);

  return segments.slice(0, 4).join("-").slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "") || "home";
}

/** Return the stable, origin-specific public path for a canonical indexable route. */
export function socialCardPath(origin: string, path: string): string {
  const originUrl = canonicalOrigin(origin);
  const routeUrl = canonicalPath(originUrl, path);
  const digest = createHash("sha256")
    .update(JSON.stringify([routeUrl.origin, routeUrl.pathname]))
    .digest("hex")
    .slice(0, HASH_LENGTH);
  return `${SOCIAL_DIRECTORY}${routeSlug(routeUrl)}-${digest}.png`;
}

/** Return the absolute local social-card URL for a canonical indexable route. */
export function socialCardUrl(origin: string, path: string): string {
  return new URL(socialCardPath(origin, path), canonicalOrigin(origin)).toString();
}
