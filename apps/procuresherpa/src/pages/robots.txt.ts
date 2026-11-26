import { buildRobotsTxt, originById } from "@digitracks/seo";

export function GET() {
  return new Response(buildRobotsTxt(originById("procuresherpa")), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
