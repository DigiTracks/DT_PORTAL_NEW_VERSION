import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { demoToken, signWebhook } from "../src/webhook";
import type { Env } from "../src/types";
import { captureAnalytics, createTestDatabase, jsonBody, seedLead, testContext, testEnv } from "./helpers";

const baseTime = Date.parse("2026-11-25T12:00:00.500Z");
const operatorToken = "operator-token-000000000000000000000000";
const destination = "https://demo.example.test/vedik?access=server-configured";

function request(path: string, method: string, body?: unknown, authorized = true): Request {
  const headers = new Headers();
  if (authorized) headers.set("Authorization", `Bearer ${operatorToken}`);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  return new Request(`https://api.example.test${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function call(path: string, method: string, env: Env, body?: unknown, now = baseTime, authorized = true) {
  return worker.fetch(request(path, method, body, authorized), env, testContext(), { now: () => now });
}

async function issue(env: Env, overrides: Record<string, unknown> = {}, now = baseTime) {
  const response = await call("/api/demo/issue", "POST", env, { productId: "vedik", ...overrides }, now);
  expect(response.status).toBe(201);
  return await jsonBody(response) as { grantId: string; expiresAt: string; redeemPath: string; status: string };
}

function redeemRequest(grant: { redeemPath: string } | string): Request {
  const path = typeof grant === "string" ? grant : grant.redeemPath;
  return new Request(`https://api.example.test${path}`);
}

describe("operator demo grant issuance", () => {
  it("requires operator authorization and POST", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const unauthorized = await call("/api/demo/issue", "POST", env, { productId: "vedik" }, baseTime, false);
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("WWW-Authenticate")).toBe("Bearer");
    const wrongMethod = await call("/api/demo/issue", "GET", env);
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("Allow")).toBe("POST");
    expect(database.count("SELECT COUNT(*) AS count FROM demo_grants")).toBe(0);
  });

  it("issues a high-entropy, expiring, product-bound grant and stores only its hash", async () => {
    const database = createTestDatabase();
    const analytics = captureAnalytics();
    const env = { ...testEnv(database.db), ANALYTICS: analytics.dataset };
    const grant = await issue(env, { expiresInHours: 24 }, baseTime);
    expect(grant.status).toBe("issued");
    expect(grant.grantId).toMatch(/^grant_[a-f0-9]{32}$/);
    expect(grant.expiresAt).toBe("2026-11-26T12:00:00.000Z");
    expect(grant.redeemPath).toMatch(/^\/api\/demo\/redeem\?token=[A-Za-z0-9_-]{43}\.\d{10}\.v1=[a-f0-9]{64}$/);
    const token = new URL(`https://api.example.test${grant.redeemPath}`).searchParams.get("token")!.split(".")[0];
    const row = database.sqlite.prepare("SELECT * FROM demo_grants WHERE id = ?").get(grant.grantId) as Record<string, unknown>;
    expect(row.token_hash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(row.product_id).toBe("vedik");
    expect(row.expires_at).toBe(grant.expiresAt);
    expect(row.single_use).toBe(1);
    expect(JSON.stringify(row)).not.toContain(token);
    expect(JSON.stringify(grant)).not.toContain(destination);
    expect(JSON.stringify(analytics.points)).not.toContain(token);
    expect(JSON.stringify(analytics.points)).not.toContain(grant.grantId);
    expect(analytics.points[0].indexes).toEqual(["demo_access_issued"]);
  });

  it("rejects client-supplied destinations, unknown products and unconfigured products", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const destinationOverride = await call("/api/demo/issue", "POST", env, { productId: "vedik", destination: "https://evil.example" });
    expect(destinationOverride.status).toBe(400);
    expect((await jsonBody(destinationOverride)).error.code).toBe("invalid_request");
    const unknown = await call("/api/demo/issue", "POST", env, { productId: "unknown-product" });
    expect(unknown.status).toBe(400);
    expect((await jsonBody(unknown)).error.code).toBe("invalid_product");
    const unconfigured = await call("/api/demo/issue", "POST", env, { productId: "chronos" });
    expect(unconfigured.status).toBe(400);
    expect((await jsonBody(unconfigured)).error.code).toBe("demo_destination_unconfigured");
    expect(database.count("SELECT COUNT(*) AS count FROM demo_grants")).toBe(0);
  });

  it.each([0, 1.5, 721, "24"])("rejects invalid expiry %s", async (expiresInHours) => {
    const database = createTestDatabase();
    const response = await call("/api/demo/issue", "POST", testEnv(database.db), { productId: "vedik", expiresInHours });
    expect(response.status).toBe(400);
    expect((await jsonBody(response)).error.code).toBe("invalid_expiry");
  });

  it("links only an existing lead and fails closed on incoherent operator configuration", async () => {
    const database = createTestDatabase();
    const stored = await seedLead(database);
    if ("conflict" in stored) throw new Error("seed conflict");
    const env = testEnv(database.db);
    const badLead = await call("/api/demo/issue", "POST", env, { productId: "vedik", leadId: "lead_00000000000000000000000000000000" });
    expect(badLead.status).toBe(400);
    await issue(env, { leadId: stored.leadId });
    expect(database.sqlite.prepare("SELECT lead_id FROM demo_grants").get()).toEqual({ lead_id: stored.leadId });
    const incoherent = await call("/api/demo/issue", "POST", { ...env, DEMO_GRANT_PREVIOUS_SECRET: "short" }, { productId: "vedik" });
    expect(incoherent.status).toBe(503);
    expect((await jsonBody(incoherent)).error.code).toBe("operator_access_unconfigured");
  });
});

