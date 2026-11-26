import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { IsolateRateLimiter } from "../src/rate-limit";
import type { D1Database, Env, WorkerDependencies } from "../src/types";
import {
  captureAnalytics,
  createTestDatabase,
  jsonBody,
  leadRequest,
  testContext,
  testEnv,
  validLeadPayload,
} from "./helpers";

function dependencies(overrides: Partial<WorkerDependencies> = {}): WorkerDependencies {
  return {
    now: () => Date.parse("2026-11-25T12:00:00.000Z"),
    rateLimiter: new IsolateRateLimiter(),
    turnstileVerifier: vi.fn(async () => true),
    ...overrides,
  };
}

async function submit(env: Env, deps: WorkerDependencies = dependencies(), request = leadRequest()) {
  return worker.fetch(request, env, testContext(), deps);
}

describe("lead request guards", () => {
  it("allows only POST and exact registered origins", async () => {
    const { db } = createTestDatabase();
    const env = testEnv(db);
    const wrongOrigin = await submit(env, dependencies(), leadRequest(validLeadPayload(), { origin: "https://evil.example" }));
    expect(wrongOrigin.status).toBe(403);
    expect((await jsonBody(wrongOrigin)).error.code).toBe("origin_not_allowed");

    const wrongMethod = await submit(env, dependencies(), leadRequest(validLeadPayload(), { method: "GET" }));
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("Allow")).toBe("POST");

    const preflight = await submit(env, dependencies(), leadRequest(validLeadPayload(), { method: "OPTIONS" }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe("https://digitracks.net");
    expect(preflight.headers.get("Access-Control-Allow-Headers")).toContain("Idempotency-Key");
  });

  it("requires a valid client nonce before accepting a lead", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    for (const key of [null, "short", "contains space", "x".repeat(201)]) {
      const response = await submit(env, dependencies(), leadRequest(validLeadPayload(), { idempotencyKey: key }));
      expect(response.status).toBe(400);
      expect((await jsonBody(response)).error.code).toBe("invalid_idempotency_key");
    }
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(0);
  });

  it("fails closed when Turnstile is missing or incoherent", async () => {
    const database = createTestDatabase();
    const verifier = vi.fn(async () => true);
    for (const env of [
      { ...testEnv(database.db), TURNSTILE_SECRET: undefined },
      { ...testEnv(database.db), TURNSTILE_SITE_KEY: undefined, TURNSTILE_SECRET: undefined },
      { ...testEnv(database.db), TURNSTILE_EXPECTED_HOSTNAMES: "evil.example" },
    ]) {
      const response = await submit(env, dependencies({ turnstileVerifier: verifier }));
      expect(response.status).toBe(503);
      expect((await jsonBody(response)).error.code).toBe("turnstile_unconfigured");
    }
    expect(verifier).not.toHaveBeenCalled();
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(0);
  });

  it("rejects rate-limited, honeypot and failed-verification requests without writing", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const limited = await submit(env, dependencies({ rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 17 }) } }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("17");

    const verifier = vi.fn(async () => true);
    const honeypot = await submit(env, dependencies({ turnstileVerifier: verifier }), leadRequest(validLeadPayload({ honeypot: "bot" })));
    expect(honeypot.status).toBe(400);
    expect((await jsonBody(honeypot)).error.code).toBe("invalid_request");
    expect(verifier).not.toHaveBeenCalled();

    const rejected = await submit(env, dependencies({ turnstileVerifier: async () => false }));
    expect(rejected.status).toBe(403);
    const thrown = await submit(env, dependencies({ turnstileVerifier: async () => { throw new Error("provider"); } }));
    expect(thrown.status).toBe(403);
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(0);
  });

  it("rejects schema and streamed-size violations before D1", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const invalid = await submit(env, dependencies(), leadRequest(validLeadPayload({ productId: "unknown-product" })));
    expect(invalid.status).toBe(400);
    expect((await jsonBody(invalid)).error.fields).toContain("productId");

    const oversized = await submit(env, dependencies(), leadRequest(validLeadPayload(), { rawBody: "x".repeat(20_001) }));
    expect(oversized.status).toBe(413);
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(0);
  });

  it("requires both durable storage and a queue binding", async () => {
    const database = createTestDatabase();
    const noDb = await submit({ ...testEnv(database.db), DB: undefined });
    expect(noDb.status).toBe(503);
    const noQueue = await submit({ ...testEnv(database.db), LEAD_QUEUE: undefined });
    expect(noQueue.status).toBe(503);
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(0);
  });
});

