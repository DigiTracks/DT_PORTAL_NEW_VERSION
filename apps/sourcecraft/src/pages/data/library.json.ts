import { isFileRoute, routeRegistry } from "@digitracks/seo";

export function GET() {
  const records = routeRegistry
    .filter((route) => route.origin === "sourcecraft" && (route.routeClass === "public-seo" || route.routeClass === "public-utility") && !route.redirectTo && !route.hashRoute && !isFileRoute(route))
    .map((route) => ({
      id: route.id,
      path: route.path,
      title: route.title,
      description: route.description,
      indexable: route.indexable,
      contentStatus: route.contentStatus ?? null
    }));
  return new Response(JSON.stringify({ version: 1, records }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" }
  });
}
