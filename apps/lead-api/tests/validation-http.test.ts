import { describe, expect, it, vi } from "vitest";
import { LEAD_BODY_CAP_BYTES, readConfig } from "../src/config";
import { HttpError, clientRateKey, exactOrigin, readJsonBody } from "../src/http";
import { IsolateRateLimiter } from "../src/rate-limit";
import { verifyTurnstile } from "../src/turnstile";
import { validIdempotencyHeader, validateLeadPayload } from "../src/validation";
import { testEnv, validLeadPayload } from "./helpers";

const portal = "https://digitracks.net";

describe("lead validation", () => {
  it("accepts a minimized canonical request from an estate origin", () => {
    const config = readConfig(testEnv());
    const result = validateLeadPayload(validLeadPayload(), portal, config.allowedOrigins);
    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({
      intent: "product-enquiry",
      email: "visitor@example.com",
      organization: "Example Organization",
      productId: "vedik",
      pagePath: "/products/vedik/",
      consent: true,
      locale: "en-gb",
    });
  });

  it("accepts a registered public page on a child origin", () => {
    const config = readConfig(testEnv());
    const result = validateLeadPayload(
      validLeadPayload({ productId: null, page: "https://learn.digitracks.net/contact/" }),
      "https://learn.digitracks.net",
      config.allowedOrigins,
    );
    expect(result.ok).toBe(true);
    expect(result.value?.sourceOrigin).toBe("https://learn.digitracks.net");
  });

  it.each([
    ["intent", { intent: "free-money" }],
    ["name", { name: "" }],
    ["email", { email: "not-an-email" }],
    ["organization", { organization: "x".repeat(161) }],
    ["productId", { productId: "not-in-catalog" }],
    ["productId", { productId: "bad_product" }],
    ["page", { page: "/not-a-registered-page/" }],
    ["page", { page: "https://evil.example/products/vedik/" }],
    ["message", { message: "" }],
    ["message", { message: "x".repeat(4_001) }],
    ["consent", { consent: false }],
    ["honeypot", { honeypot: 42 }],
    ["turnstileToken", { turnstileToken: "" }],
    ["locale", { locale: "en_US.extra" }],
  ])("rejects invalid %s", (field, override) => {
    const config = readConfig(testEnv());
    const result = validateLeadPayload(validLeadPayload(override), portal, config.allowedOrigins);
    expect(result.ok).toBe(false);
    expect(result.fields).toContain(field);
  });

  it("rejects unknown fields, arrays, control characters and demo requests without a product", () => {
    const config = readConfig(testEnv());
    expect(validateLeadPayload(validLeadPayload({ recipient: "attacker@example.test" }), portal, config.allowedOrigins).fields)
      .toContain("unknown_fields");
    expect(validateLeadPayload([], portal, config.allowedOrigins)).toEqual({ ok: false, fields: ["body"] });
    expect(validateLeadPayload(validLeadPayload({ name: "Bad\u0000Name" }), portal, config.allowedOrigins).fields)
      .toContain("name");
    expect(validateLeadPayload(validLeadPayload({ intent: "demo", productId: null }), portal, config.allowedOrigins).fields)
      .toContain("productId");
    expect(validateLeadPayload(validLeadPayload({ intent: "demo", productId: "mindone" }), portal, config.allowedOrigins).fields)
      .toContain("productId");
    expect(validateLeadPayload(validLeadPayload({ intent: "demo", productId: "unify" }), portal, config.allowedOrigins).ok)
      .toBe(true);
  });

  it("validates idempotency key syntax and length", () => {
    expect(validIdempotencyHeader("abcdefgh")).toBe("abcdefgh");
    expect(validIdempotencyHeader("a".repeat(200))).toHaveLength(200);
    expect(validIdempotencyHeader(null)).toBeUndefined();
    expect(validIdempotencyHeader("short")).toBeUndefined();
    expect(validIdempotencyHeader("a".repeat(201))).toBeUndefined();
    expect(validIdempotencyHeader("contains space")).toBeUndefined();
  });
});

