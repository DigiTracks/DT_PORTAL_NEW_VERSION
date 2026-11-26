import { buildSitemapXml, originById, routeRegistry } from "@digitracks/seo";

export function GET() {
  return new Response(buildSitemapXml(routeRegistry, originById("learnpmo")), {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
