import { describe, expect, it } from "vitest";
import { buildBrowserEvent } from "../../packages/ui/src/lib/analytics";

describe("privacy-safe browser event payloads", () => {
  it("builds only fixed, allowlisted CTA and demo context", () => {
    expect(buildBrowserEvent("cta_click", {
      ctaId: "request-product-demo",
      intent: "demo",
      productId: "vedik",
      page: "https://digitracks.net/contact/?email=private@example.com",
      name: "Private Person",
    })).toEqual({ event: "cta_click", ctaId: "request-product-demo", intent: "demo", productId: "vedik" });
    expect(buildBrowserEvent("demo_open", { ctaId: "request-product-demo", intent: "demo", productId: "vedik" }))
      .toEqual({ event: "demo_open", ctaId: "request-product-demo", intent: "demo", productId: "vedik" });
  });

  it("rejects arbitrary event names, identifiers and incomplete milestones", () => {
    expect(buildBrowserEvent("page_view", { ctaId: "request-demo" })).toBeNull();
    expect(buildBrowserEvent("cta_click", { ctaId: "private-person" })).toBeNull();
    expect(buildBrowserEvent("demo_open", { ctaId: "request-demo", intent: "consultation" })).toBeNull();
    expect(buildBrowserEvent("resource_export", { resourceId: "person@example.com" })).toBeNull();
    expect(buildBrowserEvent("lead_submit", { ctaId: "request-demo" })).toBeNull();
  });

  it("keeps lead milestones free of form values and resource exports free of URLs", () => {
    expect(buildBrowserEvent("lead_start", {
      intent: "migration",
      productId: "unify",
      email: "private@example.com",
      message: "Private message",
    })).toEqual({ event: "lead_start", intent: "migration", productId: "unify" });
    expect(buildBrowserEvent("resource_export", { resourceId: "sourcecraft-favourites", page: "/private/" }))
      .toEqual({ event: "resource_export", resourceId: "sourcecraft-favourites" });
  });
});
