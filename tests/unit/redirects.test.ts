import { describe, expect, it } from "vitest";
import { routeRegistry, validateRouteRegistry } from "../../packages/seo/src/index.ts";
import { validateRedirects, type RedirectRule } from "../../packages/seo/src/redirects.ts";

const rule = (overrides: Partial<RedirectRule> = {}): RedirectRule => ({
  origin: "portal",
  from: "/products",
  to: "https://digitracks.net/products/",
  permanent: true,
  ...overrides
});

describe("redirect policy", () => {
  it("accepts a trailing-slash canonical redirect", () => {
    expect(validateRedirects([rule()])).toEqual([]);
  });

  it("allows the same path on separate origins", () => {
    expect(validateRedirects([
      rule(),
      rule({ origin: "learn", to: "https://learn.digitracks.net/products/" })
    ])).toEqual([]);
  });

  it("rejects duplicate sources, temporary rules, loops and chains", () => {
    const errors = validateRedirects([
      rule(),
      rule(),
      rule({ from: "/temporary", to: "https://digitracks.net/products/", permanent: false }),
      rule({ from: "/loop", to: "https://digitracks.net/loop" }),
      rule({ from: "/old", to: "https://digitracks.net/products" })
    ]);

    expect(errors).toContain("Duplicate redirect source: portal:/products");
    expect(errors).toContain("Redirect must be permanent: portal:/temporary");
    expect(errors).toContain("Redirect loops to itself: portal:/loop");
    expect(errors).toContain("Redirect chain detected at: portal:/old");
  });

  it("rejects relative, cross-origin and non-HTTPS targets", () => {
    const errors = validateRedirects([
      rule({ from: "/relative", to: "/products/" }),
      rule({ from: "/cross-origin", to: "https://learn.digitracks.net/" }),
      rule({ from: "/insecure", to: "http://digitracks.net/products/" })
    ]);

    expect(errors).toContain("Redirect target is not absolute HTTPS: portal:/relative");
    expect(errors).toContain("Redirect target must stay on its origin: portal:/cross-origin");
    expect(errors).toContain("Redirect target must use HTTPS: portal:/insecure");
  });
});

describe("generated route registry", () => {
  it("contains a valid registry and one-hop permanent redirects", () => {
    expect(validateRouteRegistry(routeRegistry)).toEqual([]);
    const redirects = routeRegistry
      .filter((route) => route.redirectTo && !route.hashRoute)
      .map((route) => ({
        origin: route.origin,
        from: route.path,
        to: route.redirectTo!,
        permanent: true
      }));

    expect(redirects.length).toBeGreaterThan(0);
    expect(validateRedirects(redirects)).toEqual([]);
  });
});
