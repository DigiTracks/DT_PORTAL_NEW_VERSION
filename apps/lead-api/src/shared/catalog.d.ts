// Typecheck-only mirror of the shared catalog contract used by this Worker.
export interface ProductRecord {
  id: string;
  availability: "available" | "request-only" | "internal" | "retired" | "unknown";
  requestable: boolean;
}

export const productRegistry: readonly ProductRecord[];
export function isDemoProduct(product: Pick<ProductRecord, "availability" | "requestable">): boolean;
