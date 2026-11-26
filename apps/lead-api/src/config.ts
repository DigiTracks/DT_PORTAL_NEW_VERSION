import { origins } from "@digitracks/seo";
import type { Env } from "./types";

export const PRODUCTION_ORIGINS = Object.freeze(origins.map((entry) => entry.origin));
export const LEAD_BODY_CAP_BYTES = 20_000;
export const ANALYTICS_BODY_CAP_BYTES = 2_000;
export const WEBHOOK_EVENT_VERSION = "1";
export const ADMIN_TOKEN_MIN_LENGTH = 32;
export const SIGNING_SECRET_MIN_LENGTH = 32;

export const WEBHOOK_SOURCE_FIELDS = [
  "receivedAt",
  "intent",
  "name",
  "email",
  "organization",
  "productId",
  "sourceOrigin",
  "pagePath",
  "message",
  "locale",
] as const;

export type WebhookSourceField = (typeof WEBHOOK_SOURCE_FIELDS)[number];
export type WebhookFieldMapping = Partial<Record<WebhookSourceField, string>>;

export interface EmailConfig {
  configured: boolean;
  apiKey?: string;
  from?: string;
  recipients: readonly string[];
  replyTo?: string;
  timeoutMs: number;
  maxAttempts: number;
}

export interface WebhookConfig {
  configured: boolean;
  url?: string;
  secret?: string;
  previousSecret?: string;
  mapping: WebhookFieldMapping;
  timeoutMs: number;
  replayWindowSeconds: number;
  maxAttempts: number;
}

export interface DemoConfig {
  configured: boolean;
  adminToken?: string;
  signingSecret?: string;
  previousSigningSecret?: string;
  destinations: ReadonlyMap<string, string>;
  ttlHours: number;
}

export interface RuntimeConfig {
  allowedOrigins: ReadonlySet<string>;
  localOrigins: readonly string[];
  rateLimitPerMinute: number;
  rateLimitWindowSeconds: number;
  turnstile:
    | { state: "configured"; secret: string; siteKey: string; expectedAction: string; expectedHostnames: readonly string[] }
    | { state: "unconfigured" | "incoherent" };
  email: EmailConfig;
  webhook: WebhookConfig;
  demo: DemoConfig;
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function csv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

export function isEmail(value: string): boolean {
  if (value.length > 254 || !/^[\x21-\x7e]+$/.test(value)) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
  if (domain.length > 253 || !domain.includes(".")) return false;
  return domain.split(".").every(
    (label) =>
      label.length >= 1 &&
      label.length <= 63 &&
      /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
  );
}

function isFromAddress(value: string): boolean {
  // Resend accepts either a bare mailbox or a single display-name form.
  const bare = value.match(/^(?:[^<>\r\n]{1,100}\s*)?<([^<>]+)>$/)?.[1] ?? value;
  return isEmail(bare);
}

function parseLocalOrigins(value: string | undefined): string[] {
  const accepted: string[] = [];
  for (const candidate of csv(value)) {
    try {
      const url = new URL(candidate);
      const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
      if (
        localHost &&
        (url.protocol === "http:" || url.protocol === "https:") &&
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash
      ) {
        const origin = url.origin;
        if (!accepted.includes(origin)) accepted.push(origin);
      }
    } catch {
      // Invalid local configuration is ignored, never widened into an allowlist.
    }
  }
  return accepted;
}

function validHttpsUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.hash) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function validProductId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

function parseMapping(value: string | undefined): WebhookFieldMapping {
  if (!value || value.length > 8_192) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const mapping: WebhookFieldMapping = {};
    const destinations = new Set<string>();
    for (const [source, destination] of Object.entries(parsed)) {
      if (
        !(WEBHOOK_SOURCE_FIELDS as readonly string[]).includes(source) ||
        typeof destination !== "string" ||
        !/^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/.test(destination) ||
        ["__proto__", "prototype", "constructor", "delivery_id", "event_version", "received_at"].includes(destination) ||
        destinations.has(destination)
      ) {
        return {};
      }
      destinations.add(destination);
      mapping[source as WebhookSourceField] = destination;
    }
    return mapping;
  } catch {
    return {};
  }
}

function parseDestinations(value: string | undefined): ReadonlyMap<string, string> {
  const destinations = new Map<string, string>();
  if (!value || value.length > 8_192) return destinations;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return destinations;
    for (const [productId, destination] of Object.entries(parsed)) {
      const url = typeof destination === "string" ? validHttpsUrl(destination) : undefined;
      if (!validProductId(productId) || !url) return new Map<string, string>();
      destinations.set(productId, url);
    }
    return destinations;
  } catch {
    return new Map<string, string>();
  }
}

