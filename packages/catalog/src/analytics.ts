export const BROWSER_ANALYTICS_EVENTS = [
  "cta_click",
  "demo_open",
  "resource_export",
  "lead_start",
  "lead_submit",
] as const;

export type BrowserAnalyticsEvent = (typeof BROWSER_ANALYTICS_EVENTS)[number];

export const ANALYTICS_CTA_IDS = [
  "request-demo",
  "request-product-demo",
  "request-product-interest",
  "explore-mindone",
  "request-quote",
  "request-conversation",
  "request-product-consultation",
  "request-product-guidance",
  "browse-product-catalogue",
  "inspect-product",
  "request-authorised-access",
  "explore-hcm-evidence",
  "search-sourcecraft",
  "explore-learning-paths",
  "read-pmo-guide",
  "request-learning-access",
  "request-mindone-access",
  "compare-mindone-editions",
  "explore-procurement",
  "request-procurement-demo",
  "request-security-pack",
  "open-live-platform",
  "all-platforms",
  "learning-contact",
  "explore-products",
  "request-vedik-demo",
  "inspect-vedik-products",
  "inspect-campus-grid",
] as const;

export const ANALYTICS_RESOURCE_IDS = [
  "sourcecraft-favourites",
  "procuresherpa-notes",
] as const;

export const ANALYTICS_INTENTS = [
  "product-enquiry",
  "demo",
  "consultation",
  "migration",
  "support",
  "partnership",
  "learning",
  "security",
] as const;