describe("demo grant redemption, revocation and expiry", () => {
  it("redirects to the server-configured destination exactly once", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const grant = await issue(env);
    const redeemed = await worker.fetch(redeemRequest(grant), env, testContext(), { now: () => baseTime + 1_000 });
    expect(redeemed.status).toBe(302);
    expect(redeemed.headers.get("Location")).toBe(destination);
    expect(redeemed.headers.get("Cache-Control")).toBe("no-store");
    expect(redeemed.headers.get("Referrer-Policy")).toBe("no-referrer");
    const repeated = await worker.fetch(redeemRequest(grant), env, testContext(), { now: () => baseTime + 2_000 });
    expect(repeated.status).toBe(404);
    expect(database.sqlite.prepare("SELECT redeemed_at FROM demo_grants WHERE id = ?").get(grant.grantId))
      .toEqual({ redeemed_at: new Date(baseTime + 1_000).toISOString() });
  });

  it("revokes without deleting the audit record and treats repeated revocation idempotently", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const grant = await issue(env);
    const revoked = await call(`/api/demo/grants/${grant.grantId}/revoke`, "POST", env, undefined, baseTime + 1_000);
    expect(revoked.status).toBe(200);
    expect(await revoked.json()).toEqual({ status: "revoked", grantId: grant.grantId });
    const denied = await worker.fetch(redeemRequest(grant), env, testContext(), { now: () => baseTime + 2_000 });
    expect(denied.status).toBe(404);
    const repeated = await call(`/api/demo/grants/${grant.grantId}/revoke`, "POST", env, undefined, baseTime + 3_000);
    expect(repeated.status).toBe(200);
    expect(await repeated.json()).toEqual({ status: "already_revoked", grantId: grant.grantId });
    const row = database.sqlite.prepare("SELECT revoked_at, revocation_reason FROM demo_grants WHERE id = ?").get(grant.grantId);
    expect(row).toEqual({ revoked_at: new Date(baseTime + 1_000).toISOString(), revocation_reason: "operator_revoked" });
  });

  it("denies expired grants with the same neutral response as unknown links", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const grant = await issue(env, { expiresInHours: 1 });
    const expiresAt = Date.parse(grant.expiresAt);
    const before = await worker.fetch(redeemRequest(grant), env, testContext(), { now: () => expiresAt - 1 });
    expect(before.status).toBe(302);
    const second = await issue(env, { expiresInHours: 1 });
    const expired = await worker.fetch(redeemRequest(second.redeemPath), env, testContext(), { now: () => Date.parse(second.expiresAt) });
    const unknown = await worker.fetch(new Request("https://api.example.test/api/demo/redeem?token=unknown"), env, testContext());
    expect(expired.status).toBe(404);
    expect(await expired.json()).toEqual(await unknown.json());
  });

  it("rejects tampered signatures, duplicate token parameters and non-GET methods", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const grant = await issue(env);
    const url = new URL(`https://api.example.test${grant.redeemPath}`);
    const token = url.searchParams.get("token")!;
    url.searchParams.set("token", `${token.slice(0, -1)}${token.endsWith("0") ? "1" : "0"}`);
    const tampered = await worker.fetch(new Request(url), env, testContext(), { now: () => baseTime + 1_000 });
    expect(tampered.status).toBe(404);
    const duplicate = await worker.fetch(new Request(`${url.origin}${url.pathname}?token=${token}&token=${token}`), env, testContext());
    expect(duplicate.status).toBe(404);
    const post = await call("/api/demo/redeem", "POST", env);
    expect(post.status).toBe(405);
    expect(post.headers.get("Allow")).toBe("GET");
    expect(database.count("SELECT COUNT(*) AS count FROM demo_grants WHERE redeemed_at IS NOT NULL")).toBe(0);
  });

  it("accepts the previous signing secret during rotation", async () => {
    const database = createTestDatabase();
    const original = testEnv(database.db);
    const grant = await issue(original);
    const rotated = {
      ...original,
      DEMO_GRANT_SECRET: "new-demo-signing-secret-00000000000000",
      DEMO_GRANT_PREVIOUS_SECRET: original.DEMO_GRANT_SECRET,
    };
    const response = await worker.fetch(redeemRequest(grant), rotated, testContext(), { now: () => baseTime + 1_000 });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(destination);
  });

  it("binds the signed expiry to the stored grant expiry", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const generated = demoToken();
    const signedExpiry = Math.floor((baseTime + 3_600_000) / 1_000);
    const suffix = await generated.signatureSuffix(signedExpiry, env.DEMO_GRANT_SECRET!);
    const hash = await generated.hashPromise;
    database.sqlite.prepare(`
      INSERT INTO demo_grants (id, token_hash, product_id, expires_at, single_use, created_at, updated_at)
      VALUES (?, ?, 'vedik', ?, 1, ?, ?)
    `).run(
      "grant_00000000000000000000000000000000",
      hash,
      new Date(baseTime + 7_200_000).toISOString(),
      new Date(baseTime).toISOString(),
      new Date(baseTime).toISOString(),
    );
    const response = await worker.fetch(
      new Request(`https://api.example.test/api/demo/redeem?token=${generated.token}.${suffix}`),
      env,
      testContext(),
      { now: () => baseTime + 1_000 },
    );
    expect(response.status).toBe(404);
  });

  it("fails closed when the destination or signing configuration disappears", async () => {
    const database = createTestDatabase();
    const env = testEnv(database.db);
    const grant = await issue(env);
    const noDestination = { ...env, DEMO_DESTINATIONS_JSON: "{}" };
    const denied = await worker.fetch(redeemRequest(grant), noDestination, testContext(), { now: () => baseTime + 1_000 });
    expect(denied.status).toBe(404);
    const noSecret = { ...env, DEMO_GRANT_SECRET: undefined, DEMO_GRANT_PREVIOUS_SECRET: undefined };
    const unsigned = await worker.fetch(redeemRequest(grant), noSecret, testContext(), { now: () => baseTime + 1_000 });
    expect(unsigned.status).toBe(404);
    expect(database.count("SELECT COUNT(*) AS count FROM demo_grants WHERE redeemed_at IS NOT NULL")).toBe(0);
  });
});
