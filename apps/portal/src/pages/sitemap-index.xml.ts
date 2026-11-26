import { buildSitemapIndexXml, origins } from "@digitracks/seo";

export function GET() {
  return new Response(buildSitemapIndexXml(origins), {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
