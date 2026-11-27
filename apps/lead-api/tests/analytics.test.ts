import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { trackBrowserEvent, trackEvent } from "../src/analytics";
import { captureAnalytics } from "./helpers";

describe("privacy-safe analytics", () => {
  it("writes only the fixed event shape with a truncated correlation hash", async () => {
    const { dataset, points } = captureAnalytics();
    await trackEvent(dataset, "lead_delivery_webhook", {
      intent: "demo",
      productId: "unify",
      correlationId: "lead_0123456789abcdef0123456789abcdef",
      destination: "webhook",
      errorCategory: "acknowledged",
    });
    expect(points).toEqual([{
      indexes: ["lead_delivery_webhook"],
      blobs: [
        "demo",
        "unify",
        createHash("sha256").update("lead_0123456789abcdef0123456789abcdef").digest("hex").slice(0, 32),
        "webhook",
        "acknowledged",
        "none",
      ],
      doubles: [1],
    }]);
  });

  it("drops arbitrary PII-shaped dimensions and never serializes extra properties", async () => {
    const { dataset, points } = captureAnalytics();
    const context = {
      intent: "person@example.com",
      productId: "Private Person",
      correlationId: "grant_0123456789abcdef0123456789abcdef",
      destination: "email" as const,
      errorCategory: "provider rejected: sensitive detail",
      name: "Private Person",
      email: "person@example.com",
      message: "Private message",
      token: "private-token",
    };
    await trackEvent(dataset, "lead_delivery_failed", context);
    const serialized = JSON.stringify(points);
    expect(points[0].blobs?.slice(0, 2)).toEqual(["none", "none"]);
    expect(points[0].blobs?.[4]).toBe("none");
    for (const value of ["Private Person", "person@example.com", "Private message", "private-token", "sensitive detail"]) {
      expect(serialized).not.toContain(value);
    }
  });

  it("never changes durable behavior when analytics is absent or throws", async () => {
    await expect(trackEvent(undefined, "lead_received")).resolves.toBeUndefined();
    const writeDataPoint = vi.fn(() => { throw new Error("analytics unavailable"); });
    await expect(trackEvent({ writeDataPoint }, "lead_received", { correlationId: "lead_test" })).resolves.toBeUndefined();
    expect(writeDataPoint).toHaveBeenCalledOnce();
  });

  it("records browser milestones without URLs, correlation IDs or form content", async () => {
    const { dataset, points } = captureAnalytics();
    await trackBrowserEvent(dataset, "demo_open", {
      intent: "demo",
      productId: "unify",
      ctaId: "request-product-demo",
    });
    expect(points).toEqual([{
      indexes: ["demo_open"],
      blobs: ["demo", "unify", "none", "none", "request-product-demo", "none"],
      doubles: [1],
    }]);
  });

  it("drops PII-shaped browser dimensions and tolerates an unavailable dataset", async () => {
    const { dataset, points } = captureAnalytics();
    await trackBrowserEvent(dataset, "lead_start", {
      intent: "person@example.com",
      productId: "Private Person",
      ctaId: "private-token",
      resourceId: "sensitive detail",
    });
    expect(points[0].blobs).toEqual(["none", "none", "none", "none", "none", "none"]);
    expect(JSON.stringify(points)).not.toMatch(/person@example|Private Person|private-token|sensitive detail/);
    await expect(trackBrowserEvent(undefined, "lead_submit")).resolves.toBeUndefined();
    const writeDataPoint = vi.fn(() => { throw new Error("analytics unavailable"); });
    await expect(trackBrowserEvent({ writeDataPoint }, "lead_submit")).resolves.toBeUndefined();
  });
});
