import { describe, expect, it } from "vitest";
import { socialCardPath, socialCardUrl } from "../../packages/seo/src/social.ts";

const portal = "https://digitracks.net";

describe("social cards", () => {
  it("uses stable safe paths derived from canonical routes", () => {
    const first = socialCardPath(portal, "/products/mindone/");
    expect(first).toMatch(/^\/social\/products-mindone-[a-f0-9]{16}\.png$/);
    expect(socialCardPath(portal, "/products/mindone/")).toBe(first);
    expect(socialCardPath(portal, "/products/mindone")).toBe(first);
    expect(socialCardUrl(portal, "/products/mindone/")).toBe(`${portal}${first}`);
  });

  it("keeps origins distinct and follows the origin slash policy", () => {
    expect(socialCardPath(portal, "/")).not.toBe(socialCardPath("https://learn.digitracks.net", "/"));
    expect(socialCardPath("https://procuresherpa.digitracks.net", "/academy/"))
      .toBe(socialCardPath("https://procuresherpa.digitracks.net", "/academy"));
  });

  it("sanitizes display slugs while hashing the exact canonical URL", () => {
    const path = socialCardPath(portal, "/products/cr%C3%A8me-br%C3%BBl%C3%A9e/");
    expect(path).toMatch(/^\/social\/products-creme-brulee-[a-f0-9]{16}\.png$/);
    expect(path).not.toBe(socialCardPath(portal, "/products/creme-brulee/"));
  });

  it.each([
    [portal, "/products/?ref=share"],
    [portal, "/products/#section"],
    [portal, "//example.com/path"],
    [portal, "/products/<script>"],
    ["http://digitracks.net", "/"],
    ["https://example.com", "/"],
    ["https://digitracks.net.evil.example", "/"],
    ["https://user:pass@digitracks.net", "/"]
  ])("rejects non-canonical or unapproved input", (origin, routePath) => {
    expect(() => socialCardPath(origin, routePath)).toThrow();
  });
});
