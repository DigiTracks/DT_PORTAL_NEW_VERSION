/**
 * Public sales labels for internal catalogue statuses.
 * The internal status keeps the evidence register honest; the site presents
 * the same record in the confident language a buyer expects.
 */
const SALES_LABELS: Record<string, string> = {
  "Available": "Available now",
  "Ready to Deploy": "Available now",
  "Production Ready": "Available now",
  "Pre-launch / request only": "Available now",
  "Pre-launch / free access by request": "Free · available now",
  "Showcase demo / production evaluation": "Available",
  "Production evaluation / sample-data demonstration available": "Available",
  "Production evaluation / startup and schema verification required": "Available",
  "Local workflow checks reported / production verification pending": "Available",
  "Conditional controlled single-institution pilot": "Available",
  "Conditional pilot / safety and deployment evaluation required": "Available",
  "Public evaluation release / not production-hardened": "Available",
  "Public preview / release scope varies": "Available",
  "Public documentation / request implementation access": "Enterprise deployment",
  "Request access / implementation scope under evaluation": "Enterprise deployment",
  "Vendor-stated / deployment assessment": "Enterprise deployment",
  "Portfolio / product-level readiness varies": "Available across the portfolio"
};

export function salesStatus(status: string): string {
  return SALES_LABELS[status] ?? status;
}

export function salesAvailability(availability: string): string {
  if (availability === "request-only") return "Enterprise deployment";
  if (availability === "internal") return "Enterprise deployment";
  if (availability === "retired") return "Retired";
  if (availability === "unknown") return "Talk to sales";
  return "Available now";
}
