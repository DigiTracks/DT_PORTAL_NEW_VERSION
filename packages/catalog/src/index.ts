import type { BuyingModel, LicenseModel } from "./products.ts";

export * from "./analytics.ts";
export { hubRegistry, isFreeProduct, isOpenSourceProduct, productRegistry, solutionRegistry, validateProductRegistry } from "./products.ts";
export type { Availability, BuyingModel, ClaimReference, ClaimStatus, EvidenceStatus, HubRecord, LicenseModel, ProductRecord, SolutionRecord } from "./products.ts";
