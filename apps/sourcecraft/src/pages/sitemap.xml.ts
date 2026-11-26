import { buildSitemapXml, originById, routeRegistry } from "@digitracks/seo";

export function GET() {
  return new Response(buildSitemapXml(routeRegistry, originById("sourcecraft")), {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