describe("durable lead acceptance and idempotency", () => {
  it("returns received only after the D1 transaction commits and queues both outbox rows", async () => {
    const database = createTestDatabase();
    const analytics = captureAnalytics();
    const send = vi.fn(async (_payload: { outboxId: string }) => {
      expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(1);
      expect(database.count("SELECT COUNT(*) AS count FROM outbox")).toBe(2);
    });
    const env = { ...testEnv(database.db), LEAD_QUEUE: { send }, ANALYTICS: analytics.dataset };
    const response = await submit(env);
    expect(response.status).toBe(202);
    const body = await jsonBody(response);
    expect(body).toMatchObject({ status: "received", duplicate: false, delivery: "queued" });
    expect(body.receiptId).toMatch(/^rcpt_[a-f0-9]{32}$/);
    expect(JSON.stringify(body)).not.toMatch(/out_|del_|lead_/);
    expect(send).toHaveBeenCalledTimes(2);
    for (const [payload] of send.mock.calls) {
      expect(Object.keys(payload)).toEqual(["outboxId"]);
      expect(payload.outboxId).toMatch(/^out_[a-f0-9]{32}$/);
    }
    expect(database.count("SELECT COUNT(*) AS count FROM leads WHERE status = 'received'")).toBe(1);
    expect(database.count("SELECT COUNT(*) AS count FROM outbox WHERE status = 'pending'")).toBe(2);
    expect(database.count("SELECT COUNT(*) AS count FROM idempotency_keys")).toBe(1);
  });

  it("does not acknowledge receipt or send work when D1 fails", async () => {
    const database = createTestDatabase();
    const send = vi.fn(async () => undefined);
    const failingDb: D1Database = {
      ...database.db,
      batch: vi.fn(async () => { throw new Error("D1 unavailable"); }),
    };
    const response = await submit({ ...testEnv(failingDb), LEAD_QUEUE: { send } });
    expect(response.status).toBe(503);
    expect((await jsonBody(response)).error.code).toBe("storage_unavailable");
    expect(send).not.toHaveBeenCalled();
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(0);
  });

  it("returns the original receipt without duplicate leads, outbox rows, queue work or analytics", async () => {
    const database = createTestDatabase();
    const analytics = captureAnalytics();
    const send = vi.fn(async () => undefined);
    const env = { ...testEnv(database.db), LEAD_QUEUE: { send }, ANALYTICS: analytics.dataset };
    const first = await jsonBody(await submit(env));
    const second = await jsonBody(await submit(env));
    expect(second).toMatchObject({ status: "received", receiptId: first.receiptId, duplicate: true, delivery: "unknown" });
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(1);
    expect(database.count("SELECT COUNT(*) AS count FROM outbox")).toBe(2);
    expect(database.count("SELECT COUNT(*) AS count FROM idempotency_keys")).toBe(1);
    expect(send).toHaveBeenCalledTimes(2);
    expect(analytics.points).toHaveLength(1);
  });

  it("returns 409 when the same nonce is reused with a different fingerprint", async () => {
    const database = createTestDatabase();
    const send = vi.fn(async () => undefined);
    const env = { ...testEnv(database.db), LEAD_QUEUE: { send } };
    await submit(env);
    const conflict = await submit(env, dependencies(), leadRequest(validLeadPayload({ message: "A different requirement." })));
    expect(conflict.status).toBe(409);
    expect((await jsonBody(conflict)).error.code).toBe("idempotency_conflict");
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(1);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("allows distinct client nonces for otherwise identical submissions", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    await submit(env, dependencies(), leadRequest(validLeadPayload(), { idempotencyKey: "nonce-one-0001" }));
    await submit(env, dependencies(), leadRequest(validLeadPayload(), { idempotencyKey: "nonce-two-0002" }));
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(2);
    expect(database.count("SELECT COUNT(*) AS count FROM outbox")).toBe(4);
  });

  it("keeps a committed lead pending repair if queue publication fails", async () => {
    const database = createTestDatabase();
    const send = vi.fn<(payload: { outboxId: string }) => Promise<void>>()
      .mockRejectedValueOnce(new Error("queue unavailable"))
      .mockResolvedValueOnce(undefined);
    const response = await submit({ ...testEnv(database.db), LEAD_QUEUE: { send } });
    expect(response.status).toBe(202);
    expect(await jsonBody(response)).toMatchObject({ status: "received", delivery: "pending_repair" });
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(1);
    expect(database.count("SELECT COUNT(*) AS count FROM outbox WHERE status = 'pending'")).toBe(2);
  });

  it("accepts a child-origin submission and a trailing-slash endpoint", async () => {
    const database = createTestDatabase();
    const request = leadRequest(validLeadPayload({ productId: null, page: "/contact/" }), { origin: "https://learn.digitracks.net" });
    const trailingSlash = new Request(request.url.replace(/\/api\/lead$/, "/api/lead/"), {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(validLeadPayload({ productId: null, page: "/contact/" })),
    });
    const response = await submit(testEnv(database.db), dependencies(), trailingSlash);
    expect(response.status).toBe(202);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://learn.digitracks.net");
  });
});

describe("privacy-safe telemetry and health", () => {
  it("emits only hashed correlation and approved dimensions, never form PII or secrets", async () => {
    const database = createTestDatabase();
    const analytics = captureAnalytics();
    const env = { ...testEnv(database.db), ANALYTICS: analytics.dataset };
    const response = await submit(env, dependencies(), leadRequest(validLeadPayload({
      name: "Sensitive Person",
      email: "sensitive@example.com",
      organization: "Private Org",
      message: "Private message content",
      turnstileToken: "private-turnstile-token",
    })));
    expect(response.status).toBe(202);
    expect(analytics.points).toHaveLength(1);
    expect(analytics.points[0]).toMatchObject({
      indexes: ["lead_received"],
      blobs: ["product-enquiry", "vedik", expect.stringMatching(/^[a-f0-9]{32}$/), "none", "none", "none"],
      doubles: [1],
    });
    const serialized = JSON.stringify(analytics.points);
    for (const forbidden of [
      "Sensitive Person", "sensitive@example.com", "Private Org", "Private message content",
      "private-turnstile-token", env.RESEND_API_KEY, env.CRM_WEBHOOK_SECRET,
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).not.toMatch(/lead_[a-f0-9]{32}/);
  });

  it("reports health without secret values", async () => {
    const database = createTestDatabase();
    const ready = await worker.fetch(new Request("https://api.example.test/api/lead/health"), testEnv(database.db), testContext());
    expect(ready.status).toBe(200);
    expect(await ready.json()).toEqual({ status: "ready", d1Binding: true, queueBinding: true, analyticsBinding: false });
    const degraded = await worker.fetch(new Request("https://api.example.test/api/lead/health"), testEnv(), testContext());
    expect(degraded.status).toBe(503);
    expect(JSON.stringify(await degraded.json())).not.toContain(testEnv().TURNSTILE_SECRET);
  });
});
