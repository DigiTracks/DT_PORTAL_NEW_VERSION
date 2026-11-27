import { describe, expect, it } from "vitest";
import {
  keepsIdempotencyKey,
  payloadFingerprint,
  resolveIdempotencyState,
} from "../../packages/ui/src/lib/idempotency";

const lead = { name: "Ada", email: "ada@example.com", message: "Hi", turnstileToken: "t1" };

describe("lead idempotency policy", () => {
  it("ignores the single-use Turnstile token in the fingerprint", () => {
    expect(payloadFingerprint(lead)).toBe(payloadFingerprint({ ...lead, turnstileToken: "t2" }));
  });

  it("reuses the key when a retry carries the same payload", () => {
    const first = resolveIdempotencyState(null, payloadFingerprint(lead), () => "key-1");
    const retry = resolveIdempotencyState(first, payloadFingerprint({ ...lead, turnstileToken: "t2" }), () => "key-2");
    expect(retry.key).toBe("key-1");
  });

  it("issues a new key when the payload changes", () => {
    const first = resolveIdempotencyState(null, payloadFingerprint(lead), () => "key-1");
    const changed = resolveIdempotencyState(first, payloadFingerprint({ ...lead, message: "Other" }), () => "key-2");
    expect(changed.key).toBe("key-2");
  });

  it("keeps the key only for ambiguous outcomes (409 and 5xx)", () => {
    expect(keepsIdempotencyKey(409)).toBe(true);
    expect(keepsIdempotencyKey(500)).toBe(true);
    expect(keepsIdempotencyKey(503)).toBe(true);
  });

  it("clears the key on success and on definitive 4xx responses", () => {
    expect(keepsIdempotencyKey(200)).toBe(false);
    expect(keepsIdempotencyKey(201)).toBe(false);
    expect(keepsIdempotencyKey(400)).toBe(false);
    expect(keepsIdempotencyKey(422)).toBe(false);
    expect(keepsIdempotencyKey(429)).toBe(false);
  });
});
