import { describe, expect, it } from "vitest";
import { isDemoProduct, productRegistry, toPublicProducts, validateProductRegistry } from "../../packages/catalog/src/index.ts";
import { auditedClaims } from "../../packages/content/src/claims.generated.ts";

const internalFields = [
  "requestable",
  "licenseEvidence",
  "claims",
  "assetIds",
  "learningPathId",
  "evidenceStatus",
  "industryIds"
] as const;

describe("public catalogue boundary", () => {
  it("keeps the complete catalogue while removing internal evidence fields", () => {
    const products = toPublicProducts(productRegistry);
    expect(products).toHaveLength(37);
    expect(products.filter((product) => !product.parentId)).toHaveLength(17);
    expect(products.filter((product) => product.parentId)).toHaveLength(20);
    expect(validateProductRegistry(productRegistry)).toEqual([]);

    for (const product of products) {
      for (const field of internalFields) expect(product).not.toHaveProperty(field);
      expect(product.name).toBe(productRegistry.find((record) => record.id === product.id)?.name);
      expect(product.audience.trim()).not.toBe("");
    }
  });

  it("limits demo intent to requestable products that are available", () => {
    const unify = productRegistry.find((product) => product.id === "unify")!;
    const mindone = productRegistry.find((product) => product.id === "mindone")!;
    expect(isDemoProduct(unify)).toBe(true);
    expect(isDemoProduct(mindone)).toBe(false);
    expect(isDemoProduct({ availability: "available", requestable: false })).toBe(false);
    expect(isDemoProduct({ availability: "unknown", requestable: true })).toBe(false);
  });

  it("keeps OpsPilot package licensing separate from unconfirmed desktop licensing", () => {
    const opspilot = toPublicProducts(productRegistry).find((product) => product.id === "opspilot");
    expect(opspilot?.licenseModel).toBe("unknown");
    expect(opspilot?.licenceNote).toContain("@ops_pilot/cli");
    expect(opspilot?.licenceNote).toContain("Apache-2.0");
    expect(opspilot?.licenceNote).toContain("desktop components remains unconfirmed");
    expect(opspilot?.description).not.toContain("independent Apache-2.0 project-operations CLI and desktop tool");
  });

  it("classifies Recon as proprietary and publishes current catalogue counts", () => {
    const products = toPublicProducts(productRegistry);
    expect(products.find((product) => product.id === "recon")?.licenseModel).toBe("proprietary");
    expect(auditedClaims.find((claim) => claim.id === "CLM-002")?.statement)
      .toBe("The replacement catalogue contains 37 entries: 17 top-level products and 20 products nested within families.");
  });

  it("does not serialize private research provenance into public records or claims", () => {
    const publicPayload = JSON.stringify(toPublicProducts(productRegistry));
    const claimsPayload = JSON.stringify(auditedClaims);
    for (const payload of [publicPayload, claimsPayload]) {
      expect(payload).not.toMatch(/authorized read-only|private implementation review|repository review/iu);
      expect(payload).not.toContain("chandrahotha");
      expect(payload).not.toContain("github.com");
      expect(payload).not.toContain("/data/HomeWorks/");
    }
    for (const claim of auditedClaims) expect(claim.source).toMatch(/^inventories\/claims\.json#CLM-\d+$/);
  });
});