describe("HTTP body and origin guards", () => {
  it("enforces exact origins and does not trust forwarded-for", () => {
    const config = readConfig(testEnv());
    expect(exactOrigin(new Request("https://api.example.test", { headers: { Origin: portal } }), config.allowedOrigins)).toBe(portal);
    expect(() => exactOrigin(new Request("https://api.example.test", { headers: { Origin: "https://digitracks.net.evil.example" } }), config.allowedOrigins))
      .toThrow(HttpError);
    expect(() => exactOrigin(new Request("https://api.example.test"), config.allowedOrigins)).toThrow(HttpError);
    expect(clientRateKey(new Request("https://api.example.test", { headers: { "X-Forwarded-For": "198.51.100.1" } }))).toBe("local");
  });

  it("accepts JSON exactly at the streamed byte cap", async () => {
    const raw = JSON.stringify(validLeadPayload()).padEnd(LEAD_BODY_CAP_BYTES, " ");
    const request = new Request("https://api.example.test", { method: "POST", headers: { "Content-Type": "application/json" }, body: raw });
    await expect(readJsonBody(request)).resolves.toMatchObject({ name: "Example Visitor" });
  });

  it("rejects an oversized declared body before reading it", async () => {
    const request = new Request("https://api.example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": String(LEAD_BODY_CAP_BYTES + 1) },
      body: "{}",
    });
    await expect(readJsonBody(request)).rejects.toMatchObject({ status: 413, code: "payload_too_large" });
  });

  it("cancels a streamed body that crosses the cap without a content length", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(LEAD_BODY_CAP_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel,
    });
    const request = new Request("https://api.example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit);
    await expect(readJsonBody(request)).rejects.toMatchObject({ status: 413 });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it.each([
    [undefined, "{}", 415],
    ["text/plain", "{}", 415],
    ["application/json; charset=iso-8859-1", "{}", 415],
    ["application/json", "{", 400],
  ])("rejects unsupported or invalid JSON requests", async (contentType, body, status) => {
    const headers = new Headers();
    if (contentType) headers.set("Content-Type", contentType);
    const request = new Request("https://api.example.test", { method: "POST", headers, body });
    await expect(readJsonBody(request)).rejects.toMatchObject({ status });
  });

  it("rejects compressed and invalid UTF-8 bodies", async () => {
    const compressed = new Request("https://api.example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
      body: "{}",
    });
    await expect(readJsonBody(compressed)).rejects.toMatchObject({ status: 415 });
    const invalidUtf8 = new Request("https://api.example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: new Uint8Array([0xff]),
    });
    await expect(readJsonBody(invalidUtf8)).rejects.toMatchObject({ status: 400, code: "invalid_json" });
  });
});

describe("abuse and Turnstile configuration", () => {
  it("fails closed for missing or incoherent Turnstile settings", () => {
    expect(readConfig({ ...testEnv(), TURNSTILE_SECRET: undefined }).turnstile.state).toBe("incoherent");
    expect(readConfig({ ...testEnv(), TURNSTILE_SITE_KEY: undefined }).turnstile.state).toBe("incoherent");
    expect(readConfig({ ...testEnv(), TURNSTILE_SECRET: undefined, TURNSTILE_SITE_KEY: undefined }).turnstile.state).toBe("unconfigured");
    expect(readConfig({ ...testEnv(), TURNSTILE_EXPECTED_HOSTNAMES: "bad_host" }).turnstile.state).toBe("incoherent");
    expect(readConfig({ ...testEnv(), TURNSTILE_EXPECTED_HOSTNAMES: "evil.example" }).turnstile.state).toBe("incoherent");
  });

  it("binds an omitted Turnstile hostname allowlist to the estate", () => {
    const config = readConfig({ ...testEnv(), TURNSTILE_EXPECTED_HOSTNAMES: undefined });
    expect(config.turnstile.state).toBe("configured");
    if (config.turnstile.state === "configured") {
      expect(config.turnstile.expectedHostnames).toContain("digitracks.net");
      expect(config.turnstile.expectedHostnames).toContain("learn.digitracks.net");
      expect(config.turnstile.expectedHostnames).toContain("localhost");
    }
  });

  it("allows only rooted loopback origins for local development", () => {
    const config = readConfig({
      ...testEnv(),
      ALLOWED_LOCAL_ORIGINS: "http://localhost:8788,https://127.0.0.1:9443,https://evil.example,http://[::1]:8788",
    });
    expect(config.localOrigins).toEqual(["http://localhost:8788", "https://127.0.0.1:9443", "http://[::1]:8788"]);
    expect(config.localOrigins).not.toContain("https://127.0.0.1:9443/path");
    expect(config.allowedOrigins.has("https://evil.example")).toBe(false);
  });

  it("enforces a fixed per-isolate window and reports retry timing", () => {
    const limiter = new IsolateRateLimiter();
    const input = { key: "client", limit: 2, windowSeconds: 60, now: 1_000_000 };
    expect(limiter.check(input)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(limiter.check(input)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(limiter.check(input)).toEqual({ allowed: false, retryAfterSeconds: 60 });
    expect(limiter.check({ ...input, now: 1_060_000 }).allowed).toBe(true);
  });

  it("verifies Turnstile success, action and hostname", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({ success: true, action: "lead", hostname: "DIGITRACKS.NET" }));
    const config = readConfig(testEnv()).turnstile;
    expect(config.state).toBe("configured");
    if (config.state !== "configured") return;
    await expect(verifyTurnstile("token", config, fetchImpl)).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST", redirect: "error" }),
    );
  });

  it.each([
    [{ success: true, action: "other", hostname: "digitracks.net" }],
    [{ success: true, action: "lead", hostname: "evil.example" }],
    [{ success: false, action: "lead", hostname: "digitracks.net" }],
    [null],
  ])("rejects mismatched or malformed verification responses", async (result) => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(result));
    const config = readConfig(testEnv()).turnstile;
    if (config.state !== "configured") throw new Error("fixture");
    await expect(verifyTurnstile("token", config, fetchImpl)).resolves.toBe(false);
  });

  it("treats provider errors and an empty hostname allowlist as failure", async () => {
    const config = readConfig(testEnv()).turnstile;
    if (config.state !== "configured") throw new Error("fixture");
    const fetchImpl = vi.fn<typeof fetch>(async () => { throw new Error("network"); });
    await expect(verifyTurnstile("token", config, fetchImpl)).resolves.toBe(false);
    await expect(verifyTurnstile("token", { ...config, expectedHostnames: [] }, fetchImpl)).resolves.toBe(false);
  });
});
