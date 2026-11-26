import {
  ANALYTICS_CTA_IDS,
  ANALYTICS_INTENTS,
  ANALYTICS_RESOURCE_IDS,
  BROWSER_ANALYTICS_EVENTS,
  type BrowserAnalyticsEvent,
} from "@digitracks/catalog/analytics";
import { trackBrowserEvent } from "./analytics";
import { ANALYTICS_BODY_CAP_BYTES, readConfig } from "./config";
import { isKnownProductId } from "./contracts";
import {
  HttpError,
  clientRateKey,
  corsHeaders,
  exactOrigin,
  jsonResponse,
  readJsonBody,
  securityHeaders,
} from "./http";
import { IsolateRateLimiter } from "./rate-limit";
import type { Env, WorkerDependencies } from "./types";

const isolateRateLimiter = new IsolateRateLimiter();
const allowedEvents = new Set<string>(BROWSER_ANALYTICS_EVENTS);
const allowedCtaIds = new Set<string>(ANALYTICS_CTA_IDS);
const allowedResourceIds = new Set<string>(ANALYTICS_RESOURCE_IDS);
const allowedIntents = new Set<string>(ANALYTICS_INTENTS);
const allowedFields = new Set(["event", "intent", "productId", "ctaId", "resourceId"]);

export interface BrowserEventInput {
  event: BrowserAnalyticsEvent;
  intent: string | null;
  productId: string | null;
  ctaId: string | null;
  resourceId: string | null;
}

interface BrowserEventValidation {
  ok: boolean;
  value?: BrowserEventInput;
  fields: string[];
}

function optionalAllowed(value: unknown, allowed: ReadonlySet<string>): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && allowed.has(value) ? value : undefined;
}

function optionalProduct(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value) && isKnownProductId(value)
    ? value
    : undefined;
}

export function validateBrowserEventPayload(payload: unknown): BrowserEventValidation {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { ok: false, fields: ["body"] };
  const input = payload as Record<string, unknown>;
  const fields = new Set<string>();
  if (Object.keys(input).some((key) => !allowedFields.has(key))) fields.add("unknown_fields");

  const event = input.event;
  if (typeof event !== "string" || !allowedEvents.has(event)) fields.add("event");
  const intent = optionalAllowed(input.intent, allowedIntents);
  const productId = optionalProduct(input.productId);
  const ctaId = optionalAllowed(input.ctaId, allowedCtaIds);
  const resourceId = optionalAllowed(input.resourceId, allowedResourceIds);
  if (intent === undefined) fields.add("intent");
  if (productId === undefined) fields.add("productId");
  if (ctaId === undefined) fields.add("ctaId");
  if (resourceId === undefined) fields.add("resourceId");

  if (event === "cta_click" && ctaId === null) fields.add("ctaId");
  if (event === "demo_open" && (ctaId === null || intent !== "demo")) fields.add("demo_context");
  if (event === "resource_export" && resourceId === null) fields.add("resourceId");
  if ((event === "lead_start" || event === "lead_submit") && (ctaId !== null || resourceId !== null)) {
    fields.add("lead_context");
  }

  if (fields.size > 0 || intent === undefined || productId === undefined || ctaId === undefined || resourceId === undefined) {
    return { ok: false, fields: [...fields].sort() };
  }

  return {
    ok: true,
    fields: [],
    value: {
      event: event as BrowserAnalyticsEvent,
      intent,
      productId,
      ctaId,
      resourceId,
    },
  };
}

export async function submitBrowserEvent(
  request: Request,
  env: Env,
  dependencies: WorkerDependencies = {},
): Promise<Response> {
  const config = readConfig(env);
  if (request.method === "OPTIONS") {
    const origin = exactOrigin(request, config.allowedOrigins);
    return new Response(null, { status: 204, headers: { ...securityHeaders(), ...corsHeaders(origin) } });
  }
  if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "Only POST is supported.");

  const origin = exactOrigin(request, config.allowedOrigins);
  const decision = (dependencies.rateLimiter ?? isolateRateLimiter).check({
    key: `analytics:${origin}:${clientRateKey(request)}`,
    limit: Math.max(60, config.rateLimitPerMinute),
    windowSeconds: config.rateLimitWindowSeconds,
    now: dependencies.now?.() ?? Date.now(),
  });
  if (!decision.allowed) {
    throw new HttpError(429, "rate_limited", "Too many requests.", { "Retry-After": String(decision.retryAfterSeconds) });
  }

  const payload = await readJsonBody(request, ANALYTICS_BODY_CAP_BYTES);
  const validation = validateBrowserEventPayload(payload);
  if (!validation.ok || !validation.value) {
    return jsonResponse({ error: { code: "invalid_payload", fields: validation.fields } }, 400, origin);
  }

  await trackBrowserEvent(env.ANALYTICS, validation.value.event, {
    intent: validation.value.intent ?? undefined,
    productId: validation.value.productId,
    ctaId: validation.value.ctaId ?? undefined,
    resourceId: validation.value.resourceId ?? undefined,
  });
  return new Response(null, { status: 204, headers: { ...securityHeaders(), ...corsHeaders(origin) } });
}
