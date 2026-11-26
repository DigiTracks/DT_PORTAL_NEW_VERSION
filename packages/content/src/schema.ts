import { auditedClaims } from "./claims.generated.ts";
import { governedContent } from "./content.generated.ts";

export type EditorialStatus = "approved" | "in_review" | "blocked" | "retired";
export type RightsStatus = "owned" | "licensed" | "permission-required" | "unknown";

export interface ContentProvenance {
  source: string;
  sourceHash?: string;
  owner?: string;
  licence?: string;
  permissionReference?: string;
}

export interface ContentRecord {
  id: string;
  title: string;
  body: string;
  editorialStatus: EditorialStatus;
  rightsStatus: RightsStatus;
  provenance: ContentProvenance;
  reviewedAt?: string;
  substantiveUpdatedAt?: string;
  releaseApplicability?: string;
  claimIds: readonly string[];
}

export interface ClaimRecord {
  id: string;
  statement: string;
  status: "verified" | "site-stated" | "unknown" | "contradicted" | "retired";
  source: string;
  verifiedAt?: string;
  owner?: string;
}

export const contentRegistry = governedContent as readonly ContentRecord[];
export const claimRegistry = auditedClaims as readonly ClaimRecord[];

export function validateContentRecord(record: ContentRecord): string[] {
  const errors: string[] = [];
  if (!record.id.trim()) errors.push("Content record has an empty id");
  if (!record.title.trim()) errors.push(`Content ${record.id} has an empty title`);
  if (!record.body.trim()) errors.push(`Content ${record.id} has an empty body`);
  if (!record.provenance.source.trim()) errors.push(`Content ${record.id} has no provenance source`);
  if (record.rightsStatus === "permission-required" && record.editorialStatus === "approved") {
    errors.push(`Content ${record.id} cannot be approved while permission is required`);
  }
  if (record.editorialStatus === "approved" && !record.reviewedAt) {
    errors.push(`Approved content ${record.id} requires a reviewed date`);
  }
  return errors;
}

export function validateClaimRegistry(claims: readonly ClaimRecord[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const claim of claims) {
    if (seen.has(claim.id)) errors.push(`Duplicate claim id: ${claim.id}`);
    seen.add(claim.id);
    if (!claim.statement.trim()) errors.push(`Claim ${claim.id} has an empty statement`);
    if (!claim.source.trim()) errors.push(`Claim ${claim.id} has no source`);
    if (claim.status === "verified" && (!claim.verifiedAt || !claim.owner)) {
      errors.push(`Verified claim ${claim.id} requires a verification date and owner`);
    }
  }
  return errors;
}
