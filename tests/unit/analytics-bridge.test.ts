import { describe, expect, it } from "vitest";
import { buildBrowserEvent, isLoopbackHostname, resolveLeadEndpoint } from "../../packages/ui/src/lib/analytics";

describe("privacy-safe browser event payloads", () => {
  it("builds only fixed, allowlisted CTA and demo context", () => {
    expect(buildBrowserEvent("cta_click", {
      ctaId: "request-product-demo",
      intent: "demo",
      productId: "unify",
      page: "https://digitracks.net/contact/?email=private@example.com",
      name: "Private Person",
    })).toEqual({ event: "cta_click", ctaId: "request-product-demo", intent: "demo", productId: "unify" });
    expect(buildBrowserEvent("demo_open", { ctaId: "request-product-demo", intent: "demo", productId: "unify" }))
      .toEqual({ event: "demo_open", ctaId: "request-product-demo", intent: "demo", productId: "unify" });
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

describe("local-first delivery endpoints", () => {
  it("recognizes the complete loopback range without accepting lookalike hosts", () => {
    for (const hostname of ["localhost", "LOCALHOST.", "127.0.0.1", "127.0.0.2", "127.255.255.255", "::1", "[::1]", "::ffff:127.0.0.1", "[::ffff:7f00:1]", "0:0:0:0:0:ffff:127.255.255.255"]) {
      expect(isLoopbackHostname(hostname), hostname).toBe(true);
    }
    for (const hostname of ["127.0.0.256", "127.0.0.1.evil.example", "example.localhost", "192.168.1.20", "2130706433", "[::2]", "[::ffff:128.0.0.1]", "[::ffff:192.168.1.1]"]) {
      expect(isLoopbackHostname(hostname), hostname).toBe(false);
    }
  });

  it("allows only loopback delivery from every loopback page alias", () => {
    expect(resolveLeadEndpoint("http://127.0.0.1:4331/api/lead", "127.0.0.1"))
      .toBe("http://127.0.0.1:4331/api/lead");
    expect(resolveLeadEndpoint("http://localhost:8788/api/lead", "localhost"))
      .toBe("http://localhost:8788/api/lead");
    expect(resolveLeadEndpoint("https://digitracks.net/api/lead", "127.0.0.1")).toBeUndefined();
    expect(resolveLeadEndpoint("http://192.168.1.20/api/lead", "127.0.0.1")).toBeUndefined();
    expect(resolveLeadEndpoint("http://127.0.0.2:4331/api/lead", "127.0.0.2"))
      .toBe("http://127.0.0.2:4331/api/lead");
    expect(resolveLeadEndpoint("https://digitracks.net/api/lead", "127.0.0.2")).toBeUndefined();
    expect(resolveLeadEndpoint("http://[::ffff:127.0.0.1]:4331/api/lead", "[::ffff:7f00:1]"))
      .toBe(new URL("http://[::ffff:127.0.0.1]:4331/api/lead").toString());
    expect(resolveLeadEndpoint("https://digitracks.net/api/lead", "[::ffff:7f00:1]")).toBeUndefined();
    expect(resolveLeadEndpoint("http://[::ffff:192.168.1.1]:4331/api/lead", "127.0.0.1")).toBeUndefined();
  });

  it("allows only HTTPS delivery from published pages", () => {
    expect(resolveLeadEndpoint("https://digitracks.net/api/lead", "digitracks.net"))
      .toBe("https://digitracks.net/api/lead");
    expect(resolveLeadEndpoint("http://127.0.0.1:4331/api/lead", "digitracks.net")).toBeUndefined();
    expect(resolveLeadEndpoint("http://digitracks.net/api/lead", "digitracks.net")).toBeUndefined();
  });

  it("rejects malformed, credentialed and non-HTTP endpoints", () => {
    expect(resolveLeadEndpoint("not a URL", "127.0.0.1")).toBeUndefined();
    expect(resolveLeadEndpoint("https://user:pass@example.com/api/lead", "example.com")).toBeUndefined();
    expect(resolveLeadEndpoint("ftp://127.0.0.1/api/lead", "127.0.0.1")).toBeUndefined();
    expect(resolveLeadEndpoint(undefined, "127.0.0.1")).toBeUndefined();
  });
});