export function readConfig(env: Env): RuntimeConfig {
  const localOrigins = parseLocalOrigins(env.ALLOWED_LOCAL_ORIGINS);
  const allowedOrigins = new Set([...PRODUCTION_ORIGINS, ...localOrigins]);

  const turnstileSecret = nonEmpty(env.TURNSTILE_SECRET);
  const turnstileSiteKey = nonEmpty(env.TURNSTILE_SITE_KEY);
  const allowedHostnames = new Set([...allowedOrigins].map((origin) => new URL(origin).hostname.toLowerCase()));
  const configuredHostnames = csv(env.TURNSTILE_EXPECTED_HOSTNAMES).map((host) => host.toLowerCase());
  // An absent allowlist is bound to this estate, never to every Turnstile hostname.
  const expectedHostnames = configuredHostnames.length > 0 ? configuredHostnames : [...allowedHostnames];
  const hostnamesCoherent =
    expectedHostnames.length > 0 &&
    expectedHostnames.every(
      (host) => /^[a-z0-9.-]{1,253}$/.test(host) && allowedHostnames.has(host),
    );
  const turnstile: RuntimeConfig["turnstile"] =
    turnstileSecret && turnstileSiteKey
      ? hostnamesCoherent
        ? {
            state: "configured",
            secret: turnstileSecret,
            siteKey: turnstileSiteKey,
            expectedAction: nonEmpty(env.TURNSTILE_EXPECTED_ACTION) ?? "lead",
            expectedHostnames,
          }
        : { state: "incoherent" }
      : turnstileSecret || turnstileSiteKey
        ? { state: "incoherent" }
        : { state: "unconfigured" };

  const recipients = csv(env.LEAD_NOTIFICATION_TO);
  const from = nonEmpty(env.RESEND_FROM_EMAIL);
  const replyTo = nonEmpty(env.LEAD_REPLY_TO_EMAIL);
  const resendKey = nonEmpty(env.RESEND_API_KEY);
  const email: EmailConfig = {
    configured: Boolean(
      resendKey &&
        from &&
        isFromAddress(from) &&
        recipients.length > 0 &&
        recipients.length <= 10 &&
        recipients.every(isEmail) &&
        (!replyTo || isEmail(replyTo)),
    ),
    apiKey: resendKey,
    from,
    recipients,
    replyTo,
    timeoutMs: boundedInteger(env.EMAIL_TIMEOUT_MS, 8_000, 100, 15_000),
    maxAttempts: boundedInteger(env.EMAIL_MAX_ATTEMPTS, 5, 1, 10),
  };

  const webhookUrl = validHttpsUrl(env.CRM_WEBHOOK_URL);
  const webhookSecret = nonEmpty(env.CRM_WEBHOOK_SECRET);
  const previousWebhookSecret = nonEmpty(env.CRM_WEBHOOK_PREVIOUS_SECRET);
  const mapping = parseMapping(env.CRM_FIELD_MAPPING_JSON);
  const webhook: WebhookConfig = {
    configured: Boolean(
      webhookUrl &&
        webhookSecret &&
        webhookSecret.length >= SIGNING_SECRET_MIN_LENGTH &&
        (!previousWebhookSecret || previousWebhookSecret.length >= SIGNING_SECRET_MIN_LENGTH) &&
        Object.keys(mapping).length > 0,
    ),
    url: webhookUrl,
    secret: webhookSecret,
    previousSecret: previousWebhookSecret,
    mapping,
    timeoutMs: boundedInteger(env.WEBHOOK_TIMEOUT_MS, 5_000, 100, 15_000),
    replayWindowSeconds: boundedInteger(env.WEBHOOK_REPLAY_WINDOW_SECONDS, 300, 30, 900),
    maxAttempts: boundedInteger(env.WEBHOOK_MAX_ATTEMPTS, 5, 1, 10),
  };

  const adminToken = nonEmpty(env.ADMIN_TOKEN);
  const demoSecret = nonEmpty(env.DEMO_GRANT_SECRET);
  const previousDemoSecret = nonEmpty(env.DEMO_GRANT_PREVIOUS_SECRET);
  const destinations = parseDestinations(env.DEMO_DESTINATIONS_JSON);
  const demo: DemoConfig = {
    configured: Boolean(
      adminToken &&
        adminToken.length >= ADMIN_TOKEN_MIN_LENGTH &&
        demoSecret &&
        demoSecret.length >= SIGNING_SECRET_MIN_LENGTH &&
        (!previousDemoSecret || previousDemoSecret.length >= SIGNING_SECRET_MIN_LENGTH) &&
        destinations.size > 0,
    ),
    adminToken,
    signingSecret: demoSecret,
    previousSigningSecret: previousDemoSecret,
    destinations,
    ttlHours: boundedInteger(env.DEMO_GRANT_TTL_HOURS, 168, 1, 720),
  };

  return {
    allowedOrigins,
    localOrigins,
    rateLimitPerMinute: boundedInteger(env.RATE_LIMIT_PER_MINUTE, 10, 1, 120),
    rateLimitWindowSeconds: boundedInteger(env.RATE_LIMIT_WINDOW_SECONDS, 60, 1, 3_600),
    turnstile,
    email,
    webhook,
    demo,
  };
}
