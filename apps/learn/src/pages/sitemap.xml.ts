import { buildSitemapXml, originById, routeRegistry } from "@digitracks/seo";

export function GET() {
  return new Response(buildSitemapXml(routeRegistry, originById("learn")), {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
