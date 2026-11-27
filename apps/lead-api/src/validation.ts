import { isEmail } from "./config";
import { isDemoProductId, isKnownProductId, isPublicPage } from "./contracts";

export const LEAD_INTENTS = [
  "product-enquiry",
  "demo",
  "consultation",
  "migration",
  "support",
  "partnership",
  "learning",
] as const;

export type LeadIntent = (typeof LEAD_INTENTS)[number];

export interface LeadInput {
  intent: LeadIntent;
  name: string;
  email: string;
  organization: string | null;
  productId: string | null;
  pagePath: string;
  sourceOrigin: string;
  message: string;
  consent: true;
  honeypot: string;
  locale: string;
  turnstileToken: string;
}

export interface ValidationResult {
  ok: boolean;
  value?: LeadInput;
  fields: string[];
}

const ALLOWED_FIELDS = new Set([
  "intent",
  "name",
  "email",
  "organization",
  "productId",
  "page",
  "message",
  "consent",
  "honeypot",
  "locale",
  "turnstileToken",
]);

function text(value: unknown, multiline: boolean): string | undefined {
  if (typeof value !== "string") return undefined;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(value)) return undefined;
  const normalized = value.normalize("NFC").replace(/\r\n?/g, "\n");
  if (!multiline) return normalized.replace(/\s+/gu, " ").trim();
  return normalized
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/gu, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function bounded(value: string | undefined, minimum: number, maximum: number): value is string {
  return value !== undefined && value.length >= minimum && value.length <= maximum;
}

function optionalText(value: unknown, maximum: number): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const normalized = text(value, false);
  return normalized === undefined || !bounded(normalized, 1, maximum) ? undefined : normalized;
}

function pageContext(
  value: unknown,
  sourceOrigin: string,
  allowedOrigins: ReadonlySet<string>,
): { pagePath: string; sourceOrigin: string } | undefined {
  if (typeof value !== "string" || value.length > 2_048 || /[\\\u0000-\u001f\u007f]/u.test(value)) return undefined;
  const candidate = value.trim();
  if (!candidate || (!candidate.startsWith("/") && !/^https?:\/\//i.test(candidate))) return undefined;
  try {
    const url = candidate.startsWith("/") ? new URL(candidate, sourceOrigin) : new URL(candidate);
    if (candidate.startsWith("//") || url.username || url.password || url.hash || url.origin !== sourceOrigin) return undefined;
    if (!allowedOrigins.has(url.origin)) return undefined;
    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//") || url.pathname.length > 2_048) return undefined;
    if (!isPublicPage(url.origin, url.pathname)) return undefined;
    return { pagePath: url.pathname, sourceOrigin: url.origin };
  } catch {
    return undefined;
  }
}

export function validateLeadPayload(payload: unknown, sourceOrigin: string, allowedOrigins: ReadonlySet<string>): ValidationResult {
  const fields = new Set<string>();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { ok: false, fields: ["body"] };
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).some((key) => !ALLOWED_FIELDS.has(key))) fields.add("unknown_fields");

  const intent = input.intent;
  if (typeof intent !== "string" || !(LEAD_INTENTS as readonly string[]).includes(intent)) fields.add("intent");

  const name = text(input.name, false);
  if (!bounded(name, 1, 120)) fields.add("name");

  const email = text(input.email, false)?.toLowerCase();
  if (!email || !isEmail(email)) fields.add("email");

  const organization = optionalText(input.organization, 160);
  if (organization === undefined) fields.add("organization");

  const optionalProductId = optionalText(input.productId, 80);
  const rawProductId = optionalProductId === null ? null : optionalProductId?.toLowerCase();
  if (
    rawProductId !== null &&
    (rawProductId === undefined || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(rawProductId) || !isKnownProductId(rawProductId))
  ) {
    fields.add("productId");
  }
  if (intent === "demo" && (typeof rawProductId !== "string" || !isDemoProductId(rawProductId))) fields.add("productId");

  const page = pageContext(input.page, sourceOrigin, allowedOrigins);
  if (!page) fields.add("page");

  const message = text(input.message, true);
  if (!bounded(message, 1, 4_000)) fields.add("message");
  if (input.consent !== true) fields.add("consent");

  const honeypot = text(input.honeypot, false);
  if (honeypot === undefined || honeypot.length > 256) fields.add("honeypot");

  const turnstileToken = input.turnstileToken;
  if (
    typeof turnstileToken !== "string" ||
    turnstileToken.length > 2_048 ||
    !/^\S+$/.test(turnstileToken)
  ) {
    fields.add("turnstileToken");
  }

  const locale = input.locale === undefined ? "en" : text(input.locale, false)?.replaceAll("_", "-").toLowerCase();
  if (!locale || locale.length > 35 || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(locale)) fields.add("locale");

  if (fields.size > 0 || !page || organization === undefined || rawProductId === undefined) {
    return { ok: false, fields: [...fields].sort() };
  }

  return {
    ok: true,
    fields: [],
    value: {
      intent: intent as LeadIntent,
      name: name!,
      email: email!,
      organization,
      productId: rawProductId,
      pagePath: page.pagePath,
      sourceOrigin,
      message: message!,
      consent: true,
      honeypot: honeypot!,
      locale: locale!,
      turnstileToken: turnstileToken as string,
    },
  };
}

export function validIdempotencyHeader(value: string | null): string | undefined {
  if (value === null) return undefined;
  return /^[A-Za-z0-9._:-]{8,200}$/.test(value) ? value : undefined;
}
