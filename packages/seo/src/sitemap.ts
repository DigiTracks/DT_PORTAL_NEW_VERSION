import { routeUrl, type OriginConfig, type RouteRecord } from "./routes.ts";

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]!);
}

export function buildSitemapXml(routes: readonly RouteRecord[], origin: OriginConfig, lastmod: Readonly<Record<string, string>> = {}): string {
  const urls = routes
    .filter((route) => route.origin === origin.id && route.routeClass === "public-seo" && route.indexable)
    .map((route) => {
      const date = lastmod[route.id];
      const lastmodLine = date ? `    <lastmod>${escapeXml(date)}</lastmod>\n` : "";
      return `  <url>\n    <loc>${escapeXml(routeUrl(origin.id, route.path))}</loc>\n${lastmodLine}  </url>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function buildSitemapIndexXml(origins: readonly OriginConfig[]): string {
  const entries = origins.map((origin) => `  <sitemap>\n    <loc>${escapeXml(`${origin.origin}/sitemap.xml`)}</loc>\n  </sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</sitemapindex>\n`;
}

export function buildRobotsTxt(origin: OriginConfig): string {
  return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${origin.origin}/sitemap.xml\n`;
}
