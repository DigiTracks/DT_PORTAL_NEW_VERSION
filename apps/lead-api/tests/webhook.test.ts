import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { readConfig } from "../src/config";
import { buildWebhookBody, deliverWebhook, signWebhook, verifyWebhookSignature } from "../src/webhook";
import type { LeadRecord } from "../src/leads";
import { testEnv } from "./helpers";

const now = Date.parse("2026-11-25T12:00:00.000Z");
const lead: LeadRecord = {
  id: "lead_0123456789abcdef0123456789abcdef",
  receiptId: "rcpt_0123456789abcdef0123456789abcdef",
  intent: "demo",
  name: "Example Visitor",
  email: "visitor@example.com",
  organization: null,
  productId: "vedik",
  sourceOrigin: "https://digitracks.net",
  pagePath: "/products/vedik/",
  message: "A requirements message.",
  consent: 1,
  locale: "en-GB",
  status: "received",
  receivedAt: "2026-11-25T12:00:00.000Z",
};

const secret = "crm-signing-secret-000000000000000000";
const previousSecret = "previous-crm-secret-00000000000000000";

describe("signed webhook contract", () => {
  it("constructs the documented HMAC over timestamp and exact raw body", async () => {
    const timestamp = "1764081600";
    const rawBody = '{"delivery_id":"del_123","event_version":"1"}';
    const expected = `v1=${createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")}`;
    await expect(signWebhook(secret, timestamp, rawBody)).resolves.toBe(expected);
    await expect(verifyWebhookSignature({
      secrets: [secret], timestamp, rawBody, signature: expected, nowSeconds: Number(timestamp), replayWindowSeconds: 300,
    })).resolves.toBe(true);
  });

  it("accepts the previous secret during rotation", async () => {
    const timestamp = "1764081600";
    const rawBody = "{}";
    const signature = await signWebhook(previousSecret, timestamp, rawBody);
    await expect(verifyWebhookSignature({
      secrets: [secret, previousSecret], timestamp, rawBody, signature, nowSeconds: Number(timestamp), replayWindowSeconds: 300,
    })).resolves.toBe(true);
  });

  it("rejects tampering, wrong secrets, malformed signatures and replay outside the window", async () => {
    const timestamp = "1764081600";
    const rawBody = '{"intent":"demo"}';
    const signature = await signWebhook(secret, timestamp, rawBody);
    const base = { secrets: [secret], timestamp, rawBody, signature, nowSeconds: Number(timestamp), replayWindowSeconds: 300 };
    await expect(verifyWebhookSignature({ ...base, rawBody: `${rawBody} ` })).resolves.toBe(false);
    await expect(verifyWebhookSignature({ ...base, secrets: ["wrong-secret"] })).resolves.toBe(false);
    await expect(verifyWebhookSignature({ ...base, signature: "v1=abc" })).resolves.toBe(false);
    await expect(verifyWebhookSignature({ ...base, timestamp: "not-a-time" })).resolves.toBe(false);
    await expect(verifyWebhookSignature({ ...base, nowSeconds: Number(timestamp) + 301 })).resolves.toBe(false);
    await expect(verifyWebhookSignature({ ...base, nowSeconds: Number(timestamp) - 301 })).resolves.toBe(false);
  });

  it("maps only configured non-null minimised fields and protects envelope fields", () => {
    const body = buildWebhookBody(lead, "del_stable", {
      intent: "intent",
      email: "contact.email",
      organization: "organization",
      message: "requirement",
    });
    expect(JSON.parse(body)).toEqual({
      delivery_id: "del_stable",
      event_version: "1",
      received_at: lead.receivedAt,
      intent: "demo",
      "contact.email": "visitor@example.com",
      requirement: "A requirements message.",
    });
    const config = readConfig({
      ...testEnv(),
      CRM_FIELD_MAPPING_JSON: JSON.stringify({ email: "received_at" }),
    }).webhook;
    expect(config.configured).toBe(false);
  });

  it("sends stable IDs and current/previous signatures without following redirects", async () => {
    const config = readConfig({ ...testEnv(), CRM_WEBHOOK_PREVIOUS_SECRET: previousSecret }).webhook;
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    const result = await deliverWebhook({ config, lead, deliveryId: "del_stable", fetchImpl, now: () => now });
    expect(result).toMatchObject({ outcome: "accepted", httpStatus: 204, errorCategory: "acknowledged" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://crm.example.test/leads");
    expect(init?.method).toBe("POST");
    expect(init?.redirect).toBe("manual");
    const headers = init?.headers as Record<string, string>;
    const rawBody = init?.body as string;
    const timestamp = String(Math.floor(now / 1_000));
    expect(headers["X-DigiTracks-Delivery-Id"]).toBe("del_stable");
    expect(headers["X-DigiTracks-Version"]).toBe("1");
    expect(headers["X-DigiTracks-Timestamp"]).toBe(timestamp);
    expect(headers["X-DigiTracks-Signature"]).toBe(await signWebhook(secret, timestamp, rawBody));
    expect(headers["X-DigiTracks-Signature-Previous"]).toBe(await signWebhook(previousSecret, timestamp, rawBody));
    expect(JSON.stringify(headers)).not.toContain(secret);
    expect(JSON.stringify(headers)).not.toContain(previousSecret);
  });

  it.each([
    [200, "accepted", "acknowledged"],
    [204, "accepted", "acknowledged"],
    [302, "permanent", "redirect_not_allowed"],
    [400, "permanent", "receiver_rejected"],
    [408, "retryable", "receiver_unavailable"],
    [429, "retryable", "receiver_unavailable"],
    [500, "retryable", "receiver_unavailable"],
    [503, "retryable", "receiver_unavailable"],
  ])("classifies HTTP %i honestly", async (status, outcome, errorCategory) => {
    const config = readConfig(testEnv()).webhook;
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status }));
    await expect(deliverWebhook({ config, lead, deliveryId: "del_stable", fetchImpl, now: () => now }))
      .resolves.toMatchObject({ outcome, httpStatus: status, errorCategory });
  });

  it("classifies timeouts as retryable and missing configuration as permanent", async () => {
    const config = readConfig(testEnv()).webhook;
    const fetchImpl = vi.fn<typeof fetch>(async () => { throw new DOMException("timed out", "TimeoutError"); });
    await expect(deliverWebhook({ config, lead, deliveryId: "del_stable", fetchImpl, now: () => now }))
      .resolves.toMatchObject({ outcome: "retryable", errorCategory: "timeout" });
    await expect(deliverWebhook({ config: { ...config, configured: false }, lead, deliveryId: "del_stable", fetchImpl, now: () => now }))
      .resolves.toMatchObject({ outcome: "permanent", errorCategory: "config_error" });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
