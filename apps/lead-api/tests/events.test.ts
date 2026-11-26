import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { IsolateRateLimiter } from "../src/rate-limit";
import type { Env, WorkerDependencies } from "../src/types";
import { captureAnalytics, testContext, testEnv } from "./helpers";

interface EventRequestOptions {
  origin?: string;
  method?: string;
  rawBody?: string;
  ip?: string;
}

function eventRequest(payload: Record<string, unknown> = { event: "lead_start" }, options: EventRequestOptions = {}): Request {
  const method = options.method ?? "POST";
  return new Request("https://api.example.test/api/events", {
    method,
    headers: {
      Origin: options.origin ?? "https://digitracks.net",
      "Content-Type": "application/json",
      "CF-Connecting-IP": options.ip ?? "203.0.113.20",
    },
    ...(method === "GET" || method === "OPTIONS" ? {} : { body: options.rawBody ?? JSON.stringify(payload) }),
  });
}

function dependencies(overrides: Partial<WorkerDependencies> = {}): WorkerDependencies {
  return {
    now: () => Date.parse("2026-11-25T12:00:00.000Z"),
    rateLimiter: new IsolateRateLimiter(),
    ...overrides,
  };
}

async function submit(env: Env, request = eventRequest(), deps = dependencies()) {
  return worker.fetch(request, env, testContext(), deps);
}

describe("first-party browser events", () => {
  it("accepts the fixed milestone vocabulary without D1, Queue or Turnstile", async () => {
    const analytics = captureAnalytics();
    const env = { ...testEnv(), ANALYTICS: analytics.dataset, DB: undefined, LEAD_QUEUE: undefined };
    const cases = [
      { event: "cta_click", ctaId: "request-product-demo", intent: "demo", productId: "vedik" },
      { event: "demo_open", ctaId: "request-product-demo", intent: "demo", productId: "vedik" },
      { event: "resource_export", resourceId: "sourcecraft-favourites" },
      { event: "lead_start", intent: "migration", productId: "unify" },
      { event: "lead_submit", intent: "migration", productId: "unify" },
    ];
    for (const payload of cases) {
      const response = await submit(env, eventRequest(payload));
      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://digitracks.net");
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
    expect(analytics.points.map((point) => point.indexes)).toEqual(cases.map((item) => [item.event]));
    expect(analytics.points[0].blobs).toEqual(["demo", "vedik", "none", "none", "request-product-demo", "none"]);
    expect(analytics.points[2].blobs).toEqual(["none", "none", "none", "none", "none", "sourcecraft-favourites"]);
  });

  it("rejects unknown fields, arbitrary identifiers and invalid milestone context before writing", async () => {
    const analytics = captureAnalytics();
    const env = { ...testEnv(), ANALYTICS: analytics.dataset };
    const invalid = [
      { event: "page_view" },
      { event: "lead_start", email: "private@example.com" },
      { event: "cta_click", ctaId: "private-person" },
      { event: "resource_export", resourceId: "private-token" },
      { event: "demo_open", ctaId: "request-demo", intent: "consultation" },
      { event: "lead_submit", ctaId: "request-demo" },
      { event: "lead_start", productId: "not-in-catalog" },
    ];
    for (const payload of invalid) {
      const response = await submit(env, eventRequest(payload));
      expect(response.status).toBe(400);
      expect((await response.json() as { error: { fields: string[] } }).error.fields.length).toBeGreaterThan(0);
    }
    expect(analytics.points).toEqual([]);
  });

  it("enforces method, exact origin, rate and streamed body limits", async () => {
    const analytics = captureAnalytics();
    const env = { ...testEnv(), ANALYTICS: analytics.dataset };
    expect((await submit(env, eventRequest({ event: "lead_start" }, { method: "GET" }))).status).toBe(405);
    expect((await submit(env, eventRequest({ event: "lead_start" }, { origin: "https://evil.example" }))).status).toBe(403);
    const preflight = await submit(env, eventRequest({ event: "lead_start" }, { method: "OPTIONS" }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe("https://digitracks.net");

    const limited = await submit(env, eventRequest(), dependencies({ rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 9 }) } }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("9");
    const oversized = await submit(env, eventRequest({ event: "lead_start" }, { rawBody: "x".repeat(2_001) }));
    expect(oversized.status).toBe(413);
    expect(analytics.points).toEqual([]);
  });

  it("never lets missing or failing analytics change the browser response", async () => {
    await expect(submit(testEnv())).resolves.toMatchObject({ status: 204 });
    const writeDataPoint = vi.fn(() => { throw new Error("analytics unavailable"); });
    await expect(submit({ ...testEnv(), ANALYTICS: { writeDataPoint } })).resolves.toMatchObject({ status: 204 });
    expect(writeDataPoint).toHaveBeenCalledOnce();
  });
});
