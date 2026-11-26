import { buildRobotsTxt, originById } from "@digitracks/seo";

export function GET() {
  return new Response(buildRobotsTxt(originById("sourcecraft")), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
