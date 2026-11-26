export type AssetKind = "logo" | "product-logo" | "screenshot" | "photograph" | "diagram" | "social-card" | "font" | "icon" | "document";
export type AssetApproval = "approved" | "pending" | "rejected";

export interface AssetRecord {
  id: string;
  path: string;
  sha256: string;
  kind: AssetKind;
  owner: string;
  licence: string;
  sourceProject: string;
  approval: AssetApproval;
  approvedAt?: string;
  permittedUse: string;
}

import { generatedAssetRegistry } from "./assets.generated.ts";
import { sourceAssetRegistry } from "./source-assets.generated.ts";

export { generatedAssetRegistry } from "./assets.generated.ts";
export { sourceAssetRegistry } from "./source-assets.generated.ts";
export const assetRegistry: readonly AssetRecord[] = [...sourceAssetRegistry, ...generatedAssetRegistry];

export function validateAssetRegistry(assets: readonly AssetRecord[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const asset of assets) {
    if (seen.has(asset.id)) errors.push(`Duplicate asset id: ${asset.id}`);
    seen.add(asset.id);
    if (!/^[a-f0-9]{64}$/i.test(asset.sha256)) errors.push(`Asset ${asset.id} has an invalid SHA-256`);
    if (!asset.path.startsWith("/")) errors.push(`Asset ${asset.id} path must start with /`);
    if (!asset.owner.trim() || !asset.licence.trim()) errors.push(`Asset ${asset.id} has incomplete provenance`);
    if (asset.approval === "approved" && !asset.approvedAt) errors.push(`Approved asset ${asset.id} has no approval date`);
  }
  return errors;
}
