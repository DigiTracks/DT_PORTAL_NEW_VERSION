import {
  ANALYTICS_CTA_IDS,
  ANALYTICS_INTENTS,
  ANALYTICS_RESOURCE_IDS,
  type BrowserAnalyticsEvent,
} from "@digitracks/catalog/analytics";
import type { AnalyticsEngineDataset, Env } from "./types";

const browserIntents = new Set<string>(ANALYTICS_INTENTS);
const browserCtaIds = new Set<string>(ANALYTICS_CTA_IDS);
const browserResourceIds = new Set<string>(ANALYTICS_RESOURCE_IDS);

export type AnalyticsEvent =
  | "lead_received"
  | "lead_delivery_email"
  | "lead_delivery_webhook"
  | "lead_delivery_failed"
  | "demo_access_issued"
  | "demo_access_revoked"
  | BrowserAnalyticsEvent;

export interface AnalyticsContext {
  intent?: string;
  productId?: string | null;
  correlationId?: string;
  destination?: "email" | "webhook";
  errorCategory?: string;
  reasonCategory?: string;
}

async function correlationHash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Analytics dimensions are identifiers/categories, never arbitrary request text. */
function safeDimension(value: string | null | undefined): string {
  return value && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(value) ? value : "none";
}

export async function trackEvent(dataset: AnalyticsEngineDataset | undefined, event: AnalyticsEvent, context: AnalyticsContext = {}): Promise<void> {
  if (!dataset) return;
  try {
    const correlation = context.correlationId ? await correlationHash(context.correlationId) : "none";
    dataset.writeDataPoint({
      indexes: [event],
      blobs: [
        safeDimension(context.intent),
        safeDimension(context.productId),
        correlation,
        safeDimension(context.destination),
        safeDimension(context.errorCategory),
        safeDimension(context.reasonCategory),
      ],
      doubles: [1],
    });
  } catch {
    // Analytics must never change durable lead or delivery outcomes.
  }
}

export interface BrowserAnalyticsContext {
  intent?: string;
  productId?: string | null;
  ctaId?: string;
  resourceId?: string;
}

function allowedBrowserDimension(value: string | undefined, allowed: ReadonlySet<string>): string {
  return value && allowed.has(value) ? value : "none";
}

export async function trackBrowserEvent(
  dataset: AnalyticsEngineDataset | undefined,
  event: BrowserAnalyticsEvent,
  context: BrowserAnalyticsContext = {},
): Promise<void> {
  if (!dataset) return;
  try {
    dataset.writeDataPoint({
      indexes: [event],
      blobs: [
        allowedBrowserDimension(context.intent, browserIntents),
        safeDimension(context.productId),
        "none",
        "none",
        allowedBrowserDimension(context.ctaId, browserCtaIds),
        allowedBrowserDimension(context.resourceId, browserResourceIds),
      ],
      doubles: [1],
    });
  } catch {
    // Browser telemetry must never affect navigation or enquiry delivery.
  }
}

export async function trackFromEnv(env: Env, event: AnalyticsEvent, context: AnalyticsContext = {}): Promise<void> {
  await trackEvent(env.ANALYTICS as AnalyticsEngineDataset | undefined, event, context);
}
