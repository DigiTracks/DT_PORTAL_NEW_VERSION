export type LicenseModel = "proprietary" | "open-source" | "source-available" | "unknown";
export type BuyingModel = "free" | "quote-led" | "subscription" | "one-off" | "unknown";
export type Availability = "available" | "request-only" | "internal" | "retired" | "unknown";
export type ClaimStatus = "verified" | "site-stated" | "unknown" | "retired";
export type EvidenceStatus = "code-backed" | "observable-demo" | "vendor-stated" | "mixed" | "unknown";

export interface ClaimReference {
  id: string;
  status: ClaimStatus;
}

export interface ProductRecord {
  id: string;
  name: string;
  summary: string;
  description: string;
  audience: string;
  category: string;
  licenseModel: LicenseModel;
  buyingModel: BuyingModel;
  availability: Availability;
  requestable: boolean;
  licenseEvidence?: string;
  capabilities: readonly string[];
  platforms: readonly string[];
  deployment: string;
  status: string;
  route: string;
  logo?: string;
  installCommand?: string;
  licenceNote?: string;
  claims: readonly ClaimReference[];
  assetIds: readonly string[];
  learningPathId?: string;
  parentId?: string;
  edition?: string;
  evidenceStatus?: EvidenceStatus;
  evidenceNote?: string;
  industryIds?: readonly string[];
}

export interface PublicProductRecord {
  id: string;
  name: string;
  summary: string;
  description: string;
  audience: string;
  category: string;
  licenseModel: LicenseModel;
  buyingModel: BuyingModel;
  availability: Availability;
  capabilities: readonly string[];
  platforms: readonly string[];
  deployment: string;
  status: string;
  route: string;
  logo?: string;
  installCommand?: string;
  licenceNote?: string;
  parentId?: string;
  edition?: string;
  evidenceNote?: string;
}

export interface SolutionRecord {
  id: string;
  name: string;
  summary: string;
  audience: string;
  challenge: string;
  workflow: readonly { title: string; description: string }[];
  outcomes: readonly string[];
  productIds: readonly string[];
  industryIds: readonly string[];
  claims: readonly ClaimReference[];
}

export interface HubRecord {
  id: string;
  name: string;
  summary: string;
  toolIds: readonly string[];
}

import { catalogData } from "./catalog.generated.ts";
import { salesStatus } from "./sales-status.ts";

const pipelineOnlyIds = new Set(["costpilot", "vendoriq", "talentmap", "complyflow"]);

export const productRegistry = catalogData.products as readonly ProductRecord[];
export const solutionRegistry = catalogData.solutions as readonly SolutionRecord[];
export const hubRegistry = catalogData.hubs as readonly HubRecord[];

export function toPublicProduct(product: ProductRecord): PublicProductRecord {
  return {
    id: product.id,
    name: product.name,
    summary: product.summary,
    description: product.description,
    audience: product.audience,
    category: product.category,
    licenseModel: product.licenseModel,
    buyingModel: product.buyingModel,
    availability: product.availability,
    capabilities: product.capabilities,
    platforms: product.platforms,
    deployment: product.deployment,
    status: salesStatus(product.status),
    route: product.route,
    logo: product.logo,
    installCommand: product.installCommand,
    licenceNote: product.licenceNote,
    parentId: product.parentId,
    edition: product.edition,
    evidenceNote: product.evidenceNote
  };
}

export function toPublicProducts(products: readonly ProductRecord[]): readonly PublicProductRecord[] {
  return products.map(toPublicProduct);
}

export function isDemoProduct(product: Pick<ProductRecord, "availability" | "requestable">): boolean {
  return product.requestable && product.availability === "available";
}

export function validateProductRegistry(products: readonly ProductRecord[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    const id = product.id.trim().toLowerCase();
    if (seen.has(id)) errors.push(`Duplicate product id: ${product.id}`);
    seen.add(id);
    if (pipelineOnlyIds.has(id)) errors.push(`Pipeline-only product cannot be public: ${product.id}`);
    if (!product.name.trim()) errors.push(`Product ${product.id} has an empty name`);
    if (!product.summary.trim()) errors.push(`Product ${product.id} has an empty summary`);
    if (!product.audience.trim()) errors.push(`Product ${product.id} has an empty audience`);
    if (product.licenseModel === "open-source" && !product.licenseEvidence) {
      errors.push(`Open-source product ${product.id} requires licence evidence`);
    }
    if (product.licenseModel === "unknown" && !product.licenceNote?.trim()) {
      errors.push(`Product ${product.id} requires a licence boundary note while its licence is unknown`);
    }
  }

  return errors;
}

export function isOpenSourceProduct(product: ProductRecord): boolean {
  return product.licenseModel === "open-source";
}

export function isFreeProduct(product: ProductRecord): boolean {
  return product.buyingModel === "free";
}
